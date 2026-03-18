/**
 * Open Graph Preview - РїРѕР»СѓС‡РµРЅРёРµ РјРµС‚Р°РґР°РЅРЅС‹С… СЃСЃС‹Р»РѕРє
 */

const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const dns = require('dns').promises;
const net = require('net');
const db = require('./db');

const PREVIEW_TTL_HOURS = 24;

const isPrivateIp = (ip) => {
  if (net.isIP(ip) === 4) {
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    return false;
  }
  if (net.isIP(ip) === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // ULA
    if (normalized.startsWith('fe80')) return true; // link-local
  }
  return false;
};

const isBlockedHostname = (hostname) => {
  const lower = hostname.toLowerCase();
  return lower === 'localhost' || lower.endsWith('.local');
};

const ensureSafeUrl = async (rawUrl) => {
  const parsedUrl = new URL(rawUrl);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Invalid protocol');
  }
  if (isBlockedHostname(parsedUrl.hostname)) {
    throw new Error('Blocked hostname');
  }
  const addresses = await dns.lookup(parsedUrl.hostname, { all: true });
  if (!addresses.length) {
    throw new Error('DNS lookup failed');
  }
  if (addresses.some((addr) => isPrivateIp(addr.address))) {
    throw new Error('Blocked IP');
  }
  return parsedUrl;
};

const normalizeUrl = (rawUrl) => {
  const normalized = new URL(rawUrl);
  normalized.hash = '';
  return normalized.toString();
};

const safeResolveUrl = (value, baseUrl) => {
  if (!value) return null;
  try {
    const resolved = new URL(value, baseUrl);
    if (!['http:', 'https:'].includes(resolved.protocol)) return null;
    return resolved.toString();
  } catch (error) {
    return null;
  }
};

const fetchCachedPreview = (urlHash) =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM link_previews WHERE url_hash = $1 AND fetched_at >= NOW() - ($2::interval)` ,
      [urlHash, `${PREVIEW_TTL_HOURS} hours`],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });

const savePreview = (preview) =>
  new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO link_previews
        (url_hash, url, domain, title, description, image_url, site_name, favicon_url, fetched_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (url_hash) DO UPDATE SET
         url = EXCLUDED.url,
         domain = EXCLUDED.domain,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         image_url = EXCLUDED.image_url,
         site_name = EXCLUDED.site_name,
         favicon_url = EXCLUDED.favicon_url,
         fetched_at = NOW()` ,
      [
        preview.urlHash,
        preview.url,
        preview.domain,
        preview.title,
        preview.description,
        preview.imageUrl,
        preview.siteName,
        preview.faviconUrl,
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });

/**
 * РџРѕР»СѓС‡РёС‚СЊ Open Graph РјРµС‚Р°РґР°РЅРЅС‹Рµ РёР· URL
 */
const getLinkPreview = async (url) => {
  try {
    const parsedUrl = await ensureSafeUrl(url);
    const normalizedUrl = normalizeUrl(parsedUrl.toString());
    const urlHash = crypto.createHash('sha256').update(normalizedUrl).digest('hex');

    const cached = await fetchCachedPreview(urlHash);
    if (cached) {
      return {
        success: true,
        data: {
          url: cached.url,
          domain: cached.domain,
          title: cached.title || null,
          description: cached.description || null,
          imageUrl: cached.image_url || null,
          siteName: cached.site_name || null,
          faviconUrl: cached.favicon_url || null,
        },
      };
    }

    // Р—Р°РїСЂРѕСЃ СЃС‚СЂР°РЅРёС†С‹ СЃ С‚Р°Р№РјР°СѓС‚РѕРј
    const fetchHtml = async () => {
      const response = await axios.get(normalizedUrl, {
        timeout: 6000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        maxRedirects: 3,
        validateStatus: (status) => status < 500,
      });

      const responseUrl = response?.request?.res?.responseUrl || normalizedUrl;
      await ensureSafeUrl(responseUrl);

      if (response.status >= 400) {
        const error = new Error(`Link preview request failed with status ${response.status}`);
        error.status = response.status;
        error.responseUrl = responseUrl;
        throw error;
      }

      return { html: response.data, responseUrl };
    };

    let html = '';
    let responseUrl = normalizedUrl;

    try {
      const fetched = await fetchHtml();
      html = fetched.html;
      responseUrl = fetched.responseUrl;
    } catch (error) {
      const status = error?.status ?? error?.response?.status;
      const shouldTryMirror = status === 401 || status === 403 || status === 429;
      if (!shouldTryMirror) {
        throw error;
      }

      const mirrorBase = normalizedUrl.startsWith('https://')
        ? 'https://r.jina.ai/https://'
        : 'https://r.jina.ai/http://';
      const mirrorUrl = `${mirrorBase}${normalizedUrl.replace(/^https?:\/\//, '')}`;
      const mirrorResponse = await axios.get(mirrorUrl, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        maxRedirects: 2,
        validateStatus: (statusCode) => statusCode < 500,
      });

      if (mirrorResponse.status >= 400) {
        throw error;
      }

      html = mirrorResponse.data;
      responseUrl = normalizedUrl;
    }
    const $ = cheerio.load(html);

    // РџРѕР»СѓС‡Р°РµРј Open Graph РґР°РЅРЅС‹Рµ
    const getMeta = (selectorList) => {
      for (const selector of selectorList) {
        const value = $(selector).attr('content');
        if (value && value.trim()) return value.trim();
      }
      return null;
    };

    const ogTitle = getMeta([
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'meta[property="twitter:title"]',
    ]);
    const ogDescription = getMeta([
      'meta[property="og:description"]',
      'meta[name="description"]',
      'meta[name="twitter:description"]',
      'meta[property="twitter:description"]',
    ]);
    const ogImage = getMeta([
      'meta[property="og:image"]',
      'meta[property="og:image:secure_url"]',
      'meta[name="twitter:image"]',
      'meta[property="twitter:image"]',
    ]);
    const ogUrl = getMeta([
      'meta[property="og:url"]',
    ]);
    const ogSiteName = getMeta([
      'meta[property="og:site_name"]',
      'meta[name="twitter:site"]',
      'meta[property="twitter:site"]',
    ]);

    const favicon =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href') ||
      null;

    // Fallback РЅР° РѕР±С‹С‡РЅС‹Рµ meta С‚РµРіРё РµСЃР»Рё РЅРµС‚ OG
    const title = (ogTitle || $('title').first().text() || '').trim();
    const description = (ogDescription || '').trim();
    const imageUrl = safeResolveUrl(
      ogImage || $('link[rel="image_src"]').attr('href') || null,
      responseUrl
    );
    const faviconUrl = safeResolveUrl(favicon, responseUrl);

    const domain = new URL(responseUrl).hostname;
    const siteName = ogSiteName || domain;

    const preview = {
      urlHash,
      url: ogUrl || responseUrl,
      domain,
      title: title || null,
      description: description || null,
      imageUrl,
      siteName: siteName || null,
      faviconUrl,
    };

    if (preview.imageUrl && preview.imageUrl.startsWith('/')) {
      try {
        preview.imageUrl = new URL(preview.imageUrl, responseUrl).toString();
      } catch (_error) {
        preview.imageUrl = null;
      }
    }

    await savePreview(preview);

    return {
      success: true,
      data: {
        url: preview.url,
        domain: preview.domain,
        title: preview.title,
        description: preview.description,
        imageUrl: preview.imageUrl,
        siteName: preview.siteName,
        faviconUrl: preview.faviconUrl,
      },
    };
  } catch (error) {
    console.error('Link preview error:', error.message);
    return {
      success: false,
      error: 'Failed to fetch link preview',
    };
  }
};

module.exports = {
  getLinkPreview,
};
