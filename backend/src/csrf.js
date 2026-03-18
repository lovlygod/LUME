/**
 * CSRF Protection Middleware РґР»СЏ LUME
 * РСЃРїРѕР»СЊР·СѓРµС‚ Double Submit Cookie pattern
 */

const crypto = require('crypto');

// РўРѕРєРµРЅС‹ РґР»СЏ СЃРµСЃСЃРёР№ (РІ РїР°РјСЏС‚Рё РґР»СЏ production Р»СѓС‡С€Рµ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ Redis)
const csrfTokens = new Map();

/**
 * Р“РµРЅРµСЂР°С†РёСЏ CSRF С‚РѕРєРµРЅР°
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Middleware РґР»СЏ РіРµРЅРµСЂР°С†РёРё CSRF С‚РѕРєРµРЅР°
 * Р”РѕР±Р°РІР»СЏРµС‚ С‚РѕРєРµРЅ РІ cookie Рё РґРµР»Р°РµС‚ РґРѕСЃС‚СѓРїРЅС‹Рј С‡РµСЂРµР· res.locals
 */
const generateCSRFTokenMiddleware = (req, res, next) => {
  // Р“РµРЅРµСЂРёСЂСѓРµРј С‚РѕРєРµРЅ РµСЃР»Рё РЅРµС‚
  let token = req.cookies?.csrfToken;
  
  if (!token) {
    token = generateCSRFToken();
  }
  
  const isProd = process.env.NODE_ENV === 'production';
  const isCrossSite = Boolean(process.env.FRONTEND_URL) || Boolean(process.env.FRONTEND_URLS);
  const cookieSecure = isCrossSite || isProd;
  const cookieSameSite = isCrossSite ? 'none' : (isProd ? 'strict' : 'lax');

  // РЈСЃС‚Р°РЅР°РІР»РёРІР°РµРј cookie (httpOnly: false, С‡С‚РѕР±С‹ JS РјРѕРі С‡РёС‚Р°С‚СЊ)
  res.cookie('csrfToken', token, {
    httpOnly: false, // JS РґРѕР»Р¶РµРЅ РёРјРµС‚СФРґРѕСЃС‚СѓРї
    secure: cookieSecure,
    sameSite: cookieSameSite,
    maxAge: 24 * 60 * 60 * 1000, // 24 С‡Р°СЃР°
    path: '/',
  });
  
  // РЎРѕС…СЂР°РЅСЏРµРј С‚РѕРєРµРЅ РґР»СЏ СЃРµСЃСЃРёРё
  const sessionId = req.sessionID || req.cookies?.sessionId || 'anonymous';
  csrfTokens.set(sessionId, token);
  
  next();
};

/**
 * Middleware РґР»СЏ РїСЂРѕРІРµСЂРєРё CSRF С‚РѕРєРµРЅР°
 * Р”РѕР»Р¶РµРЅ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊСЃСЏ РґР»СЏ РІСЃРµС… state-changing РѕРїРµСЂР°С†РёР№ (POST, PUT, DELETE, PATCH)
 */
const verifyCSRFToken = (req, res, next) => {
  // РџСЂРѕРїСѓСЃРєР°РµРј РґР»СЏ GET Р·Р°РїСЂРѕСЃРѕРІ
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // РџСЂРѕРїСѓСЃРєР°РµРј РґР»СЏ login/register (С‚Р°Рј РµС‰С‘ РЅРµС‚ СЃРµСЃСЃРёРё)
  // req.path РЅРµ РІРєР»СЋС‡Р°РµС‚ РїСЂРµС„РёРєСЃ СЂРѕСѓС‚РµСЂР° (/api)
  if (['/login', '/register', '/refresh'].includes(req.path)) {
    return next();
  }
  
  const tokenFromCookie = req.cookies?.csrfToken;
  const tokenFromHeader = req.headers['x-csrf-token'];
  const tokenFromBody = req.body?._csrf;
  
  // РўРѕРєРµРЅ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ Р»РёР±Рѕ РІ Р·Р°РіРѕР»РѕРІРєРµ, Р»РёР±Рѕ РІ С‚РµР»Рµ Р·Р°РїСЂРѕСЃР°
  const token = tokenFromHeader || tokenFromBody || tokenFromCookie;
  
  if (!token) {
    return res.status(403).json({
      error: {
        message: 'CSRF token missing',
        code: 'CSRF_TOKEN_MISSING',
        statusCode: 403,
      },
    });
  }
  
  if (!tokenFromCookie) {
    return res.status(403).json({
      error: {
        message: 'CSRF cookie missing',
        code: 'CSRF_COOKIE_MISSING',
        statusCode: 403,
      },
    });
  }
  
  // РЎСЂР°РІРЅРёРІР°РµРј С‚РѕРєРµРЅ РёР· Р·Р°РіРѕР»РѕРІРєР°/С‚РµР»Р° СЃ С‚РѕРєРµРЅРѕРј РёР· cookie
  if (token !== tokenFromCookie) {
    return res.status(403).json({
      error: {
        message: 'CSRF token mismatch',
        code: 'CSRF_TOKEN_MISMATCH',
        statusCode: 403,
      },
    });
  }
  
  // РџСЂРѕРІРµСЂСЏРµРј С‚РѕРєРµРЅ РІ С…СЂР°РЅРёР»РёС‰Рµ СЃРµСЃСЃРёР№
  const sessionId = req.sessionID || req.cookies?.sessionId || 'anonymous';
  const storedToken = csrfTokens.get(sessionId);
  
  if (storedToken && storedToken !== token) {
    return res.status(403).json({
      error: {
        message: 'Invalid CSRF session token',
        code: 'CSRF_INVALID_SESSION',
        statusCode: 403,
      },
    });
  }
  
  next();
};

/**
 * Middleware РґР»СЏ РїРѕР»СѓС‡РµРЅРёСЏ РЅРѕРІРѕРіРѕ CSRF С‚РѕРєРµРЅР°
 * РњРѕР¶РЅРѕ РІС‹Р·РІР°С‚СЊ С‡РµСЂРµР· GET /api/csrf-token
 */
const refreshCSRFToken = (req, res) => {
  const newToken = generateCSRFToken();
  
  const isProd = process.env.NODE_ENV === 'production';
  const isCrossSite = Boolean(process.env.FRONTEND_URL) || Boolean(process.env.FRONTEND_URLS);
  const cookieSecure = isCrossSite || isProd;
  const cookieSameSite = isCrossSite ? 'none' : (isProd ? 'strict' : 'lax');

  res.cookie('csrfToken', newToken, {
    httpOnly: false,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
  
  const sessionId = req.sessionID || req.cookies?.sessionId || 'anonymous';
  csrfTokens.set(sessionId, newToken);
  
  res.json({ csrfToken: newToken });
};

/**
 * РћС‡РёСЃС‚РєР° CSRF С‚РѕРєРµРЅР° РїСЂРё logout
 */
const clearCSRFToken = (req, res, next) => {
  const sessionId = req.sessionID || req.cookies?.sessionId || 'anonymous';
  csrfTokens.delete(sessionId);
  
  res.clearCookie('csrfToken', { path: '/' });
  
  next();
};

/**
 * РћС‡РёСЃС‚РєР° СЃС‚Р°СЂС‹С… С‚РѕРєРµРЅРѕРІ (РєР°Р¶РґС‹Рµ 5 РјРёРЅСѓС‚)
 */
setInterval(() => {
  // РћС‡РёС‰Р°РµРј С‚РѕРєРµРЅС‹ СЃС‚Р°СЂС€Рµ 1 С‡Р°СЃР°
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  // Р’ production Р»СѓС‡С€Рµ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ Redis СЃ TTL
  // Р”Р»СЏ РїСЂРѕСЃС‚РѕС‚С‹ РїСЂРѕСЃС‚Рѕ РѕРіСЂР°РЅРёС‡РёРІР°РµРј СЂР°Р·РјРµСЂ Map
  if (csrfTokens.size > 10000) {
    const entries = Array.from(csrfTokens.entries());
    const toDelete = entries.slice(0, entries.length - 5000);
    toDelete.forEach(([key]) => csrfTokens.delete(key));
  }
}, 5 * 60 * 1000);

module.exports = {
  generateCSRFTokenMiddleware,
  verifyCSRFToken,
  refreshCSRFToken,
  clearCSRFToken,
};
