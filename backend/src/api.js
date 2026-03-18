const express = require('express');
const { authenticateToken, generateRefreshToken, verifyRefreshToken, deleteRefreshToken, deleteAllUserRefreshTokens, login, register } = require('./auth');
const { loginLimiter, registerLimiter } = require('./rateLimiter');
const {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  uploadBanner,
  upload
} = require('./profile');
const { upload: fileUpload, uploadFile, voiceUpload, uploadVoiceMessage } = require('./uploads');
const crypto = require('crypto');
const { getPublicBaseUrl } = require('./utils/baseUrl');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const os = require('os');
const { asyncHandler, ValidationError, AuthError, InternalError, ServiceError } = require('./errors');
const { logger } = require('./logger');
const { verifyCSRFToken } = require('./csrf');
const { indexMessage } = require('./search/messagesSearch');
const developerPlatformRoutes = require('./developerPlatform');
const developerApiRoutes = require('./developerApi');

// Helper function to extract @mentions from text
function extractMentions(text) {
  if (!text) return [];
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
}

// Create notifications for mentioned users
async function createMentionNotifications(text, authorId, options, req) {
  const mentions = extractMentions(text);
  if (mentions.length === 0) return;
  
  const createNotification = req.app.get('createNotification');
  if (!createNotification) return;
  
  // Find mentioned users
  const db = require('./db');
  const placeholders = mentions.map((_, idx) => `$${idx + 1}`).join(',');
  
  await new Promise((resolve) => {
    db.all(
      `SELECT id, username FROM users WHERE username IN (${placeholders})`,
      mentions,
      (err, users) => {
        if (err || !users) {
          resolve();
          return;
        }
        
        // Create notification for each mentioned user (except author)
        users.forEach(user => {
          if (user.id !== authorId) {
            createNotification({
              userId: user.id,
              type: 'mention',
              actorId: options?.actorId || authorId,
              actorUsername: options?.actorUsername || null,
              actorAvatar: options?.actorAvatar || null,
              targetId: options?.targetId || null,
              targetType: options?.targetType || null,
              message: options?.message || null,
              url: options?.url || null,
            }).catch(err => {
              console.error('[API] Error creating mention notification:', err);
            });
          }
        });
        resolve();
      }
    );
  });
}

const router = express.Router();
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();

const STICKERS_BASE_DIR = path.resolve(__dirname, '../../src/assets/stickers');
const STICKER_BOT_ID = 999;
const STICKER_BOT_USERNAME = 'stickers';
const STICKER_BOT_STEPS = {
  IDLE: 'idle',
  CREATING_PACK: 'creating_pack',
  UPLOADING: 'uploading',
  READY_TO_PUBLISH: 'ready_to_publish'
};
const STICKER_BOT_LIMITS = {
  maxStickers: 60,
  maxFileSize: 512 * 1024
};

const INVITE_TOKEN_LENGTH = 16;
const INVITE_TOKEN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const PUBLIC_NUMBER_LENGTH = 7;
const PUBLIC_NUMBER_MAX = Math.pow(10, PUBLIC_NUMBER_LENGTH) - 1;

const generateInviteToken = () => {
  let token = '';
  while (token.length < INVITE_TOKEN_LENGTH) {
    const bytes = crypto.randomBytes(INVITE_TOKEN_LENGTH);
    for (let i = 0; i < bytes.length && token.length < INVITE_TOKEN_LENGTH; i += 1) {
      token += INVITE_TOKEN_CHARS[bytes[i] % INVITE_TOKEN_CHARS.length];
    }
  }
  return token;
};

const generatePublicNumber = () => {
  const value = crypto.randomInt(0, PUBLIC_NUMBER_MAX + 1);
  return String(value).padStart(PUBLIC_NUMBER_LENGTH, '0');
};

const normalizeUsername = (value) => String(value || '').trim().replace(/^@+/, '').toLowerCase();
const isChatUsernameValid = (value) => /^[a-z0-9]{5,}$/i.test(String(value || ''));

const stickerFileCache = new Map();
const STICKER_CACHE_MAX = 200;

const normalizeStickerFileName = (value) => String(value || '')
  .trim()
  .replace(/\s+/g, '_')
  .replace(/[^a-zA-Z0-9_-]/g, '_')
  .toLowerCase();

const buildStickerKey = (packName, stickerName) => `${normalizeStickerFileName(packName)}_${normalizeStickerFileName(stickerName)}`;

const normalizeStickerSlug = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-+|-+$/g, '');

const ensureUniqueStickerSlug = async (baseSlug) => {
  const safeBase = baseSlug || 'sticker-pack';
  let candidate = safeBase;
  let counter = 1;
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await new Promise((resolve) => {
      db.get('SELECT id FROM sticker_packs WHERE slug = $1', [candidate], (err, row) => {
        if (err) return resolve(false);
        resolve(!!row);
      });
    });
    if (!exists) return candidate;
    counter += 1;
    candidate = `${safeBase}-${counter}`;
  }
};

const resolveStickerAssetPath = (filePath) => {
  const safePath = path.normalize(filePath).replace(/^([/\\])+/, '');
  const resolved = path.join(STICKERS_BASE_DIR, safePath);
  if (!resolved.startsWith(STICKERS_BASE_DIR)) {
    throw new Error('Invalid sticker path');
  }
  return resolved;
};

const cacheStickerBuffer = (id, buffer) => {
  if (stickerFileCache.size >= STICKER_CACHE_MAX) {
    const firstKey = stickerFileCache.keys().next().value;
    if (firstKey) stickerFileCache.delete(firstKey);
  }
  stickerFileCache.set(id, { buffer, cachedAt: Date.now() });
};

const scanStickerAssets = () => {
  if (!fs.existsSync(STICKERS_BASE_DIR)) {
    return [];
  }
  const packs = fs.readdirSync(STICKERS_BASE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const results = [];
  packs.forEach((packName) => {
    const packDir = path.join(STICKERS_BASE_DIR, packName);
    const files = fs.readdirSync(packDir)
      .filter((file) => file.toLowerCase().endsWith('.png'));
    files.forEach((fileName) => {
      results.push({
        packName,
        stickerName: path.parse(fileName).name,
        filePath: path.join(packName, fileName).replace(/\\/g, '/'),
      });
    });
  });
  return results;
};

const ensureStickerSchema = async () => {
  const runStatement = (sql) => new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  await runStatement(`
    CREATE TABLE IF NOT EXISTS sticker_packs (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT,
      description TEXT,
      author TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runStatement(`
    CREATE TABLE IF NOT EXISTS stickers (
      id BIGSERIAL PRIMARY KEY,
      pack_id BIGINT NOT NULL REFERENCES sticker_packs(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runStatement(`
    CREATE TABLE IF NOT EXISTS user_sticker_packs (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pack_id BIGINT NOT NULL REFERENCES sticker_packs(id) ON DELETE CASCADE,
      added_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, pack_id)
    )
  `);

  await runStatement(`
    ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS sticker_id BIGINT REFERENCES stickers(id) ON DELETE SET NULL
  `);

  await runStatement('CREATE INDEX IF NOT EXISTS idx_stickers_pack_id ON stickers(pack_id)');
  await runStatement('CREATE UNIQUE INDEX IF NOT EXISTS idx_sticker_packs_slug ON sticker_packs(slug)');
  await runStatement('CREATE INDEX IF NOT EXISTS idx_user_sticker_packs_user_id ON user_sticker_packs(user_id)');
  await runStatement(`
    CREATE TABLE IF NOT EXISTS sticker_bot_sessions (
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      step TEXT NOT NULL DEFAULT 'idle',
      pack_name TEXT,
      stickers_temp TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

const ensureStickerData = async () => {
  await ensureStickerSchema();
  const assets = scanStickerAssets();
  if (assets.length === 0) return;

  const packsByName = await new Promise((resolve) => {
    db.all('SELECT id, name FROM sticker_packs', (err, rows) => {
      if (err || !rows) return resolve(new Map());
      const map = new Map();
      rows.forEach((row) => map.set(row.name, row.id));
      resolve(map);
    });
  });

  for (const { packName, stickerName, filePath } of assets) {
    let packId = packsByName.get(packName);
    if (!packId) {
      packId = await new Promise((resolve, reject) => {
        const slug = normalizeStickerSlug(packName);
        db.run(
          'INSERT INTO sticker_packs (name, slug, description, author) VALUES ($1, $2, $3, $4)',
          [packName, slug || null, `Sticker pack ${packName}`, 'LUME'],
          function(err) {
            if (err) return reject(err);
            resolve(this.lastID);
          }
        );
      });
      packsByName.set(packName, packId);
    }

    await new Promise((resolve) => {
      db.get(
        'SELECT id FROM stickers WHERE pack_id = $1 AND name = $2',
        [packId, stickerName],
        (err, row) => {
          if (err) return resolve();
          if (row) return resolve();
          db.run(
            'INSERT INTO stickers (pack_id, name, file_path) VALUES ($1, $2, $3)',
            [packId, stickerName, filePath],
            () => resolve()
          );
        }
      );
    });
  }
};

const momentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../moment-uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  }
});

const momentUpload = multer({
  storage: momentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

const stickerUploadStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(__dirname, '../sticker-uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `sticker-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  }
});

const stickerUpload = multer({
  storage: stickerUploadStorage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.png', '.webp', '.gif'];
    if (!allowed.includes(ext)) {
      return cb(new Error('Sticker format not allowed'));
    }
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Sticker format not allowed'));
    }
    return cb(null, true);
  },
  limits: {
    fileSize: STICKER_BOT_LIMITS.maxFileSize,
    files: 60
  }
});

// Test route - самый первый роут

// Helper function to get broadcast function from server
const getBroadcast = (req) => {
  return req.app.get('broadcast');
};

const getSendToUser = (req) => {
  return req.app.get('sendToUser');
};

// Authentication routes (должны быть ДО CSRF middleware)
router.post('/register', registerLimiter, asyncHandler(register));

router.post('/login', loginLimiter, login);

// Refresh access token - gets refresh token from httpOnly cookie (должен быть ДО CSRF middleware)
router.post('/refresh', asyncHandler(async (req, res) => {
  // Get refresh token from cookie
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.clearCookie('refreshToken', { path: '/', sameSite: 'none', secure: true });
    res.clearCookie('token', { path: '/', sameSite: 'none', secure: true });
    return res.status(204).end();
  }

  // Verify refresh token
  const tokenData = await verifyRefreshToken(refreshToken);

  if (!tokenData) {
    logger.auth.tokenRefresh(null, false);
    res.clearCookie('refreshToken', { path: '/', sameSite: 'none', secure: true });
    res.clearCookie('token', { path: '/', sameSite: 'none', secure: true });
    throw new AuthError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }

  // Get user info
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT id, email FROM users WHERE id = $1', [tokenData.user_id], (err, user) => {
      if (err) reject(err);
      else resolve(user);
    });
  });

  if (!user) {
    throw new InternalError('User not found');
  }

  // Generate new access token (24h)
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Set new access token cookie
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  });

  // Log successful token refresh
  logger.auth.tokenRefresh(user.id, true);

  res.json({
    message: 'Token refreshed successfully',
    token: accessToken
  });
}));

// Logout - invalidate refresh token and clear cookies (должен быть ДО CSRF middleware)
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // Delete only current session refresh token
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await deleteRefreshToken(refreshToken);
  }

  // Clear cookies
  res.clearCookie('refreshToken', { path: '/', sameSite: 'none', secure: true });
  res.clearCookie('token', { path: '/', sameSite: 'none', secure: true });

  // Log logout
  logger.auth.logout(req.user.userId, req.ip);

  res.json({ message: 'Logged out successfully' });
}));

// Endpoint для получения CSRF токена (если нужно обновить)
router.get('/csrf-token', (req, res) => {
  const { refreshCSRFToken } = require('./csrf');
  refreshCSRFToken(req, res);
});

// CSRF protection for state-changing requests
router.post('*', (req, res, next) => {
  const csrfExclusions = new Set(['/login', '/register', '/refresh', '/logout', '/csrf-token']);
  if (req.path.startsWith('/developer/')) {
    return next();
  }
  if (csrfExclusions.has(req.path)) {
    return next();
  }
  verifyCSRFToken(req, res, next);
});
router.put('*', (req, res, next) => {
  verifyCSRFToken(req, res, next);
});
router.delete('*', (req, res, next) => {
  verifyCSRFToken(req, res, next);
});
router.patch('*', verifyCSRFToken);

// Developer platform routes
router.use('/developer', developerPlatformRoutes);

// Developer public API routes
router.use('/developer-api', developerApiRoutes);

// Profile routes (protected)
router.get('/profile/:userId', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateUserProfile);
router.post('/profile/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);
router.post('/profile/banner', authenticateToken, upload.single('banner'), uploadBanner);

// Sessions: list active sessions
router.get('/sessions', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    db.run('UPDATE sessions SET last_active = NOW() WHERE token = $1', [refreshToken], () => {});
  }

  db.all(
    `SELECT id, device, browser, os, ip_address, location, last_active, token, city, country, region, provider
     FROM sessions
     WHERE user_id = $1
     ORDER BY last_active DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const normalizeIp = (ip) => (ip === '::1' ? '127.0.0.1' : ip);
      const isLocalIp = (ip) => {
        if (!ip) return true;
        if (ip === '127.0.0.1' || ip === '::1') return true;
        if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
        const parts = ip.split('.').map(Number);
        if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        return false;
      };

      const sessions = rows.map((row) => {
        const normalizedIp = normalizeIp(row.ip_address);
        const localIp = isLocalIp(normalizedIp);
        return {
          id: row.id.toString(),
          device: row.device ? `${row.browser || row.device} on ${row.os || 'Unknown'}` : `${row.browser || 'Unknown'} on ${row.os || 'Unknown'}`,
          browser: row.browser || 'Unknown',
          os: row.os || 'Unknown',
          ip: normalizedIp,
          city: row.city || null,
          country: row.country || null,
          region: row.region || null,
          provider: row.provider || null,
          location: row.location || (localIp ? 'Local network' : null),
          lastActive: row.last_active,
          current: refreshToken ? row.token === refreshToken : false
        };
      });

      res.json({ sessions });
    }
  );
}));

// Sessions: delete one session
router.delete('/sessions/:sessionId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const sessionId = parseInt(req.params.sessionId);
  const currentToken = req.cookies?.refreshToken;

  if (!Number.isInteger(sessionId)) {
    return res.status(400).json({ error: 'Invalid session id' });
  }

  db.get('SELECT id, token FROM sessions WHERE id = $1 AND user_id = $2', [sessionId, userId], async (err, sessionRow) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!sessionRow) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (currentToken && sessionRow.token === currentToken) {
      return res.status(400).json({ error: 'Cannot delete current session' });
    }

    try {
      await deleteRefreshToken(sessionRow.token);
    } catch (deleteErr) {
      return res.status(500).json({ error: 'Failed to delete session' });
    }

    const sendToUser = req.app.get('sendToUser');
    const clients = req.app.get('clients');
    if (clients && clients.size > 0) {
      clients.forEach((userClients) => {
        userClients.forEach((client) => {
          if (client.readyState === 1 && client.userId?.toString() === userId.toString()) {
            if (client.sessionToken && client.sessionToken === sessionRow.token) {
              client.send(JSON.stringify({
                type: 'session_terminated',
                data: { sessionId: sessionId.toString() }
              }));
              client.close(4001, 'Session terminated');
            }
          }
        });
      });
    } else if (sendToUser) {
      sendToUser(userId, {
        type: 'session_terminated',
        data: { sessionId: sessionId.toString() }
      });
    }

    res.json({ message: 'Session terminated' });
  });
}));

// Sessions: logout all other sessions
router.post('/sessions/logout-all', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const currentToken = req.cookies?.refreshToken;

  if (!currentToken) {
    return res.status(400).json({ error: 'Current session not found' });
  }

  db.all('SELECT token, id FROM sessions WHERE user_id = $1 AND token != $2', [userId, currentToken], async (err, sessions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    try {
      for (const session of sessions) {
        await deleteRefreshToken(session.token);
      }
    } catch (deleteErr) {
      return res.status(500).json({ error: 'Failed to terminate sessions' });
    }

    const sendToUser = req.app.get('sendToUser');
    const clients = req.app.get('clients');
    if (clients && clients.size > 0) {
      clients.forEach((userClients) => {
        userClients.forEach((client) => {
          if (client.readyState === 1 && client.userId?.toString() === userId.toString()) {
            if (client.sessionToken && client.sessionToken !== currentToken) {
              client.send(JSON.stringify({
                type: 'session_terminated',
                data: { logoutAll: true }
              }));
              client.close(4001, 'Session terminated');
            }
          }
        });
      });
    } else if (sendToUser) {
      sendToUser(userId, {
        type: 'session_terminated',
        data: { logoutAll: true }
      });
    }

    res.json({ message: 'Sessions terminated' });
  });
}));

// Delete account (permanent)
router.delete('/profile', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  // Verify password
  db.get('SELECT password_hash FROM users WHERE id = $1', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check password
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Start deleting user data in correct order (respecting foreign keys)
    const deleteQueries = [
      'DELETE FROM comments WHERE user_id = $1',
      'DELETE FROM likes WHERE user_id = $1',
      'DELETE FROM posts WHERE user_id = $1',
      'DELETE FROM followers WHERE follower_id = $1 OR following_id = $2',
      'DELETE FROM chat_members WHERE user_id = $1',
      'DELETE FROM chats WHERE owner_id = $1',
      'DELETE FROM messages WHERE sender_id = $1',
      'DELETE FROM verification_requests WHERE user_id = $1',
      'DELETE FROM post_reports WHERE reporter_id = $1',
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      'DELETE FROM users WHERE id = $1'
    ];

    const runDelete = (index) => {
      if (index >= deleteQueries.length) {
        // All deletions complete
        const broadcast = req.app.get('broadcast');
        if (broadcast) {
          // Notify all clients that this user was deleted
          broadcast({
            type: 'user_deleted',
            data: { userId: userId.toString() }
          });
        }

        return res.json({ message: 'Account deleted permanently' });
      }

      const query = deleteQueries[index];
      const params = query.includes('follower_id = $1 OR following_id')
        ? [userId, userId]
        : [userId];

      db.run(query, params, (err) => {
        if (err) {
          console.error('Delete error at step', index, ':', err);
          return res.status(500).json({ error: 'Failed to delete account' });
        }
        runDelete(index + 1);
      });
    };

    runDelete(0);
  });
});

// Get current user's profile
router.get('/profile', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT id, email, name, username, bio, city, website, pinned_post_id,
           avatar, banner, verified, followers_count, join_date, created_at
    FROM users
    WHERE id = $1
  `;

  db.get(query, [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get following count
    const followingQuery = 'SELECT COUNT(*) as count FROM followers WHERE follower_id = $1';
    db.get(followingQuery, [userId], (err, followingResult) => {
      const followingCount = followingResult ? followingResult.count : 0;

      res.json({
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          username: user.username,
          bio: user.bio,
          city: user.city,
          website: user.website,
          pinned_post_id: user.pinned_post_id ? user.pinned_post_id.toString() : null,
          avatar: user.avatar,
          banner: user.banner,
          verified: user.verified === 1,
          followers_count: user.followers_count || 0,
          following_count: followingCount,
          joinDate: user.join_date
        }
      });
    });
  });
});

// Get user's posts
router.get('/users/:userId/posts', authenticateToken, (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT p.id, p.user_id, p.text, p.image_url, p.timestamp, p.replies_count AS replies, p.reposts_count AS reposts, p.resonance_count AS resonance, u.name, u.username, u.avatar, u.verified
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = $1
    ORDER BY p.timestamp DESC
  `;

  db.all(query, [parseInt(userId)], (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Преобразуем user_id в строку для корректной работы на frontend
    const formattedPosts = posts.map(post => ({
      ...post,
      user_id: post.user_id.toString()
    }));

    res.json({ posts: formattedPosts });
  });
});

// Get all users (for search/follow suggestions)
router.get('/users', authenticateToken, asyncHandler(async (req, res) => {
  const { q } = req.query;

  await ensureStickerSchema();
  await getOrCreateStickerBotUser(req);

  let query = '';
  let params = [];

  if (q) {
    query = `
      SELECT id, name, username, bio, avatar, verified
      FROM users
      WHERE name ILIKE $1 OR username ILIKE $2
      ORDER BY verified DESC, name ASC
      LIMIT 20
    `;
    params = [`%${q}%`, `%${q}%`];
  } else {
    query = `
      SELECT id, name, username, bio, avatar, verified
      FROM users
      ORDER BY verified DESC, name ASC
      LIMIT 20
    `;
  }

  db.all(query, params, (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Преобразуем id в строку для корректной работы на frontend
    const formattedUsers = users.map(user => ({
      ...user,
      id: user.id.toString()
    }));

    res.json({ users: formattedUsers });
  });
}));

// Get chat list for current user
router.get('/chats', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  console.log('[chats] list request', { userId });
  const query = `
    SELECT c.id, c.type, c.title, c.avatar, c.owner_id, c.is_public, c.is_private, c.username, c.invite_token, c.public_number, c.created_at,
           cm.role,
           lm.text as last_message_text, lm.type as last_message_type, lm.created_at as last_message_time
    FROM chat_members cm
    JOIN chats c ON c.id = cm.chat_id
    LEFT JOIN LATERAL (
      SELECT m.text, m.type, m.created_at
      FROM messages m
      WHERE m.chat_id = c.id AND m.deleted_for_all_at IS NULL
      ORDER BY m.created_at DESC
      LIMIT 1
    ) lm ON true
    WHERE cm.user_id = $1
    ORDER BY lm.created_at DESC NULLS LAST, c.created_at DESC
  `;

  db.all(query, [userId], async (err, rows) => {
    if (err) {
      console.error('Database error getting chats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log('[chats] list rows', { userId, count: rows?.length || 0 });

    const chatIds = rows.map(row => row.id);
    const membersByChat = new Map();

    if (chatIds.length) {
      const placeholders = chatIds.map((_, i) => `$${i + 1}`).join(',');
      const membersQuery = `
        SELECT cm.chat_id, cm.user_id, cm.role, u.name, u.username, u.avatar, u.verified
        FROM chat_members cm
        JOIN users u ON u.id = cm.user_id
        WHERE cm.chat_id IN (${placeholders})
      `;
      const members = await new Promise((resolve) => {
        db.all(membersQuery, chatIds, (membersErr, memberRows) => {
          if (membersErr) return resolve([]);
          resolve(memberRows || []);
        });
      });
      console.log('[chats] list members', { userId, chatCount: chatIds.length, memberCount: (members || []).length });
      (members || []).forEach((member) => {
        if (!membersByChat.has(member.chat_id)) {
          membersByChat.set(member.chat_id, []);
        }
        membersByChat.get(member.chat_id).push(member);
      });
    }

    const formatted = rows.map((row) => {
      const members = membersByChat.get(row.id) || [];
      const isPrivate = row.type === 'private';
      const otherMember = isPrivate
        ? members.find((m) => String(m.user_id) !== String(userId))
        : null;
      const title = row.title || (otherMember?.name || otherMember?.username || 'Chat');
      const avatar = row.avatar || otherMember?.avatar || null;

      const publicNumber = row.public_number ? String(row.public_number) : null;

      return {
        id: row.id.toString(),
        routeId: publicNumber || row.id.toString(),
        type: row.type,
        title,
        avatar,
        ownerId: row.owner_id ? row.owner_id.toString() : null,
        isPublic: !!row.is_public,
        isPrivate: !!row.is_private,
        username: row.username || null,
        inviteToken: row.invite_token || null,
        publicNumber: row.public_number ? String(row.public_number) : null,
        role: row.role,
        members: members.map((member) => ({
          id: member.user_id.toString(),
          role: member.role,
          name: member.name,
          username: member.username,
          avatar: member.avatar,
          verified: member.verified === 1,
        })),
        lastMessage: row.last_message_text || '',
        lastMessageType: row.last_message_type || 'text',
        timestamp: row.last_message_time || row.created_at,
      };
    });

    res.json({ chats: formatted });
  });
});

// Create chat (group/channel/private)
router.post('/chats', authenticateToken, asyncHandler(async (req, res) => {
  const ownerId = req.user.userId;
  const { type = 'group', title = null, userIds = [], isPublic = false, username = null, avatar = null } = req.body || {};
  console.log('[chats] create request', { ownerId, type, title, userIds, isPublic, username, avatar });

  if (!['private', 'group', 'channel'].includes(type)) {
    return res.status(400).json({ error: 'Invalid chat type' });
  }

  const cleanUserIds = Array.isArray(userIds)
    ? Array.from(new Set(userIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)))
    : [];

  if (type === 'private') {
    if (cleanUserIds.length !== 1) {
      return res.status(400).json({ error: 'Private chat requires exactly one userId' });
    }
    const otherUserId = cleanUserIds[0];
    const existingChat = await new Promise((resolve) => {
      const query = `
        SELECT c.id
        FROM chats c
        JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = $1
        JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = $2
        WHERE c.type = 'private'
        LIMIT 1
      `;
      db.get(query, [ownerId, otherUserId], (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      });
    });
    if (existingChat?.id) {
      console.log('[chats] create existing private', { ownerId, otherUserId, chatId: existingChat.id });
      return res.json({ chatId: existingChat.id.toString(), existing: true });
    }
  }

  const normalizedUsername = isPublic ? normalizeUsername(username) : null;
  if (isPublic && !normalizedUsername) {
    return res.status(400).json({ error: 'Username is required for public chats' });
  }
  if (isPublic && normalizedUsername && !isChatUsernameValid(normalizedUsername)) {
    return res.status(400).json({ error: { message: 'Username can only contain English letters and numbers', code: 'CHAT_USERNAME_INVALID' } });
  }

  const isPrivateChat = !isPublic;
  const inviteToken = isPrivateChat ? generateInviteToken() : null;

  const publicNumberPrefix = type === 'channel' ? '-100' : type === 'group' ? '-200' : null;
  const publicNumberValue = publicNumberPrefix ? `${publicNumberPrefix}${generatePublicNumber()}` : null;

  const chatId = await new Promise((resolve, reject) => {
    const insertChat = () => {
      const tokenValue = isPrivateChat ? generateInviteToken() : null;
      const numberValue = publicNumberPrefix ? `${publicNumberPrefix}${generatePublicNumber()}` : null;
      db.run(
        `INSERT INTO chats (type, title, avatar, owner_id, is_public, is_private, username, invite_token, public_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
        ,
        [type, title, avatar, ownerId, !!isPublic, isPrivateChat, normalizedUsername, tokenValue, numberValue],
        function(err) {
          if (err) {
            if (err && err.code === 'SQLITE_CONSTRAINT') {
              return insertChat();
            }
            return reject(err);
          }
          resolve(this.lastID);
        }
      );
    };
    insertChat();
  });
  console.log('[chats] create inserted', { ownerId, chatId });

  await new Promise((resolve) => {
    db.run(
      `INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [chatId, ownerId],
      (err) => {
        if (err) {
          console.error('[chats] create owner member error', { ownerId, chatId, error: err });
        }
        resolve();
      }
    );
  });
  console.log('[chats] create owner member', { ownerId, chatId });

  const memberIds = type === 'private'
    ? cleanUserIds
    : cleanUserIds.filter((id) => String(id) !== String(ownerId));

  await Promise.all(memberIds.map((userId) => new Promise((resolve) => {
    db.run(
      `INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
      [chatId, userId],
      (err) => {
        if (err) {
          console.error('[chats] create member error', { chatId, userId, error: err });
        }
        resolve();
      }
    );
  })));
  console.log('[chats] create members added', { chatId, memberIds });

  db.all(
    'SELECT user_id, role FROM chat_members WHERE chat_id = $1',
    [chatId],
    (verifyErr, verifyRows) => {
      if (verifyErr) {
        console.error('[chats] create verify members error', { chatId, error: verifyErr });
      } else {
        console.log('[chats] create verify members', { chatId, members: verifyRows || [] });
      }
    }
  );

  res.status(201).json({ chatId: chatId.toString() });
}));

// List public channels (search)
router.get('/chats/public', authenticateToken, asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim();
  const term = query ? `%${query}%` : '%';
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const sql = `
    SELECT c.id, c.title, c.username, c.avatar, c.created_at,
           COUNT(cm.user_id) as members_count
    FROM chats c
    LEFT JOIN chat_members cm ON cm.chat_id = c.id
    WHERE c.type = 'channel'
      AND c.is_public = true
      AND (c.title ILIKE $1 OR c.username ILIKE $1)
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT $2
  `;

  db.all(sql, [term, limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    const channels = (rows || []).map((row) => ({
      id: row.id.toString(),
      type: 'channel',
      title: row.title,
      username: row.username,
      avatar: row.avatar,
      membersCount: Number(row.members_count || 0),
    }));
    res.json({ channels });
  });
}));

// Public channel details
router.get('/chats/:id/public', authenticateToken, asyncHandler(async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user.userId;

  db.get(
    `SELECT c.id, c.title, c.username, c.avatar, c.is_public,
            COUNT(cm.user_id) as members_count
     FROM chats c
     LEFT JOIN chat_members cm ON cm.chat_id = c.id
     WHERE c.id = $1 AND c.type = 'channel' AND c.is_public = true
     GROUP BY c.id`,
    [chatId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      db.get(
        'SELECT role FROM chat_members WHERE chat_id = $1 AND user_id = $2',
        [chatId, userId],
        (memErr, memRow) => {
          if (memErr) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({
            channel: {
              id: row.id.toString(),
              type: 'channel',
              title: row.title,
              username: row.username,
              avatar: row.avatar,
              isPublic: !!row.is_public,
              membersCount: Number(row.members_count || 0),
              role: memRow?.role || null,
            },
          });
        }
      );
    }
  );
}));

// Subscribe to public channel
router.post('/chats/:id/subscribe', authenticateToken, asyncHandler(async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user.userId;

  const chat = await new Promise((resolve) => {
    db.get('SELECT id, type, is_public FROM chats WHERE id = $1', [chatId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (!chat || chat.type !== 'channel' || !chat.is_public) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  db.run(
    `INSERT INTO chat_members (chat_id, user_id, role)
     VALUES ($1, $2, 'member')
     ON CONFLICT DO NOTHING`,
    [chatId, userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Subscribed', chatId: chatId.toString() });
    }
  );
}));

// Unsubscribe from public channel
router.delete('/chats/:id/subscribe', authenticateToken, asyncHandler(async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user.userId;

  const roleRow = await new Promise((resolve) => {
    db.get('SELECT role FROM chat_members WHERE chat_id = $1 AND user_id = $2', [chatId, userId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (!roleRow) {
    return res.json({ message: 'Unsubscribed' });
  }
  if (roleRow.role === 'owner') {
    return res.status(403).json({ error: 'Owner cannot unsubscribe' });
  }

  db.run(
    'DELETE FROM chat_members WHERE chat_id = $1 AND user_id = $2',
    [chatId, userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Unsubscribed' });
    }
  );
}));

// Add chat member
router.post('/chats/:id/members', authenticateToken, asyncHandler(async (req, res) => {
  const requesterId = req.user.userId;
  const chatId = req.params.id;
  const { userId, username, role = 'member' } = req.body || {};

  if (!userId && !username) {
    return res.status(400).json({ error: 'userId or username is required' });
  }
  if (!['owner', 'admin', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  let resolvedUserId = userId;
  if (!resolvedUserId && username) {
    const cleanUsername = String(username || '').replace(/^@+/, '');
    const userRow = await new Promise((resolve) => {
      db.get('SELECT id FROM users WHERE username = $1', [cleanUsername], (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      });
    });
    if (!userRow?.id) {
      return res.status(404).json({ error: 'User not found' });
    }
    resolvedUserId = userRow.id;
  }

  if (!resolvedUserId) {
    return res.status(400).json({ error: 'Invalid user reference' });
  }

  const requester = await new Promise((resolve) => {
    db.get('SELECT role FROM chat_members WHERE chat_id = $1 AND user_id = $2', [chatId, requesterId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  db.run(
    `INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, $3)
     ON CONFLICT (chat_id, user_id) DO UPDATE SET role = $3`,
    [chatId, resolvedUserId, role],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Member added', chatId: chatId.toString(), userId: resolvedUserId.toString(), role });
    }
  );
}));

// Remove chat member
router.delete('/chats/:id/members/:userId', authenticateToken, asyncHandler(async (req, res) => {
  const requesterId = req.user.userId;
  const chatId = req.params.id;
  const targetUserId = req.params.userId;

  const requester = await new Promise((resolve) => {
    db.get('SELECT role FROM chat_members WHERE chat_id = $1 AND user_id = $2', [chatId, requesterId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (!requester || (requester.role !== 'owner' && requester.role !== 'admin' && String(requesterId) !== String(targetUserId))) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  if (String(requesterId) === String(targetUserId) && requester.role === 'owner') {
    return res.status(400).json({ error: 'Owner cannot leave the chat' });
  }

  db.run(
    'DELETE FROM chat_members WHERE chat_id = $1 AND user_id = $2',
    [chatId, targetUserId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Member removed' });
    }
  );
}));

// Delete chat (group/channel)
router.delete('/chats/:id', authenticateToken, asyncHandler(async (req, res) => {
  const requesterId = req.user.userId;
  const chatId = req.params.id;

  const chat = await new Promise((resolve) => {
    db.get(
      'SELECT id, type, owner_id FROM chats WHERE id = $1',
      [chatId],
      (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      }
    );
  });

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  if (chat.type === 'private') {
    return res.status(400).json({ error: 'Private chats cannot be deleted' });
  }

  if (String(chat.owner_id) !== String(requesterId)) {
    return res.status(403).json({ error: 'Only the owner can delete the chat' });
  }

  db.run('DELETE FROM chats WHERE id = $1', [chatId], (err) => {
    if (err) {
      console.error('[chats] delete error', { chatId, err });
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Chat deleted' });
  });
}));

// Update chat details (group/channel)
router.patch('/chats/:id', authenticateToken, asyncHandler(async (req, res) => {
  const requesterId = req.user.userId;
  const chatIdParam = req.params.id;
  console.log('[chats] update request', { requesterId, chatIdParam, body: req.body });
  const chatId = await new Promise((resolve) => {
    if (String(chatIdParam || '').startsWith('-100') || String(chatIdParam || '').startsWith('-200')) {
      db.get('SELECT id FROM chats WHERE public_number = $1', [chatIdParam], (err, row) => {
        if (err) return resolve(null);
        return resolve(row?.id || null);
      });
      return;
    }
    resolve(chatIdParam);
  });

  console.log('[chats] update resolved', { chatIdParam, chatId });

  if (!chatId) {
    return res.status(404).json({ error: 'Chat not found' });
  }
  const { title, avatar, username, isPublic, isPrivate, regenerateInvite } = req.body || {};

  const chatAccess = await new Promise((resolve) => {
    db.get(
      `SELECT c.type, cm.role, c.username, c.is_public
       FROM chats c
       JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = $2
       WHERE c.id = $1`,
      [chatId, requesterId],
      (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      }
    );
  });

  if (!chatAccess) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  if (chatAccess.type === 'private') {
    return res.status(400).json({ error: 'Private chats cannot be updated' });
  }
  if (chatAccess.role !== 'owner' && chatAccess.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const updates = [];
  const values = [];
  let index = 1;

  if (title !== undefined) {
    updates.push(`title = $${index}`);
    values.push(title);
    index += 1;
  }
  if (avatar !== undefined) {
    updates.push(`avatar = $${index}`);
    values.push(avatar || null);
    index += 1;
  }
  const normalizedUsername = username !== undefined ? (username ? normalizeUsername(username) : null) : undefined;
  if (normalizedUsername && !isChatUsernameValid(normalizedUsername)) {
    return res.status(400).json({ error: { message: 'Username can only contain English letters and numbers', code: 'CHAT_USERNAME_INVALID' } });
  }
  if (isPublic === true) {
    const existingUsername = chatAccess?.username ? String(chatAccess.username) : null;
    if (normalizedUsername === undefined && !existingUsername) {
      return res.status(400).json({ error: 'Username is required for public chats' });
    }
    if (normalizedUsername === null) {
      return res.status(400).json({ error: 'Username is required for public chats' });
    }
  }
  if (typeof isPrivate === 'boolean') {
    updates.push(`is_private = $${index}`);
    values.push(isPrivate);
    index += 1;
    if (isPrivate) {
      updates.push(`is_public = $${index}`);
      values.push(false);
      index += 1;
      updates.push(`username = $${index}`);
      values.push(null);
      index += 1;
    } else if (typeof isPublic === 'boolean') {
      updates.push(`is_public = $${index}`);
      values.push(isPublic);
      index += 1;
    }
  } else if (typeof isPublic === 'boolean') {
    updates.push(`is_public = $${index}`);
    values.push(isPublic);
    index += 1;
    if (isPublic) {
      updates.push(`is_private = $${index}`);
      values.push(false);
      index += 1;
    }
  }

  if (normalizedUsername !== undefined && !isPrivate) {
    updates.push(`username = $${index}`);
    values.push(normalizedUsername || null);
    index += 1;
  }
  if (regenerateInvite) {
    updates.push(`invite_token = $${index}`);
    values.push(generateInviteToken());
    index += 1;
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(chatId);

  db.run(
    `UPDATE chats SET ${updates.join(', ')} WHERE id = $${index}`,
    values,
    (err) => {
      if (err) {
        console.error('[chats] update error', { chatId, err });
        if (err.code === '23505') {
          return res.status(409).json({ error: { message: 'Username already taken', code: 'USERNAME_TAKEN' } });
        }
        return res.status(500).json({ error: { message: 'Database error', code: 'DB_ERROR' } });
      }
      db.get(
        'SELECT id, type, title, avatar, owner_id, is_public, is_private, username, invite_token, public_number FROM chats WHERE id = $1',
        [chatId],
        (getErr, row) => {
          if (getErr) {
            console.error('[chats] update get error', { chatId, err: getErr });
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ chat: row || null });
        }
      );
    }
  );
}));

// Resolve public chat by username (preview)
router.get('/chats/username/:username', authenticateToken, asyncHandler(async (req, res) => {
  const currentUserId = req.user.userId;
  const username = normalizeUsername(req.params.username);
  if (!username) {
    return res.status(400).json({ error: 'Invalid username' });
  }

  const chat = await new Promise((resolve) => {
    db.get(
      `SELECT c.id, c.type, c.title, c.avatar, c.owner_id, c.is_public, c.is_private, c.username,
              c.invite_token, c.public_number,
              COUNT(cm.user_id) as members_count
       FROM chats c
       LEFT JOIN chat_members cm ON cm.chat_id = c.id
       WHERE c.username = $1 AND c.is_public = true
       GROUP BY c.id`,
      [username],
      (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      }
    );
  });

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  const member = await new Promise((resolve) => {
    db.get(
      'SELECT role FROM chat_members WHERE chat_id = $1 AND user_id = $2',
      [chat.id, currentUserId],
      (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      }
    );
  });

  res.json({
    chat: {
      id: chat.id.toString(),
      routeId: chat.public_number ? String(chat.public_number) : chat.id.toString(),
      type: chat.type,
      title: chat.title,
      avatar: chat.avatar,
      ownerId: chat.owner_id ? chat.owner_id.toString() : null,
      isPublic: !!chat.is_public,
      isPrivate: !!chat.is_private,
      username: chat.username,
      inviteToken: chat.invite_token || null,
      publicNumber: chat.public_number ? String(chat.public_number) : null,
      membersCount: Number(chat.members_count || 0),
      role: member?.role || null,
    },
  });
}));

// Resolve chat by public number (-100/-200)
router.get('/chats/public-number/:publicNumber', authenticateToken, asyncHandler(async (req, res) => {
  const currentUserId = req.user.userId;
  const publicNumber = String(req.params.publicNumber || '').trim();

  const chat = await new Promise((resolve) => {
    db.get(
      `SELECT c.id, c.type, c.title, c.avatar, c.owner_id, c.is_public, c.is_private, c.username,
              c.invite_token, c.public_number,
              COUNT(cm.user_id) as members_count
       FROM chats c
       LEFT JOIN chat_members cm ON cm.chat_id = c.id
       WHERE c.public_number = $1
       GROUP BY c.id`,
      [publicNumber],
      (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      }
    );
  });

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  const member = await new Promise((resolve) => {
    db.get(
      'SELECT role FROM chat_members WHERE chat_id = $1 AND user_id = $2',
      [chat.id, currentUserId],
      (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      }
    );
  });

  if (chat.is_public) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (!member) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({
    chat: {
      id: chat.id.toString(),
      routeId: chat.public_number ? String(chat.public_number) : chat.id.toString(),
      type: chat.type,
      title: chat.title,
      avatar: chat.avatar,
      ownerId: chat.owner_id ? chat.owner_id.toString() : null,
      isPublic: !!chat.is_public,
      isPrivate: !!chat.is_private,
      username: chat.username,
      inviteToken: chat.invite_token || null,
      publicNumber: chat.public_number ? String(chat.public_number) : null,
      membersCount: Number(chat.members_count || 0),
      role: member?.role || null,
    },
  });
}));

// Resolve invite token (private preview)
router.get('/chats/invite/:token', authenticateToken, asyncHandler(async (req, res) => {
  const currentUserId = req.user.userId;
  const token = String(req.params.token || '').trim();
  if (!token) {
    return res.status(400).json({ error: 'Invalid invite token' });
  }

  const chat = await new Promise((resolve) => {
    db.get(
      `SELECT c.id, c.type, c.title, c.avatar, c.owner_id, c.is_public, c.is_private, c.username,
              c.invite_token, c.public_number,
              COUNT(cm.user_id) as members_count
       FROM chats c
       LEFT JOIN chat_members cm ON cm.chat_id = c.id
       WHERE c.invite_token = $1
       GROUP BY c.id`,
      [token],
      (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      }
    );
  });

  if (!chat) {
    return res.status(404).json({ error: 'Invite not found' });
  }

  const member = await new Promise((resolve) => {
    db.get(
      'SELECT role FROM chat_members WHERE chat_id = $1 AND user_id = $2',
      [chat.id, currentUserId],
      (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      }
    );
  });

  const pendingRequest = await new Promise((resolve) => {
    db.get(
      'SELECT status FROM chat_join_requests WHERE chat_id = $1 AND user_id = $2',
      [chat.id, currentUserId],
      (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      }
    );
  });

  res.json({
    chat: {
      id: chat.id.toString(),
      routeId: chat.public_number ? String(chat.public_number) : chat.id.toString(),
      type: chat.type,
      title: chat.title,
      avatar: chat.avatar,
      ownerId: chat.owner_id ? chat.owner_id.toString() : null,
      isPublic: !!chat.is_public,
      isPrivate: !!chat.is_private,
      username: chat.username,
      inviteToken: chat.invite_token || null,
      publicNumber: chat.public_number ? String(chat.public_number) : null,
      membersCount: Number(chat.members_count || 0),
      role: member?.role || null,
      joinStatus: pendingRequest?.status || null,
    },
  });
}));

// Request to join via invite
router.post('/chats/:id/join-requests', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const chatId = req.params.id;

  const chat = await new Promise((resolve) => {
    db.get('SELECT id, type, is_private, is_public FROM chats WHERE id = $1', [chatId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  if (!chat.is_private && chat.type === 'group' && chat.is_public) {
    db.run(
      `INSERT INTO chat_members (chat_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT DO NOTHING`,
      [chatId, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        return res.json({ status: 'approved' });
      }
    );
    return;
  }

  if (!chat.is_private) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  const member = await new Promise((resolve) => {
    db.get('SELECT role FROM chat_members WHERE chat_id = $1 AND user_id = $2', [chatId, userId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (member) {
    return res.json({ status: 'approved' });
  }

  db.run(
    `INSERT INTO chat_join_requests (chat_id, user_id, status)
     VALUES ($1, $2, 'pending')
     ON CONFLICT (chat_id, user_id) DO UPDATE SET status = 'pending', created_at = NOW()`
    ,
    [chatId, userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ status: 'pending' });
    }
  );
}));

// List join requests for chat (owner/admin)
router.get('/chats/:id/join-requests', authenticateToken, asyncHandler(async (req, res) => {
  const requesterId = req.user.userId;
  const chatId = req.params.id;

  const requester = await new Promise((resolve) => {
    db.get('SELECT role FROM chat_members WHERE chat_id = $1 AND user_id = $2', [chatId, requesterId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  db.all(
    `SELECT r.id, r.user_id, r.status, r.created_at, u.name, u.username, u.avatar, u.verified
     FROM chat_join_requests r
     JOIN users u ON u.id = r.user_id
     WHERE r.chat_id = $1 AND r.status = 'pending'
     ORDER BY r.created_at ASC`,
    [chatId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const requests = (rows || []).map((row) => ({
        id: row.id.toString(),
        userId: row.user_id.toString(),
        status: row.status,
        createdAt: row.created_at,
        user: {
          id: row.user_id.toString(),
          name: row.name,
          username: row.username,
          avatar: row.avatar,
          verified: row.verified === 1,
        },
      }));
      res.json({ requests });
    }
  );
}));

// Approve/reject join request
router.post('/chats/:id/join-requests/:requestId', authenticateToken, asyncHandler(async (req, res) => {
  const requesterId = req.user.userId;
  const chatId = req.params.id;
  const requestId = req.params.requestId;
  const { action } = req.body || {};

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const requester = await new Promise((resolve) => {
    db.get('SELECT role FROM chat_members WHERE chat_id = $1 AND user_id = $2', [chatId, requesterId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const requestRow = await new Promise((resolve) => {
    db.get('SELECT user_id FROM chat_join_requests WHERE id = $1 AND chat_id = $2', [requestId, chatId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (!requestRow?.user_id) {
    return res.status(404).json({ error: 'Request not found' });
  }

  db.run(
    `UPDATE chat_join_requests
     SET status = $1, reviewed_at = NOW(), reviewed_by = $2
     WHERE id = $3`,
    [action === 'approve' ? 'approved' : 'rejected', requesterId, requestId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (action === 'approve') {
        db.run(
          `INSERT INTO chat_members (chat_id, user_id, role)
           VALUES ($1, $2, 'member')
           ON CONFLICT DO NOTHING`,
          [chatId, requestRow.user_id],
          () => {
            res.json({ status: 'approved' });
          }
        );
      } else {
        res.json({ status: 'rejected' });
      }
    }
  );
}));

// ==================== Stickers ====================

router.get('/stickers/packs', authenticateToken, asyncHandler(async (_req, res) => {
  await ensureStickerData();

  db.all(
    `SELECT sp.id, sp.name, sp.slug, sp.description, sp.author, sp.created_at,
            COUNT(s.id) as sticker_count
     FROM sticker_packs sp
     LEFT JOIN stickers s ON s.pack_id = sp.id
     GROUP BY sp.id, sp.name, sp.description, sp.author, sp.created_at
     ORDER BY sp.created_at DESC`,
    (err, packs) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const formatted = (packs || []).map((pack) => ({
        id: pack.id.toString(),
        name: pack.name,
        slug: pack.slug,
        description: pack.description,
        author: pack.author,
        createdAt: pack.created_at,
        stickerCount: Number(pack.sticker_count || 0),
      }));
      res.json({ packs: formatted });
    }
  );
}));

router.get('/stickers/packs/:id', authenticateToken, asyncHandler(async (req, res) => {
  await ensureStickerData();
  const packId = req.params.id;

  db.get('SELECT id, name, slug, description, author, created_at FROM sticker_packs WHERE id = $1', [packId], (err, pack) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' });
    }

    db.all('SELECT id, name, file_path FROM stickers WHERE pack_id = $1 ORDER BY id ASC', [packId], (err2, stickers) => {
      if (err2) {
        return res.status(500).json({ error: 'Database error' });
      }
      const formatted = (stickers || []).map((sticker) => ({
        id: sticker.id.toString(),
        name: sticker.name,
        filePath: sticker.file_path,
        url: `${getPublicBaseUrl(req)}/api/stickers/${sticker.id}`,
      }));

      res.json({
        pack: {
          id: pack.id.toString(),
          name: pack.name,
          slug: pack.slug,
          description: pack.description,
          author: pack.author,
          createdAt: pack.created_at,
        },
        stickers: formatted,
      });
    });
  });
}));

router.get('/stickers/slug/:slug', authenticateToken, asyncHandler(async (req, res) => {
  await ensureStickerData();
  const slug = normalizeStickerSlug(req.params.slug || '');
  if (!slug) {
    return res.status(400).json({ error: 'Invalid sticker slug' });
  }

  db.get('SELECT id, name, slug, description, author, created_at FROM sticker_packs WHERE slug = $1', [slug], (err, pack) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' });
    }

    db.all('SELECT id, name, file_path FROM stickers WHERE pack_id = $1 ORDER BY id ASC', [pack.id], (err2, stickers) => {
      if (err2) {
        return res.status(500).json({ error: 'Database error' });
      }
      const formatted = (stickers || []).map((sticker) => ({
        id: sticker.id.toString(),
        name: sticker.name,
        filePath: sticker.file_path,
        url: `${getPublicBaseUrl(req)}/api/stickers/${sticker.id}`,
      }));

      res.json({
        pack: {
          id: pack.id.toString(),
          name: pack.name,
          slug: pack.slug,
          description: pack.description,
          author: pack.author,
          createdAt: pack.created_at,
        },
        stickers: formatted,
      });
    });
  });
}));

router.get('/stickers/public/slug/:slug', asyncHandler(async (req, res) => {
  await ensureStickerData();
  const slug = normalizeStickerSlug(req.params.slug || '');
  if (!slug) {
    return res.status(400).json({ error: 'Invalid sticker slug' });
  }

  db.get('SELECT id, name, slug, description, author, created_at FROM sticker_packs WHERE slug = $1', [slug], (err, pack) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' });
    }

    db.all('SELECT id, name, file_path FROM stickers WHERE pack_id = $1 ORDER BY id ASC', [pack.id], (err2, stickers) => {
      if (err2) {
        return res.status(500).json({ error: 'Database error' });
      }
      const formatted = (stickers || []).map((sticker) => ({
        id: sticker.id.toString(),
        name: sticker.name,
        filePath: sticker.file_path,
        url: `${getPublicBaseUrl(req)}/api/stickers/${sticker.id}`,
      }));

      res.json({
        pack: {
          id: pack.id.toString(),
          name: pack.name,
          slug: pack.slug,
          description: pack.description,
          author: pack.author,
          createdAt: pack.created_at,
        },
        stickers: formatted,
      });
    });
  });
}));

router.get('/stickers/mine', authenticateToken, asyncHandler(async (req, res) => {
  await ensureStickerData();
  const userId = req.user.userId;
  console.info('[Stickers] mine request', { userId });

  db.all(
    `SELECT sp.id, sp.name, sp.slug, sp.description, sp.author, sp.created_at,
            COUNT(s.id) as sticker_count,
            MAX(usp.added_at) as added_at
     FROM user_sticker_packs usp
     JOIN sticker_packs sp ON sp.id = usp.pack_id
     LEFT JOIN stickers s ON s.pack_id = sp.id
     WHERE usp.user_id = $1
     GROUP BY sp.id, sp.name, sp.description, sp.author, sp.created_at
     ORDER BY added_at DESC`,
    [userId],
    (err, packs) => {
      if (err) {
        console.error('[Stickers] mine failed', err);
        return res.status(500).json({ error: 'Database error' });
      }
      const formatted = (packs || []).map((pack) => ({
        id: pack.id.toString(),
        name: pack.name,
        slug: pack.slug,
        description: pack.description,
        author: pack.author,
        createdAt: pack.created_at,
        stickerCount: Number(pack.sticker_count || 0),
      }));
      res.json({ packs: formatted });
    }
  );
}));

router.get('/stickers/pack/:id', authenticateToken, asyncHandler(async (req, res) => {
  await ensureStickerData();
  const packId = req.params.id;

  db.get('SELECT id, name, slug, description, author, created_at FROM sticker_packs WHERE id = $1', [packId], (err, pack) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' });
    }

    db.all('SELECT id, name, file_path FROM stickers WHERE pack_id = $1 ORDER BY id ASC', [packId], (err2, stickers) => {
      if (err2) {
        return res.status(500).json({ error: 'Database error' });
      }
      const formatted = (stickers || []).map((sticker) => ({
        id: sticker.id.toString(),
        name: sticker.name,
        filePath: sticker.file_path,
        url: `${getPublicBaseUrl(req)}/api/stickers/${sticker.id}`,
      }));

      res.json({
        pack: {
          id: pack.id.toString(),
          name: pack.name,
          slug: pack.slug,
          description: pack.description,
          author: pack.author,
          createdAt: pack.created_at,
        },
        stickers: formatted,
      });
    });
  });
}));

router.post('/stickers/add-pack', authenticateToken, asyncHandler(async (req, res) => {
  await ensureStickerSchema();
  const userId = req.user.userId;
  const { packId } = req.body;
  console.info('[Stickers] add-pack request', { userId, packId });
  if (!packId) {
    return res.status(400).json({ error: 'packId is required' });
  }

  db.run(
    'INSERT INTO user_sticker_packs (user_id, pack_id) VALUES ($1, $2) ON CONFLICT(user_id, pack_id) DO NOTHING',
    [userId, packId],
    (err) => {
      if (err) {
        console.error('[Stickers] add-pack failed', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.info('[Stickers] add-pack success', { userId, packId });
      res.json({ message: 'Sticker pack added' });
    }
  );
}));

router.get('/stickers/:id', asyncHandler(async (req, res) => {
  const stickerId = req.params.id;
  if (!stickerId || !Number.isInteger(Number(stickerId))) {
    return res.status(400).json({ error: 'Invalid sticker id' });
  }

  const cached = stickerFileCache.get(stickerId);
  if (cached?.buffer) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:");
    return res.end(cached.buffer);
  }

  db.get('SELECT file_path FROM stickers WHERE id = $1', [stickerId], (err, sticker) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!sticker) {
      return res.status(404).json({ error: 'Sticker not found' });
    }

    let absolutePath;
    try {
      absolutePath = resolveStickerAssetPath(sticker.file_path);
    } catch (_error) {
      return res.status(400).json({ error: 'Invalid sticker path' });
    }

    fs.readFile(absolutePath, (readErr, buffer) => {
      if (readErr) {
        return res.status(404).json({ error: 'Sticker file missing' });
      }
      cacheStickerBuffer(stickerId, buffer);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:");
      return res.end(buffer);
    });
  });
}));

router.post('/stickers/bot/start', authenticateToken, asyncHandler(async (req, res) => {
  await ensureStickerSchema();
  await getOrCreateStickerBotUser(req);
  const senderId = req.user.userId;
  await resetStickerBotSession(senderId);
  await sendBotMessage(req, senderId, STICKER_BOT_HELP);
  res.json({ message: 'Sticker bot started' });
}));

// ==================== Sticker Bot ====================

const getStickerBotSession = (userId) => new Promise((resolve) => {
  db.get(
    'SELECT user_id, step, pack_name, stickers_temp FROM sticker_bot_sessions WHERE user_id = $1',
    [userId],
    (err, row) => {
      if (err) return resolve({ user_id: userId, step: STICKER_BOT_STEPS.IDLE, pack_name: null, stickers_temp: '[]' });
      resolve(row || { user_id: userId, step: STICKER_BOT_STEPS.IDLE, pack_name: null, stickers_temp: '[]' });
    }
  );
});

const upsertStickerBotSession = (userId, updates) => new Promise((resolve) => {
  const step = updates.step || STICKER_BOT_STEPS.IDLE;
  const packName = updates.packName ?? null;
  const stickersTemp = updates.stickersTemp ?? '[]';
  db.run(
    `INSERT INTO sticker_bot_sessions (user_id, step, pack_name, stickers_temp, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT(user_id) DO UPDATE SET step = $2, pack_name = $3, stickers_temp = $4, updated_at = NOW()`
    ,
    [userId, step, packName, stickersTemp],
    () => resolve()
  );
});

const resetStickerBotSession = async (userId) => {
  await upsertStickerBotSession(userId, { step: STICKER_BOT_STEPS.IDLE, packName: null, stickersTemp: '[]' });
};

const getOrCreateStickerBotUser = (req) => new Promise((resolve) => {
  db.get('SELECT id, username, name, avatar, banner FROM users WHERE username = $1', [STICKER_BOT_USERNAME], (err, row) => {
    if (row?.id) {
      const desiredAvatar = `${getPublicBaseUrl(req)}/assets/stickers-bot/stickers-bot-avatar.jpg`;
      const desiredBanner = `${getPublicBaseUrl(req)}/assets/stickers-bot/stickers-bot-banner.png`;
      if (row.avatar !== desiredAvatar || row.banner !== desiredBanner) {
        db.run(
          'UPDATE users SET avatar = $1, banner = $2 WHERE id = $3',
          [desiredAvatar, desiredBanner, row.id],
          () => resolve(row)
        );
      } else {
        resolve(row);
      }
      return;
    }
    db.run(
      'INSERT INTO users (id, username, name, verified, avatar, banner) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        STICKER_BOT_ID,
        STICKER_BOT_USERNAME,
        'Sticker Bot',
        1,
        `${getPublicBaseUrl(req)}/assets/stickers-bot/stickers-bot-avatar.jpg`,
        `${getPublicBaseUrl(req)}/assets/stickers-bot/stickers-bot-banner.png`
      ],
      function(insertErr) {
        if (insertErr) {
          return resolve({ id: STICKER_BOT_ID, username: STICKER_BOT_USERNAME, name: 'Sticker Bot' });
        }
        resolve({ id: STICKER_BOT_ID, username: STICKER_BOT_USERNAME, name: 'Sticker Bot' });
      }
    );
  });
});

const sendBotMessage = (req, receiverId, text) => new Promise((resolve) => {
  const senderId = STICKER_BOT_ID;
  const ensureChatQuery = `
    SELECT c.id
    FROM chats c
    JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = $1
    JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = $2
    WHERE c.type = 'private'
    LIMIT 1
  `;

  db.get(ensureChatQuery, [senderId, receiverId], (chatErr, chat) => {
    if (chatErr) return resolve();

    const ensureChat = (chatId) => {
      const insertMessageQuery = `
        INSERT INTO messages (chat_id, sender_id, text, type)
        VALUES ($1, $2, $3, 'text')
      `;
      db.run(insertMessageQuery, [chatId, senderId, text], function(err) {
        if (err) return resolve();
        const messageId = this.lastID;
        const sendChatMessage = req.app.get('sendChatMessage');
        const senderQuery = 'SELECT name, username, avatar, verified FROM users WHERE id = $1';
        if (sendChatMessage) {
          db.get(senderQuery, [senderId], (senderErr, sender) => {
            const senderData = senderErr ? { name: 'Sticker Bot', username: STICKER_BOT_USERNAME, avatar: null, verified: 1 } : sender;
            sendChatMessage({
              id: messageId,
              chatId: String(chatId),
              senderId: senderId.toString(),
              text,
              type: 'text',
              timestamp: new Date().toISOString(),
              attachments: [],
              replyToMessageId: null,
              sender: senderData
            });
          });
        }
        resolve();
      });
    };

    if (chat?.id) {
      return ensureChat(chat.id);
    }

    db.run(
      `INSERT INTO chats (type, title, owner_id) VALUES ('private', NULL, $1)`,
      [senderId],
      function(insertErr) {
        if (insertErr) return resolve();
        const newChatId = this.lastID;
        db.run(
          `INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, 'owner')`,
          [newChatId, senderId],
          () => {
            db.run(
              `INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, 'member')`,
              [newChatId, receiverId],
              () => ensureChat(newChatId)
            );
          }
        );
      }
    );
  });
});

const STICKER_BOT_HELP = `Привет! Я помогу создать стикеры.\n\nКоманды:\n/newpack — создать набор\n/addsticker — добавить в существующий\n/upload — загрузить стикеры\n/publish — опубликовать`;

const handleStickerBotCommand = async (req, senderId, text) => {
  await ensureStickerSchema();
  await getOrCreateStickerBotUser(req);
  const session = await getStickerBotSession(senderId);
  const trimmed = (text || '').trim();

  if (trimmed.startsWith('/start')) {
    await resetStickerBotSession(senderId);
    await sendBotMessage(req, senderId, STICKER_BOT_HELP);
    return true;
  }

  if (trimmed.startsWith('/newpack')) {
    await upsertStickerBotSession(senderId, { step: STICKER_BOT_STEPS.CREATING_PACK, packName: null, stickersTemp: '[]' });
    await sendBotMessage(req, senderId, 'Введите название набора:');
    return true;
  }

  if (trimmed.startsWith('/addsticker')) {
    if (!session.pack_name) {
      await sendBotMessage(req, senderId, 'Сначала создайте набор через /newpack.');
      return true;
    }
    await upsertStickerBotSession(senderId, { step: STICKER_BOT_STEPS.UPLOADING, packName: session.pack_name, stickersTemp: session.stickers_temp || '[]' });
    await sendBotMessage(req, senderId, 'Отправьте стикеры (PNG, WEBP, GIF) через /upload.');
    return true;
  }

  if (trimmed.startsWith('/upload')) {
    if (!session.pack_name) {
      await sendBotMessage(req, senderId, 'Сначала создайте набор через /newpack.');
      return true;
    }
    await upsertStickerBotSession(senderId, { step: STICKER_BOT_STEPS.UPLOADING, packName: session.pack_name, stickersTemp: session.stickers_temp || '[]' });
    const uploadUrl = `${getPublicBaseUrl(req)}/api/stickers/bot/upload`;
    await sendBotMessage(req, senderId, `Загрузите стикеры (PNG, WEBP, GIF) через ${uploadUrl} (multipart поле stickers).`);
    return true;
  }

  if (trimmed.startsWith('/publish')) {
    const stickersTemp = JSON.parse(session.stickers_temp || '[]');
    if (!session.pack_name) {
      await sendBotMessage(req, senderId, 'Название набора не задано. Используйте /newpack.');
      return true;
    }
    if (!stickersTemp.length) {
      await sendBotMessage(req, senderId, 'Добавьте хотя бы один стикер перед публикацией.');
      return true;
    }
    if (stickersTemp.length > STICKER_BOT_LIMITS.maxStickers) {
      await sendBotMessage(req, senderId, `Слишком много стикеров. Максимум ${STICKER_BOT_LIMITS.maxStickers}.`);
      return true;
    }

    const slugBase = normalizeStickerSlug(session.pack_name);
    const slug = await ensureUniqueStickerSlug(slugBase);
    const packDirName = normalizeStickerFileName(session.pack_name || 'pack');
    const targetDir = path.join(STICKERS_BASE_DIR, packDirName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const prepared = [];
    for (const item of stickersTemp) {
      const originalName = path.parse(item.originalFile || item.name || '').name;
      const safeName = normalizeStickerFileName(originalName || item.name || 'sticker') || `sticker-${Date.now()}`;
      const ext = path.extname(item.originalFile || item.tempFile || '').toLowerCase();
      const finalFileName = `${safeName}${ext || '.png'}`;
      const tempPath = path.join(__dirname, '../sticker-uploads', item.tempFile);
      const finalPath = path.join(targetDir, finalFileName);
      if (fs.existsSync(tempPath)) {
        fs.renameSync(tempPath, finalPath);
      }
      prepared.push({
        name: originalName || item.name || safeName,
        filePath: path.join(packDirName, finalFileName).replace(/\\/g, '/')
      });
    }

    const createdPackId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO sticker_packs (name, slug, description, author) VALUES ($1, $2, $3, $4)',
        [session.pack_name, slug, `Sticker pack ${session.pack_name}`, STICKER_BOT_USERNAME],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    }).catch(() => null);

    if (!createdPackId) {
      await sendBotMessage(req, senderId, 'Не удалось создать набор. Попробуйте позже.');
      return true;
    }

    for (const item of prepared) {
      await new Promise((resolve) => {
        db.run(
          'INSERT INTO stickers (pack_id, name, file_path) VALUES ($1, $2, $3)',
          [createdPackId, item.name, item.filePath],
          () => resolve()
        );
      });
    }

    const packLink = `${getPublicBaseUrl(req)}/addstickers/${slug}`;
    await resetStickerBotSession(senderId);
    await sendBotMessage(req, senderId, `Набор опубликован! Ссылка: ${packLink}`);
    return true;
  }

  if (session.step === STICKER_BOT_STEPS.CREATING_PACK && trimmed) {
    await upsertStickerBotSession(senderId, { step: STICKER_BOT_STEPS.UPLOADING, packName: trimmed, stickersTemp: '[]' });
    const uploadUrl = `${getPublicBaseUrl(req)}/api/stickers/bot/upload`;
    await sendBotMessage(req, senderId, `Отправьте стикеры (PNG, WEBP, GIF) через ${uploadUrl} (multipart поле stickers).`);
    return true;
  }

  return false;
};

router.post('/stickers/bot/upload', authenticateToken, stickerUpload.array('stickers', STICKER_BOT_LIMITS.maxStickers), asyncHandler(async (req, res) => {
  const senderId = req.user.userId;
  const session = await getStickerBotSession(senderId);
  if (!session.pack_name) {
    return res.status(400).json({ error: 'Pack name not set. Use /newpack first.' });
  }
  if (session.step !== STICKER_BOT_STEPS.UPLOADING) {
    return res.status(400).json({ error: 'Sticker upload not ожидается. Используйте /addsticker.' });
  }
  const files = req.files || [];
  if (!files.length) {
    return res.status(400).json({ error: 'No stickers uploaded' });
  }

  const existing = JSON.parse(session.stickers_temp || '[]');
  if (existing.length + files.length > STICKER_BOT_LIMITS.maxStickers) {
    files.forEach((file) => fs.unlinkSync(file.path));
    return res.status(400).json({ error: `Max ${STICKER_BOT_LIMITS.maxStickers} stickers per pack` });
  }

  const added = files.map((file) => {
    const originalName = path.parse(file.originalname).name;
    return {
      name: originalName || file.filename,
      tempFile: file.filename,
      originalFile: file.originalname
    };
  });

  const updatedTemp = [...existing, ...added].map((item) => ({
    ...item,
    url: `${getPublicBaseUrl(req)}/api/stickers/bot/temp/${item.tempFile}`
  }));

  await upsertStickerBotSession(senderId, {
    step: updatedTemp.length ? STICKER_BOT_STEPS.READY_TO_PUBLISH : STICKER_BOT_STEPS.UPLOADING,
    packName: session.pack_name,
    stickersTemp: JSON.stringify(updatedTemp)
  });

  await sendBotMessage(req, senderId, `Загружено стикеров: ${updatedTemp.length}. Когда будете готовы, используйте /publish.`);

  res.json({
    stickers: updatedTemp,
    count: updatedTemp.length,
    max: STICKER_BOT_LIMITS.maxStickers
  });
}));

router.get('/stickers/bot/session', authenticateToken, asyncHandler(async (req, res) => {
  const session = await getStickerBotSession(req.user.userId);
  const stickersTemp = JSON.parse(session.stickers_temp || '[]');
  res.json({
    step: session.step,
    packName: session.pack_name,
    stickers: stickersTemp,
    limits: STICKER_BOT_LIMITS
  });
}));

router.get('/stickers/bot/temp/:filename', authenticateToken, asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  if (!filename) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const safeName = path.basename(filename);
  const filePath = path.join(__dirname, '../sticker-uploads', safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Sticker not found' });
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === '.webp'
    ? 'image/webp'
    : ext === '.gif'
      ? 'image/gif'
      : 'image/png';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:");
  return fs.createReadStream(filePath).pipe(res);
}));


// Get messages for a chat
router.get('/chats/:chatId/messages', authenticateToken, (req, res) => {
  const currentUserId = req.user.userId;
  const chatId = req.params.chatId;
  console.log('[messages] list request', { currentUserId, chatId });

  const memberQuery = `
    SELECT cm.role, c.type
    FROM chat_members cm
    JOIN chats c ON c.id = cm.chat_id
    WHERE cm.chat_id = $1 AND cm.user_id = $2
  `;

  db.get(memberQuery, [chatId, currentUserId], (memberErr, membership) => {
    if (memberErr) {
      console.error('[messages] memberQuery error:', memberErr);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!membership) {
      console.warn('[messages] access denied', { currentUserId, chatId });
      return res.status(403).json({ error: 'Access denied' });
    }
    console.log('[messages] access granted', { currentUserId, chatId, role: membership.role, type: membership.type });

    const messageQuery = `
      SELECT m.*, u.name, u.username, u.avatar, u.verified,
             md.deleted_at as deleted_for_me,
             mo.thumb_data_url, mo.ttl_seconds, mo.expires_at,
             mv.viewed_at as moment_viewed_at,
             s.id as sticker_id,
             s.pack_id as sticker_pack_id,
             s.name as sticker_name,
             s.file_path as sticker_file_path
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN stickers s ON s.id = m.sticker_id
       LEFT JOIN message_deletions md ON md.message_id = m.id AND md.user_id = $1
       LEFT JOIN moments mo ON mo.id = m.moment_id
       LEFT JOIN moment_views mv ON mv.moment_id = mo.id AND mv.user_id = $2
       WHERE m.chat_id = $3
         AND m.deleted_for_all_at IS NULL
       ORDER BY m.created_at ASC
    `;

    db.all(messageQuery, [currentUserId, currentUserId, chatId], (err, messages) => {
      if (err) {
        console.error('[messages] messageQuery error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const messageIds = messages.map(m => m.id);
      let attachmentsByMessage = {};

      if (messageIds.length > 0) {
        const placeholders = messageIds.map((_, idx) => `$${idx + 1}`).join(',');
        db.all(
          `SELECT * FROM attachments WHERE message_id IN (${placeholders})`,
          messageIds,
          (attErr, attachments) => {
            if (attErr) console.error('Error getting attachments:', attErr);

            attachmentsByMessage = {};
            (attachments || []).forEach(att => {
              if (!attachmentsByMessage[att.message_id]) {
                attachmentsByMessage[att.message_id] = [];
              }
              attachmentsByMessage[att.message_id].push({
                id: att.id.toString(),
                type: att.type,
                url: att.url,
                mime: att.mime,
                size: att.size,
                width: att.width,
                height: att.height,
                duration: att.duration
              });
            });

            formatAndSendMessages(messages, attachmentsByMessage);
          }
        );
      } else {
        formatAndSendMessages(messages, {});
      }

      function formatAndSendMessages(msgs, attsByMsg) {
        const formattedMessages = msgs.map(msg => ({
          id: msg.id.toString(),
          senderId: msg.sender_id === currentUserId ? 'self' : msg.sender_id.toString(),
          sender: {
            id: msg.sender_id?.toString(),
            name: msg.name,
            username: msg.username,
            avatar: msg.avatar,
            verified: msg.verified === 1,
          },
          text: msg.text,
          type: msg.type || 'text',
          sticker: msg.sticker_id ? {
            id: msg.sticker_id.toString(),
            packId: msg.sticker_pack_id ? msg.sticker_pack_id.toString() : null,
            name: msg.sticker_name || null,
            filePath: msg.sticker_file_path || null,
            url: msg.sticker_file_path ? `${getPublicBaseUrl(req)}/api/stickers/${msg.sticker_id}` : null,
          } : null,
          moment: msg.moment_id ? {
            id: msg.moment_id.toString(),
            thumbDataUrl: msg.thumb_data_url || null,
            ttlSeconds: msg.ttl_seconds || 86400,
            expiresAt: msg.expires_at || null,
            viewedAt: msg.moment_viewed_at || null
          } : null,
          timestamp: msg.created_at || msg.timestamp,
          own: msg.sender_id === currentUserId,
          attachments: attsByMsg[msg.id] || [],
          deletedForMe: !!msg.deleted_for_me,
          deletedForAll: !!msg.deleted_for_all_at,
          replyToMessageId: msg.reply_to_message_id ? msg.reply_to_message_id.toString() : null,
          linkPreview: msg.link_preview ? (() => {
            try {
              return JSON.parse(msg.link_preview);
            } catch (error) {
              return null;
            }
          })() : null
        }));
        res.json({ messages: formattedMessages });
      }
    });
  });
});

// Send a message in a chat
router.post('/messages', authenticateToken, asyncHandler(async (req, res) => {
  const senderId = req.user.userId;
  const { chatId, text, attachmentIds, replyToMessageId, stickerId } = req.body;

  if (!chatId) {
    return res.status(400).json({ error: 'chatId is required' });
  }

  if (String(chatId) === String(STICKER_BOT_ID)) {
    const handled = await handleStickerBotCommand(req, senderId, text || '');
    if (handled) {
      return res.json({ message: 'Sticker bot handled' });
    }
  }

  const member = await new Promise((resolve) => {
    db.get(
      'SELECT cm.role, c.type FROM chat_members cm JOIN chats c ON c.id = cm.chat_id WHERE cm.chat_id = $1 AND cm.user_id = $2',
      [chatId, senderId],
      (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      }
    );
  });

  if (!member) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (member.type === 'channel' && !['owner', 'admin'].includes(member.role)) {
    return res.status(403).json({ error: 'Only admins can write to channel' });
  }

  const messageText = text || '';
  const attachments = Array.isArray(attachmentIds) ? attachmentIds : [];

  const { getLinkPreview } = require('./linkPreview');
  const extractFirstUrl = (value) => {
    if (!value) return null;
    const match = String(value).match(/https?:\/\/[^\s]+/i);
    return match ? match[0] : null;
  };

  const previewUrl = extractFirstUrl(messageText);
  let linkPreview = null;

  if (previewUrl) {
    try {
      const result = await getLinkPreview(previewUrl);
      if (result.success) {
        linkPreview = result.data;
      }
    } catch (error) {
      linkPreview = null;
    }
  }

  let sticker = null;
  let messageType = 'text';
  let messageBody = messageText;

  if (stickerId) {
    const stickerRow = await new Promise((resolve) => {
      db.get(
        `SELECT s.id, s.name, s.file_path, s.pack_id, sp.name as pack_name
         FROM stickers s
         JOIN sticker_packs sp ON sp.id = s.pack_id
         WHERE s.id = $1`,
        [stickerId],
        (err, row) => {
          if (err) return resolve(null);
          resolve(row || null);
        }
      );
    });
    if (!stickerRow) {
      return res.status(400).json({ error: 'Sticker not found' });
    }
    sticker = {
      id: stickerRow.id.toString(),
      name: stickerRow.name,
      filePath: stickerRow.file_path,
      packId: stickerRow.pack_id.toString(),
      packName: stickerRow.pack_name,
      url: `${getPublicBaseUrl(req)}/api/stickers/${stickerRow.id}`,
    };
    messageType = 'sticker';
    messageBody = messageText || '[sticker]';
  }

  const insertMessageQuery = `
    INSERT INTO messages (chat_id, sender_id, text, type, reply_to_message_id, link_preview, sticker_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;

  db.serialize(() => {
    db.run('BEGIN', (beginErr) => {
      if (beginErr) {
        return res.status(500).json({ error: 'Database error' });
      }

      db.run(
        insertMessageQuery,
        [chatId, senderId, messageBody, messageType, replyToMessageId || null, linkPreview ? JSON.stringify(linkPreview) : null, sticker ? sticker.id : null],
        function(err) {
          if (err) {
            return db.run('ROLLBACK', () => res.status(500).json({ error: 'Database error' }));
          }

          const messageId = this.lastID;

          const linkAttachments = () => {
            if (attachments.length === 0) {
              return finalizeTransaction();
            }

            const placeholders = attachments.map((_, idx) => `$${idx + 2}`).join(',');
            const updateAttachmentsQuery = `
              UPDATE attachments SET message_id = $1
              WHERE id IN (${placeholders}) AND message_id IS NULL
            `;

            db.run(updateAttachmentsQuery, [messageId, ...attachments], (updateErr) => {
              if (updateErr) {
                return db.run('ROLLBACK', () => res.status(500).json({ error: 'Database error' }));
              }
              finalizeTransaction();
            });
          };

          const finalizeTransaction = () => {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                return res.status(500).json({ error: 'Database error' });
              }

              const senderQuery = 'SELECT name, username, avatar, verified FROM users WHERE id = $1';
              db.get(senderQuery, [senderId], (senderErr, sender) => {
                if (senderErr) console.error('Error getting sender:', senderErr);

                let attachmentsData = [];
                if (attachments.length > 0) {
                  db.all(
                    'SELECT * FROM attachments WHERE message_id = $1',
                    [messageId],
                    (attErr, atts) => {
                      if (attErr) console.error('Error getting attachments:', attErr);
                      attachmentsData = atts || [];
                      continueWithMessage(messageId, sender, attachmentsData);
                    }
                  );
                } else {
                  continueWithMessage(messageId, sender, []);
                }

                function continueWithMessage(msgId, senderData, atts) {
                  const formattedAttachments = atts.map(att => ({
                    id: att.id.toString(),
                    type: att.type,
                    url: att.url,
                    mime: att.mime,
                    size: att.size,
                    width: att.width,
                    height: att.height
                  }));

                  const sendChatMessage = req.app.get('sendChatMessage');
                  const createNotification = req.app.get('createNotification');

                  if (sendChatMessage) {
                    sendChatMessage({
                      id: msgId,
                      chatId: String(chatId),
                      senderId: senderId.toString(),
                      text: messageBody,
                      type: messageType,
                      sticker,
                      timestamp: new Date().toISOString(),
                      attachments: formattedAttachments,
                      replyToMessageId: replyToMessageId ? replyToMessageId.toString() : null,
                      linkPreview,
                      sender: senderData ? {
                        name: senderData.name,
                        username: senderData.username,
                        avatar: senderData.avatar,
                        verified: senderData.verified === 1
                      } : null
                    });
                  }

                  if (createNotification) {
                    db.all(
                      'SELECT user_id FROM chat_members WHERE chat_id = $1 AND user_id <> $2',
                      [chatId, senderId],
                      (memberErr, members) => {
                        if (memberErr) return;
                        const actorName = senderData?.name || senderData?.username || 'Someone';
                        (members || []).forEach((memberRow) => {
                          createNotification({
                            userId: memberRow.user_id,
                            type: 'message',
                            actorId: senderId,
                            actorUsername: senderData?.username || null,
                            actorAvatar: senderData?.avatar || null,
                            targetId: chatId,
                            targetType: 'chat',
                            message: `${actorName} отправил сообщение`,
                            url: `/messages/${chatId}`,
                          }).catch(err => {
                            console.error('[API] Error creating notification:', err);
                          });
                        });
                      }
                    );
                  }

                  res.json({
                    message: 'Message sent successfully',
                    messageId: msgId,
                    attachments: formattedAttachments,
                    replyToMessageId: replyToMessageId ? replyToMessageId.toString() : null,
                    linkPreview,
                    sticker,
                    type: messageType,
                  });

                  indexMessage({
                    id: msgId,
                    chatId: chatId,
                    userId: senderId,
                    text: messageBody,
                    timestamp: new Date().toISOString(),
                  }).catch(err => {
                    console.error('[Meilisearch] Indexation error:', err);
                  });

                  createMentionNotifications(messageBody, senderId, {
                    actorId: senderId,
                    actorUsername: senderData?.username || null,
                    actorAvatar: senderData?.avatar || null,
                    targetId: msgId,
                    targetType: 'message',
                    message: null,
                    url: `/messages/${chatId}?message=${msgId}`,
                  }, req);
                }
              });
            });
          };

          linkAttachments();
        }
      );
    });
  });
}));

// Отправка голосового сообщения
router.post('/messages/voice', authenticateToken, voiceUpload.single('audio'), asyncHandler(async (req, res) => {
  const senderId = req.user.userId;
  const { chatId, duration, replyToMessageId } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required' });
  }

  if (!chatId) {
    return res.status(400).json({ error: 'chatId is required' });
  }

  const member = await new Promise((resolve) => {
    db.get('SELECT role, c.type FROM chat_members cm JOIN chats c ON c.id = cm.chat_id WHERE cm.chat_id = $1 AND cm.user_id = $2', [chatId, senderId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (!member) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (member.type === 'channel' && !['owner', 'admin'].includes(member.role)) {
    return res.status(403).json({ error: 'Only admins can write to channel' });
  }

  const audioDuration = parseFloat(duration) || 0;

  let attachment = null;

  // Создаем сообщение
  const messageText = `\u0413\u043e\u043b\u043e\u0441\u043e\u0432\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 (${Math.floor(audioDuration)}\u0441)`;
  
  const insertMessageQuery = `
    INSERT INTO messages (chat_id, sender_id, text, type, reply_to_message_id)
    VALUES ($1, $2, $3, 'voice', $4)
  `;

  const messageId = await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN', (beginErr) => {
        if (beginErr) return reject(beginErr);
        db.run(
          insertMessageQuery,
          [chatId, senderId, messageText, replyToMessageId || null],
          function(err) {
            if (err) {
              return db.run('ROLLBACK', () => reject(err));
            }

            const createdMessageId = this.lastID;
            const attachmentUrl = `${getPublicBaseUrl(req)}/uploads/voice/${req.file.filename}`;

            db.run(
              `INSERT INTO attachments (message_id, type, url, mime, size, duration)
               VALUES ($1, 'voice', $2, $3, $4, $5)`,
              [
                createdMessageId,
                attachmentUrl,
                req.file.mimetype,
                req.file.size,
                audioDuration
              ],
              function(attErr) {
                if (attErr) {
                  return db.run('ROLLBACK', () => reject(attErr));
                }

                attachment = {
                  id: this.lastID.toString(),
                  type: 'voice',
                  url: attachmentUrl,
                  mime: req.file.mimetype,
                  size: req.file.size,
                  duration: audioDuration
                };

                db.run('COMMIT', (commitErr) => {
                  if (commitErr) return reject(commitErr);
                  resolve(createdMessageId);
                });
              }
            );
          }
        );
      });
    });
  });

  // Получаем информацию об отправителе
  const sender = await new Promise((resolve, reject) => {
    db.get(
      'SELECT name, username, avatar, verified FROM users WHERE id = $1',
      [senderId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  // Обновляем или создаем чат
  const chatIdValue = chatId;

  // Отправляем WebSocket уведомление
  const sendToUser = req.app.get('sendToUser');
  const createNotification = req.app.get('createNotification');

  const sendChatMessage = req.app.get('sendChatMessage');
  if (sendChatMessage) {
    sendChatMessage({
      id: messageId.toString(),
      chatId: String(chatIdValue),
      senderId: senderId.toString(),
      text: messageText,
      type: 'voice',
      timestamp: new Date().toISOString(),
      attachments: [attachment],
      replyToMessageId: replyToMessageId ? replyToMessageId.toString() : null,
      sender: sender ? {
        name: sender.name,
        username: sender.username,
        avatar: sender.avatar,
        verified: sender.verified === 1
      } : null
    });
  }

  // Создаем уведомление для получателя
  if (createNotification) {
    db.all(
      'SELECT user_id FROM chat_members WHERE chat_id = $1 AND user_id <> $2',
      [chatIdValue, senderId],
      (memberErr, members) => {
        if (memberErr) return;
        const actorName = sender?.name || sender?.username || 'Someone';
        (members || []).forEach((memberRow) => {
          createNotification({
            userId: memberRow.user_id,
            type: 'message',
            actorId: senderId,
            actorUsername: sender?.username || null,
            actorAvatar: sender?.avatar || null,
            targetId: chatIdValue || null,
            targetType: 'chat',
            message: `${actorName} отправил сообщение`,
            url: `/messages/${chatIdValue}`,
          }).catch(err => {
            console.error('[API] Error creating notification:', err);
          });
        });
      }
    );
  }

  res.json({
    message: 'Voice message sent successfully',
    messageId: messageId.toString(),
    attachment
  });
}));

// Поиск сообщений (DB)
router.get('/messages/search', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { q, limit = 50 } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({ error: 'Search query "q" is required' });
  }

  // Получаем все чаты, где пользователь является участником
  const getChatsQuery = `
    SELECT c.id
    FROM chats c
    JOIN chat_members cm ON cm.chat_id = c.id
    WHERE cm.user_id = $1
  `;

  const chats = await new Promise((resolve, reject) => {
    db.all(getChatsQuery, [userId, userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Извлекаем ID чатов
  const chatIds = chats.map(chat => String(chat.id));

  if (chatIds.length === 0) {
    return res.json({
      query: q,
      results: [],
      count: 0,
    });
  }

  const searchLimit = parseInt(limit, 10);
  const searchQuery = q.trim();
  const dbLikeQuery = `%${searchQuery}%`;
  const chatIdsNumeric = chatIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));

  if (chatIdsNumeric.length === 0) {
    return res.json({
      query: q,
      results: [],
      count: 0,
      source: 'db',
    });
  }

  const dbResults = await new Promise((resolve, reject) => {
    db.all(
      `SELECT m.id,
              m.text,
              m.created_at as timestamp,
              m.sender_id,
              u.name as sender_name,
              u.username as sender_username,
              u.avatar as sender_avatar,
              u.verified as sender_verified,
              c.id as chat_id
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       JOIN chats c ON c.id = m.chat_id
       WHERE c.id = ANY($1)
         AND m.deleted_for_all_at IS NULL
         AND m.text ILIKE $2
       ORDER BY m.created_at DESC
       LIMIT $3`,
      [chatIdsNumeric, dbLikeQuery, searchLimit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });

  const results = dbResults.map((row) => ({
    id: String(row.id),
    text: row.text,
    timestamp: row.timestamp,
    chatId: String(row.chat_id),
    user: {
      id: String(row.sender_id),
      name: row.sender_name,
      username: row.sender_username,
      avatar: row.sender_avatar,
      verified: row.sender_verified === 1,
    },
    contact: null,
  }));

  res.json({
    query: q,
    results,
    count: results.length,
    source: 'db',
  });
}));

// Get posts for feed
router.get('/posts', authenticateToken, (req, res) => {
  const query = `
    SELECT p.id, p.user_id, p.text, p.image_url, p.timestamp, p.replies_count AS replies, p.reposts_count AS reposts, p.resonance_count AS resonance, u.name, u.username, u.avatar, u.verified
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.timestamp DESC
    LIMIT 50
  `;

  db.all(query, [], (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Преобразуем user_id в строку для корректной работы на frontend
    const formattedPosts = posts.map(post => ({
      ...post,
      user_id: post.user_id.toString()
    }));

    res.json({ posts: formattedPosts });
  });
});

// Get recommended posts (smart feed with algorithm)
router.get('/posts/recommended', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  // Get user's engagement history (likes, comments)
  const engagementQuery = `
    SELECT DISTINCT p.user_id as engaged_user_id
    FROM likes l
    JOIN posts p ON l.post_id = p.id
    WHERE l.user_id = $1
    UNION
    SELECT DISTINCT p.user_id as engaged_user_id
    FROM comments c
    JOIN posts p ON c.post_id = p.id
    WHERE c.user_id = $2
    LIMIT 50
  `;
  
  const engagedUsers = await new Promise((resolve, reject) => {
    db.all(engagementQuery, [userId, userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  const engagedUserIds = engagedUsers.map(u => u.engaged_user_id).join(',');
  
  // Smart algorithm: posts from engaged users + trending posts
  let query = `
    SELECT p.id, p.user_id, p.text, p.image_url, p.timestamp, 
           p.replies_count AS replies, p.reposts_count AS reposts, 
           p.resonance_count AS resonance, 
           u.name, u.username, u.avatar, u.verified
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.timestamp >= NOW() - INTERVAL '14 days'
  `;
  
  if (engagedUserIds) {
    query += ` AND p.user_id IN (${engagedUserIds})`;
  }
  
  // Order by engagement score (resonance*2 + comments*3 + reposts)
  query += `
    ORDER BY (p.resonance_count * 2 + p.replies_count * 3 + p.reposts_count) DESC, 
             p.timestamp DESC
    LIMIT 30
  `;
  
  const posts = await new Promise((resolve, reject) => {
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  const formattedPosts = posts.map(post => ({
    ...post,
    user_id: post.user_id.toString(),
    id: post.id.toString(),
  }));
  
  res.json({ posts: formattedPosts });
}));

// Get following feed (posts from users you follow)
router.get('/posts/following', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT p.id, p.user_id, p.text, p.image_url, p.timestamp, p.replies_count AS replies, p.reposts_count AS reposts, p.resonance_count AS resonance, u.name, u.username, u.avatar, u.verified
    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN followers f ON f.following_id = p.user_id
    WHERE f.follower_id = $1
    ORDER BY p.timestamp DESC
    LIMIT 50
  `;

  db.all(query, [userId], (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const formattedPosts = posts.map(post => ({
      ...post,
      user_id: post.user_id.toString()
    }));

    res.json({ posts: formattedPosts });
  });
});

// Create a new post with WebSocket broadcast
router.post('/posts', authenticateToken, upload.single('image'), (req, res) => {
  const userId = req.user.userId;
  const { text } = req.body;

  if (!text && !req.file) {
    return res.status(400).json({ error: 'Either text or image is required' });
  }

  if (text && text.length > 420) {
    return res.status(400).json({ error: 'Post text exceeds 420 characters' });
  }

  // Сохраняем полный URL для корректного отображения
  const imageUrl = req.file ? `${getPublicBaseUrl(req)}/uploads/${req.file.filename}` : null;

  let query;
  let params;
  const timestamp = new Date().toISOString();

  if (imageUrl) {
    query = `
      INSERT INTO posts (user_id, text, image_url, timestamp)
      VALUES ($1, $2, $3, $4)
    `;
    params = [userId, text || '', imageUrl, timestamp];
  } else {
    query = `
      INSERT INTO posts (user_id, text, timestamp)
      VALUES ($1, $2, $3)
    `;
    params = [userId, text || '', timestamp];
  }

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const postId = this.lastID;

    // Get user info for the post
    const userQuery = 'SELECT name, username, avatar, verified FROM users WHERE id = $1';
    db.get(userQuery, [userId], (err, user) => {
      if (err) console.error('Error getting user:', err);

      const newPost = {
        id: postId,
        userId: userId.toString(),
        text: text || '',
        imageUrl,
        timestamp: new Date().toISOString(),
        replies: 0,
        reposts: 0,
        resonance: 0,
        name: user?.name,
        username: user?.username,
        avatar: user?.avatar,
        verified: user?.verified === 1
      };

      // Broadcast new post to all connected clients
      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast({
          type: 'new_post',
          data: newPost
        });
      }

      res.json({
        message: 'Post created successfully',
        postId,
        post: newPost
      });
    });
  });
});

// Like/Unlike a post (Resonance)
router.post('/posts/:postId/resonance', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.postId;

  // Check if already liked
  const checkQuery = 'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2';
  db.get(checkQuery, [userId, postId], (err, like) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (like) {
      // Unlike
      const unlikeQuery = 'DELETE FROM likes WHERE user_id = $1 AND post_id = $2';
      db.run(unlikeQuery, [userId, postId], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const updateCountQuery = 'UPDATE posts SET resonance_count = resonance_count - 1 WHERE id = $1 AND resonance_count > 0';
        db.run(updateCountQuery, [postId], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get updated count
          db.get('SELECT resonance_count FROM posts WHERE id = $1', [postId], (err, post) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            const broadcast = req.app.get('broadcast');
            if (broadcast) {
              broadcast({
                type: 'post_resonance_updated',
                data: { postId, resonance: post?.resonance_count || 0, liked: false }
              });
            }

            res.json({ message: 'Post unresonated', resonance: post?.resonance_count || 0, liked: false });
          });
        });
      });
    } else {
      // Like
      const insertQuery = 'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)';
      db.run(insertQuery, [userId, postId], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const updateCountQuery = 'UPDATE posts SET resonance_count = resonance_count + 1 WHERE id = $1';
        db.run(updateCountQuery, [postId], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get updated count
          db.get('SELECT resonance_count FROM posts WHERE id = $1', [postId], (err, post) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            const broadcast = req.app.get('broadcast');
            if (broadcast) {
              broadcast({
                type: 'post_resonance_updated',
                data: { postId, resonance: post?.resonance_count || 0, liked: true }
              });
            }
            
            // Get post author for notification
            db.get('SELECT user_id FROM posts WHERE id = $1', [postId], (err, postAuthor) => {
              if (err) console.error('Error getting post author:', err);
              
              // Create notification for post author (if not self-like)
              const createNotification = req.app.get('createNotification');
              if (createNotification && postAuthor && postAuthor.user_id !== userId) {
                db.get('SELECT name, username, avatar FROM users WHERE id = $1', [userId], (err, actor) => {
                  const actorName = actor?.name || actor?.username || 'Someone';
                  createNotification({
                    userId: postAuthor.user_id,
                    type: 'post_resonance',
                    actorId: userId,
                    actorUsername: actor?.username || null,
                    actorAvatar: actor?.avatar || null,
                    targetId: postId,
                    targetType: 'post',
                    message: `${actorName} поставил реакцию на ваш пост`,
                    url: `/feed?post=${postId}`,
                  }).catch(err => {
                    console.error('[API] Error creating notification:', err);
                  });
                });
              }
            });

            res.json({ message: 'Post resonated', resonance: post?.resonance_count || 0, liked: true });
          });
        });
      });
    }
  });
});

// Get resonance status for a post
router.get('/posts/:postId/resonance', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.postId;

  // Check if user has liked the post
  const checkQuery = 'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2';
  db.get(checkQuery, [userId, postId], (err, like) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get resonance count
    db.get('SELECT resonance_count FROM posts WHERE id = $1', [postId], (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        resonance: post?.resonance_count || 0,
        liked: !!like
      });
    });
  });
});

// Get comments for a post
router.get('/posts/:postId/comments', authenticateToken, (req, res) => {
  const postId = req.params.postId;

  const query = `SELECT c.*, u.name, u.username, u.avatar, u.verified
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = $1
    ORDER BY c.created_at ASC`;

  db.all(query, [postId], (err, comments) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ comments });
  });
});

// Add a comment to a post
router.post('/posts/:postId/comments', authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.userId;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  if (text.length > 1000) {
    return res.status(400).json({ error: 'Comment text exceeds 1000 characters' });
  }

  const checkPostQuery = 'SELECT id FROM posts WHERE id = $1';

  db.get(checkPostQuery, [postId], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const insertQuery = `INSERT INTO comments (post_id, user_id, text)
      VALUES ($1, $2, $3)`;

    db.run(insertQuery, [postId, userId, text], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const commentId = this.lastID;

      // Update the replies count
      const updateRepliesQuery = 'UPDATE posts SET replies_count = replies_count + 1 WHERE id = $1';
      db.run(updateRepliesQuery, [postId], (err) => {
        if (err) {
          console.error('Error updating replies count:', err);
        }
      });

      // Get user info
      const userQuery = 'SELECT name, username, avatar, verified FROM users WHERE id = $1';
      db.get(userQuery, [userId], (err, user) => {
        if (err) console.error('Error getting user:', err);

        const newComment = {
          id: commentId,
          postId,
          userId: userId.toString(),
          text,
          createdAt: new Date().toISOString(),
          name: user?.name,
          username: user?.username,
          avatar: user?.avatar,
          verified: user?.verified === 1
        };

        // Broadcast new comment
        const broadcast = req.app.get('broadcast');
        if (broadcast) {
          broadcast({
            type: 'new_comment',
            data: newComment
          });
        }
        
        // Get post author for notification
        db.get('SELECT user_id FROM posts WHERE id = $1', [postId], (err, post) => {
          if (err) console.error('Error getting post author:', err);

          // Create notification for post author (if not self-comment)
          const createNotification = req.app.get('createNotification');
          if (createNotification && post && post.user_id !== userId) {
            db.get('SELECT name, username, avatar FROM users WHERE id = $1', [userId], (err, actor) => {
              const actorName = actor?.name || actor?.username || 'Someone';
              createNotification({
                userId: post.user_id,
                type: 'post_comment',
                actorId: userId,
                actorUsername: actor?.username || null,
                actorAvatar: actor?.avatar || null,
                targetId: postId,
                targetType: 'post',
                message: `${actorName} оставил комментарий к вашему посту`,
                url: `/feed?post=${postId}&comment=${commentId}`,
              }).catch(err => {
                console.error('[API] Error creating notification:', err);
              });
            });
          }
        });
        
        // Create notifications for mentioned users in comment
        db.get('SELECT name, username, avatar FROM users WHERE id = $1', [userId], (err, actor) => {
          if (err) {
            console.error('Error getting comment author for mentions:', err);
          }
          createMentionNotifications(text, userId, {
            actorId: userId,
            actorUsername: actor?.username || null,
            actorAvatar: actor?.avatar || null,
            targetId: commentId,
            targetType: 'comment',
            message: null,
            url: `/feed?post=${postId}&comment=${commentId}`,
          }, req);
        });

  res.json({
    message: 'Comment added successfully',
    commentId,
    comment: newComment
  });
      });
    });
  });
});

// Reply to a comment
router.post('/comments/:commentId/replies', authenticateToken, (req, res) => {
  const parentCommentId = req.params.commentId;
  const userId = req.user.userId;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  db.get('SELECT post_id, user_id FROM comments WHERE id = $1', [parentCommentId], (err, parent) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!parent) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const postId = parent.post_id;
    const insertQuery = `INSERT INTO comments (post_id, user_id, text)
      VALUES ($1, $2, $3)`;

    db.run(insertQuery, [postId, userId, text], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const replyId = this.lastID;
      const createNotification = req.app.get('createNotification');

      if (createNotification && parent.user_id !== userId) {
        db.get('SELECT name, username, avatar FROM users WHERE id = $1', [userId], (err, actor) => {
          const actorName = actor?.name || actor?.username || 'Someone';
          createNotification({
            userId: parent.user_id,
            type: 'reply',
            actorId: userId,
            actorUsername: actor?.username || null,
            actorAvatar: actor?.avatar || null,
            targetId: parentCommentId,
            targetType: 'comment',
            message: `${actorName} ответил на ваш комментарий`,
            url: `/feed?post=${postId}&comment=${parentCommentId}`,
          }).catch(err => {
            console.error('[API] Error creating notification:', err);
          });
        });
      }

      db.get('SELECT name, username, avatar FROM users WHERE id = $1', [userId], (err, actor) => {
        if (err) {
          console.error('Error getting reply author for mentions:', err);
        }
        createMentionNotifications(text, userId, {
          actorId: userId,
          actorUsername: actor?.username || null,
          actorAvatar: actor?.avatar || null,
          targetId: replyId,
          targetType: 'comment',
          message: null,
          url: `/feed?post=${postId}&comment=${replyId}`,
        }, req);
      });

      res.json({
        message: 'Reply added successfully',
        replyId,
        postId,
      });
    });
  });
});

// Get user's verification status
router.get('/profile/:userId/verification-status', authenticateToken, (req, res) => {
  const userId = req.params.userId;

  const query = `SELECT vr.status, vr.reason, vr.tiktok_video_url, vr.created_at, vr.reviewed_at, u.name as reviewer_name
    FROM verification_requests vr
    LEFT JOIN users u ON vr.reviewer_id = u.id
    WHERE vr.user_id = $1
    ORDER BY vr.created_at DESC
    LIMIT 1`;

  db.get(query, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ verificationStatus: result || null });
  });
});

// Submit verification request
router.post('/profile/verification-request', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { reason, tiktokVideoUrl } = req.body;

  if (!reason || !tiktokVideoUrl) {
    return res.status(400).json({ error: 'Reason and TikTok video URL are required' });
  }

  const checkUserQuery = 'SELECT created_at FROM users WHERE id = $1';

  db.get(checkUserQuery, [userId], (err, user) => {
    if (err) {
      console.error('Database error checking user:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const registrationDate = new Date(user.created_at);
    const currentDate = new Date();
    const timeDiff = currentDate.getTime() - registrationDate.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff < 5) {
      return res.status(400).json({ error: 'You must be registered for at least 5 minutes to request verification' });
    }

    // Check if user already has an active verification
    const checkActiveVerificationQuery = `SELECT verification_expiry FROM users WHERE id = $1 AND verified = 1`;

    db.get(checkActiveVerificationQuery, [userId], (err, activeUser) => {
      if (err) {
        console.error('Database error checking active verification:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // If user has active verification that hasn't expired, check if they can reapply
      if (activeUser && activeUser.verification_expiry) {
        const expiryDate = new Date(activeUser.verification_expiry);
        const now = new Date();

        // If verification is still valid, don't allow new request
        if (now < expiryDate) {
          return res.status(400).json({
            error: 'You already have an active verification. Please wait until it expires to reapply.',
            expiry: activeUser.verification_expiry
          });
        }
      }

      const checkPendingQuery = 'SELECT id FROM verification_requests WHERE user_id = $1 AND status = $2';

      db.get(checkPendingQuery, [userId, 'pending'], (err, pendingRequest) => {
        if (err) {
          console.error('Database error checking pending requests:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (pendingRequest) {
          return res.status(400).json({ error: 'You already have a pending verification request' });
        }

        const insertQuery = `INSERT INTO verification_requests (user_id, reason, tiktok_video_url)
          VALUES ($1, $2, $3)`;
        db.run(insertQuery, [userId, reason, tiktokVideoUrl], function(err) {
          if (err) {
            console.error('Database error inserting verification request:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ message: 'Verification request submitted successfully', requestId: this.lastID });
        });
      });
    });
  });
});

const isAdminUser = (username) => {
  if (!username || !ADMIN_USERNAME) return false;
  return String(username).toLowerCase() === ADMIN_USERNAME;
};

// Admin: Get all verification requests
router.get('/admin/verification-requests', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const checkUserQuery = 'SELECT username FROM users WHERE id = $1';

  db.get(checkUserQuery, [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !isAdminUser(user.username)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `SELECT vr.*, u.name, u.username, u.email
      FROM verification_requests vr
      JOIN users u ON vr.user_id = u.id
      ORDER BY vr.created_at DESC`;

    db.all(query, [], (err, requests) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ requests });
    });
  });
});

// Admin: Review verification request
router.post('/admin/review-verification-request/:requestId', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const requestId = req.params.requestId;
  const { status, reviewNotes } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be approved or rejected.' });
  }

  const checkUserQuery = 'SELECT username FROM users WHERE id = $1';

  db.get(checkUserQuery, [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !isAdminUser(user.username)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateRequestQuery = `UPDATE verification_requests
      SET status = $1, reviewed_at = NOW(), reviewer_id = $2, review_notes = $3
      WHERE id = $4`;

    db.run(updateRequestQuery, [status, userId, reviewNotes, requestId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Verification request not found' });
      }

      if (status === 'approved') {
        const getRequestUserIdQuery = 'SELECT user_id FROM verification_requests WHERE id = $1';

        db.get(getRequestUserIdQuery, [requestId], (err, request) => {
          if (err) {
            console.error('Error getting request user ID:', err);
            return res.json({ message: 'Request reviewed successfully' });
          }

          if (request) {
            // Set verification expiry to 1 month from now
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            const expiryISO = expiryDate.toISOString();

            const updateUserQuery = 'UPDATE users SET verified = 1, verification_expiry = $1 WHERE id = $2';

            db.run(updateUserQuery, [expiryISO, request.user_id], (err) => {
              if (err) {
                console.error('Error updating user verification status:', err);
              } else {
                // Send WebSocket notification
                const sendToUser = req.app.get('sendToUser');
                if (sendToUser) {
                  sendToUser(request.user_id, {
                    type: 'verification_approved',
                    data: { 
                      message: 'Your verification request has been approved!',
                      expiry: expiryISO
                    }
                  });
                }
              }

              res.json({ 
                message: 'Request reviewed and user verified successfully. Verification is valid for 1 month.',
                expiry: expiryISO
              });
            });
          } else {
            res.json({ message: 'Request reviewed successfully' });
          }
        });
      } else {
        res.json({ message: 'Request reviewed successfully' });
      }
    });
  });
});

// Admin: Get all registered users
router.get('/admin/users', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const checkUserQuery = 'SELECT username FROM users WHERE id = $1';

  db.get(checkUserQuery, [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !isAdminUser(user.username)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `SELECT id, name, username, email, bio, avatar, verified, join_date, created_at
      FROM users
      ORDER BY created_at DESC`;

    db.all(query, [], (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ users });
    });
  });
});

// Delete post (only by post owner)
router.delete('/posts/:postId', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.postId;

  // First check if the post exists and belongs to the user
  const checkQuery = 'SELECT user_id FROM posts WHERE id = $1';

  db.get(checkQuery, [postId], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if the user owns the post
    if (String(post.user_id) !== String(userId)) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    // Delete the post
    const deleteQuery = 'DELETE FROM posts WHERE id = $1';

    db.run(deleteQuery, [postId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: 'Post deleted successfully' });
    });
  });
});

// Report post
router.post('/posts/:postId/report', authenticateToken, (req, res) => {
  const reporterId = req.user.userId;
  const postId = req.params.postId;
  const { reason } = req.body;

  // Check if post exists
  const checkPostQuery = 'SELECT id, user_id FROM posts WHERE id = $1';

  db.get(checkPostQuery, [postId], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user already reported this post
    const checkReportQuery = 'SELECT id FROM post_reports WHERE post_id = $1 AND reporter_id = $2';

    db.get(checkReportQuery, [postId, reporterId], (err, existingReport) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingReport) {
        return res.status(400).json({ error: 'You have already reported this post' });
      }

      // Create the report
      const insertQuery = `INSERT INTO post_reports (post_id, reporter_id, reason)
        VALUES ($1, $2, $3)`;

      db.run(insertQuery, [postId, reporterId, reason || 'Reported by user'], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Report submitted successfully', reportId: this.lastID });
      });
    });
  });
});

// Admin: Get post reports
router.get('/admin/post-reports', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const checkUserQuery = 'SELECT username FROM users WHERE id = $1';

  db.get(checkUserQuery, [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !isAdminUser(user.username)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `SELECT pr.*, p.text as post_text, p.image_url as post_image, 
                          u1.name as reporter_name, u1.username as reporter_username,
                          u2.name as post_author_name, u2.username as post_author_username
      FROM post_reports pr
      JOIN posts p ON pr.post_id = p.id
      JOIN users u1 ON pr.reporter_id = u1.id
      JOIN users u2 ON p.user_id = u2.id
      ORDER BY pr.created_at DESC`;

    db.all(query, [], (err, reports) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ reports });
    });
  });
});

// Admin: Review post report
router.post('/admin/post-reports/:reportId', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const reportId = req.params.reportId;
  const { action, reviewNotes } = req.body; // action: 'delete_post' or 'dismiss'

  const checkUserQuery = 'SELECT username FROM users WHERE id = $1';

  db.get(checkUserQuery, [userId], (err, user) => {
    if (err) {
      console.error('Database error checking user:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !isAdminUser(user.username)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get the report with post_id
    const getReportQuery = 'SELECT post_id FROM post_reports WHERE id = $1';

    db.get(getReportQuery, [reportId], (err, report) => {
      if (err) {
        console.error('Database error getting report:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      if (action === 'delete_post') {
        // First check if post still exists
        const checkPostQuery = 'SELECT id FROM posts WHERE id = $1';
        db.get(checkPostQuery, [report.post_id], (err, post) => {
          if (err) {
            console.error('Database error checking post:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          if (!post) {
            // Post already deleted, just mark report as resolved
            const updateReportQuery = `UPDATE post_reports
              SET status = 'resolved', reviewed_at = NOW(), reviewer_id = $1, review_notes = $2
              WHERE id = $3`;

            db.run(updateReportQuery, [userId, reviewNotes, reportId], (err) => {
              if (err) {
                console.error('Database error updating report:', err);
                return res.status(500).json({ error: 'Database error' });
              }

              return res.json({ message: 'Post already deleted, report marked as resolved' });
            });
            return;
          }

          // Delete the post (this will also cascade delete comments/likes)
          const deletePostQuery = 'DELETE FROM posts WHERE id = $1';
          db.run(deletePostQuery, [report.post_id], function(err) {
            if (err) {
              console.error('Database error deleting post:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            // Update report status to resolved
            const updateReportQuery = `UPDATE post_reports
              SET status = 'resolved', reviewed_at = NOW(), reviewer_id = $1, review_notes = $2
              WHERE id = $3`;

            db.run(updateReportQuery, [userId, reviewNotes, reportId], (err) => {
              if (err) {
                console.error('Database error updating report:', err);
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({ message: 'Post deleted and report resolved' });
            });
          });
        });
      } else if (action === 'dismiss') {
        // Just update report status to dismissed
        const updateReportQuery = `UPDATE post_reports
          SET status = 'dismissed', reviewed_at = NOW(), reviewer_id = $1, review_notes = $2
          WHERE id = $3`;

        db.run(updateReportQuery, [userId, reviewNotes, reportId], (err) => {
          if (err) {
            console.error('Database error updating report:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ message: 'Report dismissed' });
        });
      } else {
        return res.status(400).json({ error: 'Invalid action. Must be delete_post or dismiss' });
      }
    });
  });
});

// ==================== ONBOARDING ====================

// Get onboarding suggestions (verified users to follow)
router.get('/onboarding/suggestions', authenticateToken, (req, res) => {
  const currentUserId = req.user.userId;

  const query = `
    SELECT u.id, u.name, u.username, u.bio, u.avatar, u.verified, u.followers_count
    FROM users u
    WHERE u.is_verified = 1 OR u.verified = 1
      AND u.id != $1
      AND u.id NOT IN (
        SELECT following_id FROM followers WHERE follower_id = $2
      )
    ORDER BY u.followers_count DESC, u.created_at DESC
    LIMIT 30
  `;

  db.all(query, [currentUserId, currentUserId], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const formattedUsers = users.map(user => ({
      ...user,
      id: user.id.toString()
    }));

    res.json({ users: formattedUsers });
  });
});

// Batch follow users
router.post('/follow/batch', authenticateToken, (req, res) => {
  const currentUserId = req.user.userId;
  const { userIds } = req.body;
  const createNotification = req.app.get('createNotification');

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'userIds array is required' });
  }

  if (userIds.length > 50) {
    return res.status(400).json({ error: 'Cannot follow more than 50 users at once' });
  }

  // Filter out self and duplicates
  const uniqueUserIds = [...new Set(userIds)].filter(id => String(id) !== String(currentUserId));

  if (uniqueUserIds.length === 0) {
    return res.json({ message: 'No users to follow', followed: [] });
  }

  const placeholders = uniqueUserIds.map((_, index) => `$${index + 2}`).join(',');

  // Get users that are already being followed
  const checkQuery = `
    SELECT following_id FROM followers
    WHERE follower_id = $1 AND following_id IN (${placeholders})
  `;

  db.all(checkQuery, [currentUserId, ...uniqueUserIds], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const existingIds = existing.map(row => row.following_id);
    const toFollow = uniqueUserIds.filter(id => !existingIds.includes(id));

    if (toFollow.length === 0) {
      return res.json({ message: 'Already following all selected users', followed: [] });
    }

    // Insert new follows in a transaction
    const dbInstance = require('./db');
    dbInstance.get('SELECT name, username, avatar FROM users WHERE id = $1', [currentUserId], (err, actor) => {
      const actorName = actor?.name || actor?.username || 'Someone';

      dbInstance.serialize(() => {
        dbInstance.run('BEGIN TRANSACTION');

        const insertQuery = 'INSERT INTO followers (follower_id, following_id) VALUES ($1, $2)';
        const followed = [];
        let completed = 0;

        toFollow.forEach((targetUserId) => {
          dbInstance.run(insertQuery, [currentUserId, targetUserId], function(err) {
            if (err) {
              console.error('Error following user:', err);
            } else {
              followed.push({ id: targetUserId.toString() });
              // Increment followers_count
              dbInstance.run(
                'UPDATE users SET followers_count = followers_count + 1 WHERE id = $1',
                [targetUserId],
                (err) => { if (err) console.error('Error updating followers_count:', err); }
              );

              if (createNotification) {
                createNotification({
                  userId: targetUserId,
                  type: 'follow',
                  actorId: currentUserId,
                  actorUsername: actor?.username || null,
                  actorAvatar: actor?.avatar || null,
                  targetId: targetUserId,
                  targetType: 'user',
                  message: `${actorName} подписался на вас`,
                  url: `/profile/${currentUserId}`,
                }).catch(err => {
                  console.error('[API] Error creating notification:', err);
                });
              }
            }
            completed++;
            if (completed === toFollow.length) {
              dbInstance.run('COMMIT', (err) => {
                if (err) {
                  console.error('Error committing transaction:', err);
                  return res.status(500).json({ error: 'Transaction failed' });
                }
                res.json({
                  message: `Successfully followed ${followed.length} users`,
                  followed
                });
              });
            }
          });
        });
      });
    });
  });
});

// Unfollow user
router.delete('/follow/:userId', authenticateToken, (req, res) => {
  const currentUserId = req.user.userId;
  const targetUserId = req.params.userId;

  const deleteQuery = 'DELETE FROM followers WHERE follower_id = $1 AND following_id = $2';

  db.run(deleteQuery, [currentUserId, targetUserId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Decrement followers_count
    db.run(
      'UPDATE users SET followers_count = followers_count - 1 WHERE id = $1 AND followers_count > 0',
      [targetUserId],
      (err) => { if (err) console.error('Error updating followers_count:', err); }
    );

    res.json({ message: 'Unfollowed successfully' });
  });
});

// Check if following user
router.get('/follow/status/:userId', authenticateToken, (req, res) => {
  const currentUserId = req.user.userId;
  const targetUserId = req.params.userId;

  const checkQuery = 'SELECT id FROM followers WHERE follower_id = $1 AND following_id = $2';

  db.get(checkQuery, [currentUserId, targetUserId], (err, follow) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ following: !!follow });
  });
});

// Get user's followers
router.get('/users/:userId/followers', authenticateToken, (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT u.id, u.name, u.username, u.avatar, u.verified, u.followers_count, f.created_at
    FROM followers f
    JOIN users u ON f.follower_id = u.id
    WHERE f.following_id = $1
    ORDER BY f.created_at DESC
    LIMIT 50
  `;

  db.all(query, [userId], (err, followers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const formatted = followers.map(f => ({
      id: f.id.toString(),
      name: f.name,
      username: f.username,
      avatar: f.avatar,
      verified: f.verified === 1,
      followers_count: f.followers_count,
      followedAt: f.created_at
    }));

    res.json({ followers: formatted, total: formatted.length });
  });
});

// Get user's following (who they follow)
router.get('/users/:userId/following', authenticateToken, (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT u.id, u.name, u.username, u.avatar, u.verified, u.followers_count, f.created_at
    FROM followers f
    JOIN users u ON f.following_id = u.id
    WHERE f.follower_id = $1
    ORDER BY f.created_at DESC
    LIMIT 50
  `;

  db.all(query, [userId], (err, following) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const formatted = following.map(f => ({
      id: f.id.toString(),
      name: f.name,
      username: f.username,
      avatar: f.avatar,
      verified: f.verified === 1,
      followers_count: f.followers_count,
      followedAt: f.created_at
    }));

    res.json({ following: formatted, total: formatted.length });
  });
});

// ==================== USER PROFILE ====================

// Get user profile by ID (updated with new fields)
router.get('/users/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT id, name, username, bio, city, website, pinned_post_id,
           avatar, banner, verified, followers_count, join_date, created_at
    FROM users
    WHERE id = $1
  `;

  db.get(query, [parseInt(userId)], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get following count
  const followingQuery = 'SELECT COUNT(*) as count FROM followers WHERE follower_id = $1';
    db.get(followingQuery, [parseInt(userId)], (err, followingResult) => {
      const followingCount = followingResult ? followingResult.count : 0;

      res.json({
        user: {
          id: user.id.toString(),
          name: user.name,
          username: user.username,
          bio: user.bio,
          city: user.city,
          website: user.website,
          pinned_post_id: user.pinned_post_id ? user.pinned_post_id.toString() : null,
          avatar: user.avatar,
          banner: user.banner,
          verified: user.verified === 1,
          followers_count: user.followers_count || 0,
          following_count: followingCount,
          joinDate: user.join_date
        }
      });
    });
  });
});

// Update current user profile (PATCH with bio, city, website)
router.patch('/users/me', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { bio, city, website } = req.body;

  // Validate city
  if (city !== undefined) {
    if (city && city.length > 64) {
      return res.status(400).json({ error: 'City must be less than 64 characters' });
    }
  }

  // Validate and normalize website
  let normalizedWebsite = website;
  if (website !== undefined) {
    if (website) {
      const trimmed = website.trim();
      // Check protocol
      let url = trimmed;
      if (!url.match(/^https?:\/\//i)) {
        url = `https://${url}`;
      }
      
      // Validate protocol is http or https only
      const urlPattern = /^https?:\/\/[^\s]+$/i;
      if (!urlPattern.test(url)) {
        return res.status(400).json({ error: 'Website must be a valid http or https URL' });
      }
      
      normalizedWebsite = url;
    }
  }

  const updates = [];
  const values = [];

  if (bio !== undefined) {
    updates.push(`bio = $${updates.length + 1}`);
    values.push(bio);
  }
  if (city !== undefined) {
    updates.push(`city = $${updates.length + 1}`);
    values.push(city ? city.trim() : null);
  }
  if (normalizedWebsite !== undefined) {
    updates.push(`website = $${updates.length + 1}`);
    values.push(normalizedWebsite);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(userId);

  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${updates.length + 1}`;

  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ message: 'Profile updated successfully' });
  });
});

// ==================== PINNED POST ====================

// Pin a post
router.post('/users/me/pin/:postId', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.postId;

  // Check if post exists and belongs to user (or is a repost by user)
  const checkQuery = `
    SELECT id, user_id FROM posts WHERE id = $1 AND user_id = $2
  `;

  db.get(checkQuery, [postId, userId], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!post) {
      return res.status(404).json({ error: 'Post not found or not your post' });
    }

    // Pin the post
  const updateQuery = 'UPDATE users SET pinned_post_id = $1 WHERE id = $2';

    db.run(updateQuery, [postId, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: 'Post pinned successfully', pinned_post_id: postId });
    });
  });
});

// Unpin post
router.delete('/users/me/pin', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const updateQuery = 'UPDATE users SET pinned_post_id = NULL WHERE id = $1';

  db.run(updateQuery, [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ message: 'Post unpinned successfully' });
  });
});

// ==================== UPLOADS ====================

// Upload file (image or document)
router.post('/uploads', authenticateToken, fileUpload.single('file'), uploadFile);

// ==================== MOMENTS (ONE-TIME PHOTO) ====================

router.post('/moments', authenticateToken, momentUpload.single('file'), asyncHandler(async (req, res) => {
  const senderId = req.user.userId;
  const { chatId, ttlSeconds = 86400 } = req.body;

  if (!chatId) {
    throw new ValidationError('chatId is required');
  }

  const membership = await new Promise((resolve) => {
    db.get(
      'SELECT role, c.type FROM chat_members cm JOIN chats c ON c.id = cm.chat_id WHERE cm.chat_id = $1 AND cm.user_id = $2',
      [chatId, senderId],
      (err, row) => {
        if (err) return resolve(null);
        resolve(row || null);
      }
    );
  });

  if (!membership) {
    throw new ValidationError('Access denied');
  }

  if (membership.type === 'channel' && !['owner', 'admin'].includes(membership.role)) {
    throw new ValidationError('Only admins can write to channel');
  }

  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const mime = req.file.mimetype || '';
  if (!mime.startsWith('image/')) {
    throw new ValidationError('Only image files are allowed for moments');
  }

  const filename = req.file.filename;
  const filePath = req.file.path;
  const size = req.file.size;

  let width = null;
  let height = null;
  try {
    const sizeOf = require('image-size');
    const dimensions = sizeOf(filePath);
    width = dimensions.width || null;
    height = dimensions.height || null;
  } catch (e) {
    // ignore
  }

  let thumbDataUrl = null;
  try {
    const sharp = require('sharp');
    const thumbBuffer = await sharp(filePath)
      .resize(32, 32, { fit: 'inside' })
      .blur(12)
      .toBuffer();
    thumbDataUrl = `data:image/jpeg;base64,${thumbBuffer.toString('base64')}`;
  } catch (e) {
    // ignore
  }

  const ttlValue = Number.isFinite(Number(ttlSeconds)) ? Math.max(60, Math.min(7 * 24 * 3600, Number(ttlSeconds))) : 86400;

  const expiresAt = new Date(Date.now() + ttlValue * 1000).toISOString();

  const momentId = await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO moments (sender_id, receiver_id, file_path, mime, size, width, height, thumb_data_url, ttl_seconds, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
      ,
      [senderId, chatId, filePath, mime, size, width, height, thumbDataUrl, ttlValue, expiresAt],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });

  // Insert message referencing moment
  const messageId = await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO messages (chat_id, sender_id, text, type, moment_id)
       VALUES ($1, $2, $3, $4, $5)`
      ,
      [chatId, senderId, 'Исчезающее фото', 'moment_image', momentId],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });

  const sendChatMessage = req.app.get('sendChatMessage');
  if (sendChatMessage) {
    sendChatMessage({
      id: messageId,
      chatId: String(chatId),
      senderId: senderId.toString(),
      text: 'Исчезающее фото',
      timestamp: new Date().toISOString(),
      type: 'moment_image',
      moment: {
        id: momentId.toString(),
        thumbDataUrl: thumbDataUrl,
        ttlSeconds: ttlValue,
        expiresAt,
        viewedBy: []
      }
    });
  }

  res.json({ messageId, momentId, thumbDataUrl, ttlSeconds: ttlValue, expiresAt });
}));

router.post('/moments/:id/open', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const momentId = parseInt(req.params.id);

  const moment = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM moments WHERE id = $1', [momentId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!moment) {
    throw new ValidationError('Moment not found');
  }

  if (moment.revoked_at) {
    return res.status(410).json({ error: 'Moment revoked' });
  }

  if (moment.expires_at && new Date(moment.expires_at).getTime() < Date.now()) {
    return res.status(410).json({ error: 'Moment expired' });
  }

  if (!moment.receiver_id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const memberRow = await new Promise((resolve) => {
    db.get('SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2', [moment.receiver_id, userId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (!memberRow) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const viewed = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM moment_views WHERE moment_id = $1 AND user_id = $2', [momentId, userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (viewed) {
    return res.status(410).json({ error: 'Moment already viewed' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();

  await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO moment_tokens (moment_id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [momentId, userId, token, expiresAt],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  res.json({ token, expiresAt });
}));

router.get('/moments/:id/content', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const momentId = parseInt(req.params.id);
  const token = String(req.query.token || '');

  if (!token) {
    return res.status(403).json({ error: 'Token required' });
  }

  const tokenRow = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM moment_tokens WHERE token = $1 AND moment_id = $2 AND user_id = $3', [token, momentId, userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!tokenRow) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  if (tokenRow.used_at) {
    return res.status(410).json({ error: 'Token already used' });
  }

  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    return res.status(403).json({ error: 'Token expired' });
  }

  const moment = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM moments WHERE id = $1', [momentId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!moment) {
    return res.status(404).json({ error: 'Moment not found' });
  }

  if (moment.revoked_at) {
    return res.status(410).json({ error: 'Moment revoked' });
  }

  if (!moment.receiver_id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const memberRow = await new Promise((resolve) => {
    db.get('SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2', [moment.receiver_id, userId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (!memberRow) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (moment.expires_at && new Date(moment.expires_at).getTime() < Date.now()) {
    return res.status(410).json({ error: 'Moment expired' });
  }

  await new Promise((resolve, reject) => {
    db.run('UPDATE moment_tokens SET used_at = NOW() WHERE id = $1', [tokenRow.id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await new Promise((resolve, reject) => {
    db.run('INSERT INTO moment_views (moment_id, user_id) VALUES ($1, $2) ON CONFLICT (moment_id, user_id) DO NOTHING', [momentId, userId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  res.setHeader('Content-Type', moment.mime || 'image/jpeg');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Disposition', 'inline');

  const stream = fs.createReadStream(moment.file_path);
  stream.on('error', () => res.status(500).end());
  stream.pipe(res);
}));

router.post('/moments/:id/viewed', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const momentId = parseInt(req.params.id);

  const moment = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM moments WHERE id = $1', [momentId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!moment) {
    return res.status(404).json({ error: 'Moment not found' });
  }

  if (!moment.receiver_id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const memberRow = await new Promise((resolve) => {
    db.get('SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2', [moment.receiver_id, userId], (err, row) => {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });

  if (!memberRow) {
    return res.status(403).json({ error: 'Access denied' });
  }

  await new Promise((resolve, reject) => {
    db.run('INSERT INTO moment_views (moment_id, user_id) VALUES ($1, $2) ON CONFLICT (moment_id, user_id) DO NOTHING', [momentId, userId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  res.json({ ok: true });
}));

// Get attachment by ID
router.get('/attachments/:attachmentId', authenticateToken, (req, res) => {
  const attachmentId = req.params.attachmentId;

  db.get('SELECT * FROM attachments WHERE id = $1', [attachmentId], (err, attachment) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.json({
      attachment: {
        id: attachment.id.toString(),
        messageId: attachment.message_id ? attachment.message_id.toString() : null,
        type: attachment.type,
        url: attachment.url,
        mime: attachment.mime,
        size: attachment.size,
        width: attachment.width,
        height: attachment.height,
        createdAt: attachment.created_at
      }
    });
  });
});

// ==================== MESSENGER ====================

// Get user presence (online/offline + last_seen)
router.get('/users/:userId/presence', authenticateToken, (req, res) => {
  const userId = req.params.userId;

  db.get('SELECT last_seen_at FROM users WHERE id = $1', [parseInt(userId)], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is online via onlineUsers map
    const onlineUsers = req.app.get('onlineUsers');
    const isOnline = onlineUsers && onlineUsers.has(parseInt(userId));

    res.json({
      userId: userId.toString(),
      online: isOnline,
      lastSeenAt: user.last_seen_at
    });
  });
});

// Mark messages as read in a chat (REST alternative to WS)
router.post('/chats/:chatId/read', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const chatId = req.params.chatId;
  const { lastReadMessageId } = req.body;

  if (!lastReadMessageId) {
    return res.status(400).json({ error: 'lastReadMessageId is required' });
  }

  db.get('SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2', [chatId, userId], (memberErr, memberRow) => {
    if (memberErr) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!memberRow) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.run(
      `INSERT INTO chat_reads (chat_id, user_id, last_read_message_id, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT(chat_id, user_id)
       DO UPDATE SET last_read_message_id = $4, updated_at = NOW()`,
      [chatId, userId, lastReadMessageId, lastReadMessageId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

  const broadcastToChat = req.app.get('broadcastToChat');
  if (broadcastToChat) {
    broadcastToChat(chatId, {
      type: 'chat:read_update',
      data: {
        chatId: chatId.toString(),
        userId: userId.toString(),
        lastReadMessageId: lastReadMessageId.toString()
      }
    });
  }

        res.json({
          message: 'Chat marked as read',
          chatId: chatId.toString(),
          lastReadMessageId: lastReadMessageId.toString()
        });
      }
    );
  });
});

// Get chat read status for all participants
router.get('/chats/:chatId/read-status', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const chatId = req.params.chatId;

  db.get('SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2', [chatId, userId], (memberErr, memberRow) => {
    if (memberErr) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!memberRow) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `
      SELECT cr.user_id, cr.last_read_message_id, cr.updated_at, u.name, u.username
      FROM chat_reads cr
      JOIN users u ON cr.user_id = u.id
      WHERE cr.chat_id = $1
    `;

    db.all(query, [chatId], (err, readStatuses) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formatted = readStatuses.map(status => ({
        userId: status.user_id.toString(),
        name: status.name,
        username: status.username,
        lastReadMessageId: status.last_read_message_id ? status.last_read_message_id.toString() : null,
        updatedAt: status.updated_at
      }));

      res.json({ chatId: chatId.toString(), readStatuses: formatted });
    });
  });
});

// ==================== MESSAGE DELETION ====================

// Delete message (for me or for all)
router.delete('/messages/:messageId', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const messageId = req.params.messageId;
  const { scope } = req.query; // 'me' or 'all'

  // Get the message
  db.get('SELECT * FROM messages WHERE id = $1', [messageId], (err, message) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const isAuthor = String(message.sender_id) === String(userId);
    if (!isAuthor) {
      return res.status(403).json({ error: 'You can only delete messages you sent' });
    }

    if (scope === 'all') {
      // Only author can delete for all
      if (!isAuthor) {
        return res.status(403).json({ error: 'Only the sender can delete a message for everyone' });
      }

      // Mark as deleted for all
      db.run(
        'UPDATE messages SET deleted_for_all_at = NOW(), deleted_for_all_by = $1 WHERE id = $2',
        [userId, messageId],
        function(err) {
          if (err) {
            console.error('[messages] delete-for-all error:', { err, messageId, userId });
            return res.status(500).json({ error: 'Database error' });
          }

          // Notify via WebSocket
          const sendChatMessage = req.app.get('sendChatMessage');
          if (sendChatMessage) {
            sendChatMessage({
              chatId: message.chat_id ? String(message.chat_id) : null,
              type: 'message:deleted',
              data: {
                messageId: messageId.toString(),
                scope: 'all',
                byUserId: userId.toString()
              }
            });
          }

          res.json({ 
            message: 'Message deleted for everyone',
            messageId: messageId.toString(),
            scope: 'all'
          });
        }
      );
    } else {
      // Delete for me (default)
      db.get(
        'SELECT * FROM message_deletions WHERE message_id = $1 AND user_id = $2',
        [messageId, userId],
        (err, deletion) => {
          if (err) {
            console.error('[messages] delete-for-me select error:', { err, messageId, userId });
            return res.status(500).json({ error: 'Database error' });
          }

          if (deletion) {
            return res.status(400).json({ error: 'Already deleted for you' });
          }

          db.run(
            'INSERT INTO message_deletions (message_id, user_id) VALUES ($1, $2)',
            [messageId, userId],
            function(err) {
              if (err) {
                console.error('[messages] delete-for-me insert error:', { err, messageId, userId });
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                message: 'Message deleted for you',
                messageId: messageId.toString(),
                scope: 'me'
              });
            }
          );
        }
      );
    }
  });
});

// Servers module removed

// Link Preview (Open Graph)
router.post('/link-preview', asyncHandler(async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    throw new ValidationError('URL is required');
  }

  const { getLinkPreview } = require('./linkPreview');
  const result = await getLinkPreview(url);

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch link preview');
  }

  res.json(result.data);
}));

// ========== NOTIFICATIONS ==========

// Get user notifications
router.get('/notifications', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { limit = 50, unreadOnly = false } = req.query;

  const safeLimit = Math.min(parseInt(limit, 10) || 20, 50);
  const offset = Math.max(parseInt(req.query.offset || '0', 10) || 0, 0);
  const query = unreadOnly === 'true'
    ? `SELECT n.*, COALESCE(u.username, n.actor_username) as actor_username, COALESCE(u.avatar, n.actor_avatar) as actor_avatar
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = $1 AND n.read = 0
       ORDER BY n.created_at DESC LIMIT $2 OFFSET $3`
    : `SELECT n.*, COALESCE(u.username, n.actor_username) as actor_username, COALESCE(u.avatar, n.actor_avatar) as actor_avatar
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC LIMIT $2 OFFSET $3`;

  const params = [userId, safeLimit, offset];

  const notifications = await new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const formattedNotifications = notifications.map(notification => ({
    id: notification.id.toString(),
    type: notification.type,
    actor_id: notification.actor_id ? notification.actor_id.toString() : null,
    actor_username: notification.actor_username,
    actor_avatar: notification.actor_avatar,
    target_id: notification.target_id ? notification.target_id.toString() : null,
    target_type: notification.target_type,
    message: notification.message,
    created_at: notification.created_at,
    read: notification.read === 1,
    url: notification.url,
  }));

  res.json({ notifications: formattedNotifications, limit: safeLimit, offset });
}));

// Mark notification as read
router.post('/notifications/read', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { notificationId, markAllAsRead = false } = req.body;

  if (markAllAsRead) {
    // Mark all notifications as read for this user
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE notifications SET read = 1 WHERE user_id = $1 AND read = 0',
        [userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({ message: 'All notifications marked as read' });
  } else {
    if (!notificationId) {
      throw new ValidationError('Notification ID is required');
    }

    // Mark specific notification as read
    const result = await new Promise((resolve, reject) => {
      db.run(
        'UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2',
        [notificationId, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    if (result.changes === 0) {
      throw new ValidationError('Notification not found or already read');
    }

    res.json({ message: 'Notification marked as read' });
  }
}));

// Mark notification as read (new endpoint)
router.post('/notifications/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const notificationId = req.params.id;

  const result = await new Promise((resolve, reject) => {
    db.run(
      'UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2',
      [notificationId, userId],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  if (result.changes === 0) {
    throw new ValidationError('Notification not found or already read');
  }

  res.json({ message: 'Notification marked as read' });
}));

module.exports = router;
module.exports.ensureStickerData = ensureStickerData;




