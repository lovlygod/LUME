const crypto = require('crypto');
const { getPubClient } = require('../redis');

const DIAGRAM_CACHE_TTL = 3600;
const MAX_CODE_LENGTH = 50000;
const KROKI_URL = 'https://kroki.io';

const SUPPORTED_TYPES = ['mermaid', 'graphviz', 'plantuml', 'wave', 'nomnoml', 'vega', 'vegalite'];

const diagramRouter = (config) => {
  const { authenticateToken, asyncHandler } = config;

  const router = require('express').Router();

  router.post('/diagram/render', authenticateToken, asyncHandler(async (req, res) => {
    const { code, type = 'mermaid' } = req.body || {};

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required' });
    }

    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({ error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters` });
    }

    if (!SUPPORTED_TYPES.includes(type)) {
      return res.status(400).json({ error: `Unsupported diagram type: ${type}. Supported: ${SUPPORTED_TYPES.join(', ')}` });
    }

    const codeHash = crypto.createHash('sha256').update(code + type).digest('hex');
    const cacheKey = `diagram:${codeHash}`;

    const pubClient = getPubClient();
    if (pubClient) {
      try {
        const cached = await pubClient.get(cacheKey);
        if (cached) {
          return res.json({ svg: cached, cached: true });
        }
      } catch (cacheErr) {
        console.warn('[Diagram] Cache read error:', cacheErr.message);
      }
    }

    let krokiType = type;
    if (type === 'graphviz') {
      krokiType = 'dot';
    }

    const krokiUrl = `${KROKI_URL}/${krokiType}/svg`;

    let fetchResponse;
    try {
      fetchResponse = await fetch(krokiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Accept': 'image/svg+xml',
        },
        body: code,
      });
    } catch (fetchErr) {
      console.error('[Diagram] Kroki fetch error:', fetchErr.message);
      return res.status(502).json({ error: 'Failed to render diagram' });
    }

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text().catch(() => 'Unknown error');
      console.error('[Diagram] Kroki error:', fetchResponse.status, errorText);
      return res.status(400).json({ error: 'Invalid diagram code' });
    }

    let svg;
    try {
      svg = await fetchResponse.text();
    } catch (textErr) {
      console.error('[Diagram] SVG parse error:', textErr.message);
      return res.status(502).json({ error: 'Failed to parse diagram response' });
    }

    if (!svg.includes('<svg')) {
      console.error('[Diagram] Invalid SVG response:', svg.slice(0, 200));
      return res.status(502).json({ error: 'Invalid diagram response' });
    }

    if (pubClient) {
      try {
        await pubClient.setex(cacheKey, DIAGRAM_CACHE_TTL, svg);
      } catch (cacheErr) {
        console.warn('[Diagram] Cache write error:', cacheErr.message);
      }
    }

    res.json({ svg });
  }));

  return router;
};

module.exports = diagramRouter;