const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const axios = require('axios');
const UAParser = require('ua-parser-js');
const db = require('./db');
const { ValidationError, ConflictError, AuthError, InternalError, TooManyRequestsError } = require('./errors');
const { logger } = require('./logger');
const { audit } = require('./audit');
const { resetRateLimit } = require('./rateLimiter');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required. Set it in backend/.env before starting the server.');
}
const REFRESH_TOKEN_EXPIRY_DAYS = 30; // Refresh token lives for 30 days

// Cookie options for httpOnly tokens
const isProd = process.env.NODE_ENV === 'production';
const isCrossSite = Boolean(process.env.FRONTEND_URL || process.env.FRONTEND_URLS) && !String(process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '').includes('localhost');
const COOKIE_SECURE = isCrossSite || isProd;
const COOKIE_SAMESITE = isProd ? 'none' : (isCrossSite ? 'none' : 'lax');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: COOKIE_SAMESITE,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
  path: '/'
};

// Валидация username: минимум 5 символов, только английские буквы и цифры
const validateUsername = (username) => {
  if (!username || username.length < 5) {
    return { valid: false, error: 'Username must be at least 5 characters long' };
  }

  const usernameRegex = /^[a-zA-Z0-9]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, error: 'Username can only contain English letters and numbers' };
  }

  return { valid: true };
};

// Register new user
const register = async (req, res, next) => {
  const { email, password, name, username } = req.body;

  try {
    // Validate input
    if (!email || !password || !name || !username) {
      throw new ValidationError('All fields are required', {
        missingFields: ['email', 'password', 'name', 'username'].filter(f => !req.body[f]),
      });
    }

    // Validate username
    const validation = validateUsername(username);
    if (!validation.valid) {
      throw new ValidationError(validation.error, { field: 'username' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const query = `
      INSERT INTO users (email, password_hash, name, username)
      VALUES ($1, $2, $3, $4)
    `;

    const userId = await new Promise((resolve, reject) => {
      db.run(query, [email, hashedPassword, name, username], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            const field = err.message.includes('email') ? 'email' : 'username';
            reject(new ConflictError(`${field === 'email' ? 'Email' : 'Username'} already exists`, 'UNIQUE_CONSTRAINT', { field }));
          } else {
            logger.errors.database(err, query);
            reject(new InternalError('Database error'));
          }
        } else {
          resolve(this.lastID);
        }
      });
    });

    // Create JWT access token (24h)
    const accessToken = jwt.sign(
      { userId, email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate refresh token
    const refreshToken = await generateRefreshToken(userId, req);

    // Set httpOnly cookies
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAMESITE,
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Log successful registration
    logger.auth.register(userId, email, req.ip);

    // Audit log (non-blocking, don't wait)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    audit.register(userId, email, ip).catch(err => {
      console.error('Audit register error:', err);
    });

    // Reset rate limit on successful registration (non-blocking)
    resetRateLimit(ip, 'register').catch(err => {
      console.error('Reset rate limit error:', err);
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        email,
        name,
        username,
        verified: false
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      throw new ValidationError('Email and password are required', {
        missingFields: ['email', 'password'].filter(f => !req.body[f]),
      });
    }

    const user = await new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE email = $1';
      db.get(query, [email], (err, user) => {
        if (err) return reject(err);
        resolve(user);
      });
    });

    if (!user) {
      logger.auth.login(null, false, req.ip);
      throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      logger.auth.login(user.id, false, req.ip);
      throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Create JWT access token (24h)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate refresh token
    const refreshToken = await generateRefreshToken(user.id, req);

    // Set httpOnly cookies
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAMESITE,
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Log successful login (non-blocking)
    logger.auth.login(user.id, true, req.ip);

    // Audit log (non-blocking, don't wait)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    audit.login(user.id, true, ip, req.get('user-agent')).catch(err => {
      console.error('Audit login error:', err);
    });

    // Reset rate limit on successful login
    resetRateLimit(ip, 'login').catch(err => {
      console.error('Reset rate limit error:', err);
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        banner: user.banner,
        verified: user.verified === 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// Middleware to verify JWT token + active session
const authenticateToken = (req, res, next) => {
  // Try to get token from Authorization header first, then from cookie
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Fallback to cookie if no header
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new AuthError('Access token required', 'AUTH_REQUIRED');
  }

  const refreshToken = req.cookies?.refreshToken;

  const verifyJwt = () => {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return next(new AuthError('Token expired', 'TOKEN_EXPIRED'));
        }
        return next(new AuthError('Invalid token', 'INVALID_TOKEN'));
      }
      req.user = user;
      next();
    });
  };

  if (!refreshToken) {
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('token', { path: '/' });
    return next(new AuthError('Session revoked', 'SESSION_REVOKED'));
  }

  db.get(
    'SELECT token FROM refresh_tokens WHERE token = $1 AND expires_at > $2 LIMIT 1',
    [refreshToken, new Date().toISOString()],
    (err, row) => {
      if (err) {
        res.clearCookie('refreshToken', { path: '/' });
        res.clearCookie('token', { path: '/' });
        return next(new AuthError('Invalid token', 'INVALID_TOKEN'));
      }
      if (!row) {
        res.clearCookie('refreshToken', { path: '/' });
        res.clearCookie('token', { path: '/' });
        return next(new AuthError('Session revoked', 'SESSION_REVOKED'));
      }
      return verifyJwt();
    }
  );
};

// Middleware to set access token cookie
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    maxAge: 24 * 60 * 60 * 1000, // 24 часа
    path: '/'
  });
};

// Generate refresh token
const generateRefreshToken = (userId, req) => {
  return new Promise((resolve, reject) => {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    const forwardedFor = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim();
    const rawIp = forwardedFor || req?.socket?.remoteAddress || req?.ip || null;
    const ipAddress = rawIp === '::1' ? '127.0.0.1' : rawIp;
    const userAgent = req?.get?.('user-agent') || req?.headers?.['user-agent'] || null;

    const parser = new UAParser(userAgent || undefined);
    const result = parser.getResult();
    const deviceType = result.device?.type || 'desktop';
    const deviceModel = [result.device?.vendor, result.device?.model].filter(Boolean).join(' ').trim();
    const deviceName = deviceModel || (deviceType === 'mobile' ? 'Mobile' : deviceType === 'tablet' ? 'Tablet' : 'Desktop');
    const browserName = result.browser?.name || 'Unknown';
    const osName = result.os?.name || 'Unknown';

    const saveTokenWithGeo = (geo) => {
      // Insert new refresh token
      db.run(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, token, expiresAt.toISOString()],
        (err) => {
          if (err) return reject(err);
          db.run(
            `INSERT INTO sessions (user_id, token, ip_address, user_agent, device, browser, os, location, city, country, region, provider, last_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
            [
              userId,
              token,
              ipAddress,
              userAgent,
              deviceName,
              browserName,
              osName,
              geo ? [geo.city, geo.country].filter(Boolean).join(', ') || geo.region || null : null,
              geo?.city || null,
              geo?.country || null,
              geo?.region || null,
              geo?.provider || null,
            ],
            (sessionErr) => {
              if (sessionErr) return reject(sessionErr);
              resolve(token);
            }
          );
        }
      );
    };

    const isLocalIp = (ip) => {
      if (!ip) return true;
      if (ip === '127.0.0.1' || ip === '::1') return true;
      if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
      const parts = ip.split('.').map(Number);
      if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      return false;
    };

    if (!ipAddress) {
      logger.warn('[AUTH] Missing IP address for session creation');
      saveTokenWithGeo(null);
      return;
    }

    if (isLocalIp(ipAddress)) {
      saveTokenWithGeo({ city: null, country: null, region: null, provider: null });
      return;
    }

    const ipinfoToken = process.env.IPINFO_TOKEN;
    const ipapiUrl = `https://ipapi.co/${ipAddress}/json/`;
    const ipinfoUrl = `https://ipinfo.io/${ipAddress}/json${ipinfoToken ? `?token=${ipinfoToken}` : ''}`;

    const normalizeCountry = (value) => {
      if (!value) return null;
      if (value.length === 2) return value;
      return value;
    };

    const locationFromData = (data) => {
      if (!data) return null;
      const city = data.city || data.town || null;
      const region = data.region || null;
      const country = data.country_name || data.country || null;
      const provider = data.org || null;
      const normalizedCountry = normalizeCountry(country);
      return { city, region, country: normalizedCountry, provider };
    };

    const readGeoCache = () => new Promise((resolve) => {
      db.get(
        'SELECT city, country, region, provider, fetched_at FROM ip_geo_cache WHERE ip = $1',
        [ipAddress],
        (err, row) => {
          if (err || !row) return resolve(null);
          const fetchedAt = row.fetched_at ? new Date(row.fetched_at).getTime() : 0;
          if (!fetchedAt || Date.now() - fetchedAt > 24 * 60 * 60 * 1000) {
            return resolve(null);
          }
          resolve({
            city: row.city || null,
            country: row.country || null,
            region: row.region || null,
            provider: row.provider || null,
          });
        }
      );
    });

    const writeGeoCache = (geo) => new Promise((resolve) => {
      if (!geo) return resolve();
      db.run(
        `INSERT INTO ip_geo_cache (ip, city, country, region, provider, fetched_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT(ip) DO UPDATE SET
           city = EXCLUDED.city,
           country = EXCLUDED.country,
           region = EXCLUDED.region,
           provider = EXCLUDED.provider,
           fetched_at = NOW()`,
        [ipAddress, geo.city, geo.country, geo.region, geo.provider],
        () => resolve()
      );
    });

    readGeoCache()
      .then((cached) => {
        if (cached) {
          saveTokenWithGeo(cached);
          return;
        }
        return axios.get(ipinfoUrl, { timeout: 2500 })
          .then((response) => locationFromData(response.data))
          .catch(() => null)
          .then((geo) => {
            if (geo) {
              writeGeoCache(geo).then(() => saveTokenWithGeo(geo));
              return;
            }
            return axios.get(ipapiUrl, { timeout: 2500 })
              .then((response) => locationFromData(response.data))
              .catch(() => null)
              .then((fallbackGeo) => {
                if (fallbackGeo) {
                  writeGeoCache(fallbackGeo).then(() => saveTokenWithGeo(fallbackGeo));
                } else {
                  saveTokenWithGeo(null);
                }
              });
          });
      });
  });
};

// Verify and get user from refresh token
const verifyRefreshToken = (refreshToken) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > $2',
      [refreshToken, new Date().toISOString()],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(row);
      }
    );
  });
};

// Delete refresh token (logout)
const deleteRefreshToken = (refreshToken) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken], (err) => {
      if (err) return reject(err);
      db.run('DELETE FROM sessions WHERE token = $1', [refreshToken], (sessionErr) => {
        if (sessionErr) return reject(sessionErr);
        resolve();
      });
    });
  });
};

// Delete all refresh tokens for user
const deleteAllUserRefreshTokens = (userId) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM refresh_tokens WHERE user_id = $1', [userId], (err) => {
      if (err) return reject(err);
      db.run('DELETE FROM sessions WHERE user_id = $1', [userId], (sessionErr) => {
        if (sessionErr) return reject(sessionErr);
        resolve();
      });
    });
  });
};

module.exports = {
  register,
  login,
  authenticateToken,
  setTokenCookie,
  validateUsername,
  generateRefreshToken,
  verifyRefreshToken,
  deleteRefreshToken,
  deleteAllUserRefreshTokens
};
