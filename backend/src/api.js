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

const stickerFileCache = new Map();
const STICKER_CACHE_MAX = 200;

const normalizeStickerFileName = (value) => String(value || '')
  .trim()
  .replace(/\s+/g, '_')
  .replace(/[^a-zA-Z0-9_-]/g, '_')
  .toLowerCase();

const buildStickerKey = (packName, stickerName) => `${normalizeStickerFileName(packName)}_${normalizeStickerFileName(stickerName)}`;

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
  await runStatement('CREATE INDEX IF NOT EXISTS idx_user_sticker_packs_user_id ON user_sticker_packs(user_id)');
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
        db.run(
          'INSERT INTO sticker_packs (name, description, author) VALUES ($1, $2, $3)',
          [packName, `Sticker pack ${packName}`, 'LUME'],
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
  // Пропускаем servers
  if (req.path.includes('/servers')) {
    return next();
  }
  verifyCSRFToken(req, res, next);
});
router.delete('*', (req, res, next) => {
  // Пропускаем servers
  if (req.path.includes('/servers')) {
    return next();
  }
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
      'DELETE FROM chats WHERE user1_id = $1 OR user2_id = $2',
      'DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $2',
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
      const params = query.includes('follower_id = $1 OR following_id') || 
                     query.includes('user1_id = $1 OR user2_id') ||
                     query.includes('sender_id = $1 OR receiver_id')
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
router.get('/users', authenticateToken, (req, res) => {
  const { q } = req.query;

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
});

// Get messages for a user (chat list)
router.get('/messages', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `
     SELECT c.id, c.last_message, c.last_message_time, c.unread_count,
            CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END AS contact_id,
            u.name, u.username, u.avatar, u.verified
     FROM chats c
     JOIN users u ON u.id = (CASE WHEN c.user1_id = $2 THEN c.user2_id ELSE c.user1_id END)
     WHERE c.user1_id = $3 OR c.user2_id = $4
    ORDER BY c.last_message_time DESC
  `;

  db.all(query, [userId, userId, userId, userId], (err, chats) => {
    if (err) {
      console.error('Database error getting chats:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const chatList = chats.map(chat => ({
      id: chat.id.toString(),
      userId: String(chat.contact_id),
      name: chat.name,
      username: chat.username,
      avatar: chat.avatar,
      verified: chat.verified === 1,
      lastMessage: chat.last_message || '',
      timestamp: chat.last_message_time,
      unread: chat.unread_count || 0
    }));

  res.json({ chats: chatList });
  });
});

// ==================== Stickers ====================

router.get('/stickers/packs', authenticateToken, asyncHandler(async (_req, res) => {
  await ensureStickerData();

  db.all(
    `SELECT sp.id, sp.name, sp.description, sp.author, sp.created_at,
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

  db.get('SELECT id, name, description, author, created_at FROM sticker_packs WHERE id = $1', [packId], (err, pack) => {
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
    `SELECT sp.id, sp.name, sp.description, sp.author, sp.created_at,
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
        description: pack.description,
        author: pack.author,
        createdAt: pack.created_at,
        stickerCount: Number(pack.sticker_count || 0),
      }));
      res.json({ packs: formatted });
    }
  );
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
    res.setHeader('Cache-Control', 'private, max-age=3600');
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
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:");
      return res.end(buffer);
    });
  });
}));


// Get messages with a specific user
router.get('/messages/:userId(\\d+)', authenticateToken, (req, res) => {
  const currentUserId = req.user.userId;
  const otherUserId = req.params.userId;

  const chatQuery = `
    SELECT id FROM chats
    WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $3 AND user2_id = $4)
  `;

  db.get(chatQuery, [currentUserId, otherUserId, otherUserId, currentUserId], (err, chat) => {
    if (err) {
      console.error('[messages] chatQuery error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    getMessageHistory(currentUserId, otherUserId, res);
  });

  function getMessageHistory(userId1, userId2, res) {
    const messageQuery = `
      SELECT m.*, u.name, u.username, u.avatar, u.verified,
             (SELECT COUNT(*) FROM message_deletions WHERE message_id = m.id) as deleted_count,
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
       WHERE (m.sender_id = $3 AND m.receiver_id = $4) OR (m.sender_id = $5 AND m.receiver_id = $6)
        AND m.deleted_for_all_at IS NULL
      ORDER BY m.created_at ASC
    `;

    db.all(messageQuery, [currentUserId, currentUserId, userId1, userId2, userId2, userId1], (err, messages) => {
      if (err) {
        console.error('[messages] messageQuery error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Get attachments for all messages
      const messageIds = messages.map(m => m.id);
      let attachmentsByMessage = {};

      if (messageIds.length > 0) {
        const placeholders = messageIds.map((_, idx) => `$${idx + 1}`).join(',');
        db.all(
          `SELECT * FROM attachments WHERE message_id IN (${placeholders})`,
          messageIds,
          (err, attachments) => {
            if (err) console.error('Error getting attachments:', err);
            
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
              senderId: msg.sender_id === userId1 ? 'self' : msg.sender_id.toString(),
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
              own: msg.sender_id === userId1,
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
  }
});

// Send a message with WebSocket notification
router.post('/messages', authenticateToken, asyncHandler(async (req, res) => {
  const senderId = req.user.userId;
  const { receiverId, text, attachmentIds, replyToMessageId, stickerId } = req.body;

  if (!receiverId) {
    return res.status(400).json({ error: 'Receiver ID is required' });
  }

  const messageText = text || '';
  
  // Validate attachmentIds if provided
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
  let stickerType = 'text';
  let stickerText = messageText;

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
    stickerType = 'sticker';
    stickerText = messageText || '[sticker]';
  }

  const insertMessageQuery = `
    INSERT INTO messages (sender_id, receiver_id, text, type, reply_to_message_id, link_preview, sticker_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;

  db.serialize(() => {
    db.run('BEGIN', (beginErr) => {
      if (beginErr) {
        return res.status(500).json({ error: 'Database error' });
      }

      db.run(
        insertMessageQuery,
        [senderId, receiverId, stickerText, stickerType, replyToMessageId || null, linkPreview ? JSON.stringify(linkPreview) : null, sticker ? sticker.id : null],
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
               db.get(senderQuery, [senderId], (err, sender) => {
                if (err) console.error('Error getting sender:', err);

                let attachmentsData = [];
                if (attachments.length > 0) {
                  db.all(
                    'SELECT * FROM attachments WHERE message_id = $1',
                    [messageId],
                    (err, atts) => {
                      if (err) console.error('Error getting attachments:', err);
                      attachmentsData = atts || [];
                      continueWithMessage(messageId, messageText, sender, attachmentsData);
                    }
                  );
                } else {
                  continueWithMessage(messageId, messageText, sender, []);
                }

                function continueWithMessage(msgId, msgText, senderData, atts) {
                  const getChatQuery = `
                    SELECT id FROM chats
                    WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $3 AND user2_id = $4)
                  `;

                  db.get(getChatQuery, [senderId, receiverId, receiverId, senderId], (err, existingChat) => {
                    if (err) {
                      console.error('Error getting chat:', err);
                      return res.json({ message: 'Message sent successfully', messageId });
                    }

                    let chatId = existingChat ? existingChat.id : null;

                  const chatMessage = stickerType === 'sticker'
                    ? `Стикер ${sticker?.name || ''}`.trim()
                    : atts.length > 0
                      ? `[${atts.length} вложение(ий)] ${msgText.substring(0, 50)}`
                      : msgText;

                    const updateOrCreateQuery = chatId
                      ? `UPDATE chats SET last_message = $1, last_message_time = NOW(), unread_count = unread_count + 1 WHERE id = $2`
                      : `INSERT INTO chats (user1_id, user2_id, last_message, last_message_time, unread_count) VALUES ($1, $2, $3, NOW(), 1)`;

                    const params = chatId ? [chatMessage, chatId] : [senderId, receiverId, chatMessage];

                    db.run(updateOrCreateQuery, params, function(err) {
                      if (err) {
                        console.error('Error updating chat:', err);
                      }

                      if (!chatId && this?.lastID) {
                        chatId = this.lastID;
                      }

                      const formattedAttachments = atts.map(att => ({
                        id: att.id.toString(),
                        type: att.type,
                        url: att.url,
                        mime: att.mime,
                        size: att.size,
                        width: att.width,
                        height: att.height
                      }));

                       const sendToUser = req.app.get('sendToUser');
                       const createNotification = req.app.get('createNotification');
                       const receiverQuery = 'SELECT name, username, avatar FROM users WHERE id = $1';

                      if (sendToUser) {
                        sendToUser(receiverId, {
                          type: 'new_message',
                          data: {
                            id: msgId,
                            senderId: senderId.toString(),
                            receiverId: receiverId.toString(),
                            text: msgText,
                            type: stickerType,
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
                          }
                        });
                      }

                      if (createNotification) {
                        const actorName = senderData?.name || senderData?.username || 'Someone';
                        createNotification({
                          userId: receiverId,
                          type: 'message',
                          actorId: senderId,
                          actorUsername: senderData?.username || null,
                          actorAvatar: senderData?.avatar || null,
                          targetId: senderId,
                          targetType: 'user',
                          message: `${actorName} отправил вам сообщение`,
                          url: `/messages/${senderId}`,
                        }).catch(err => {
                          console.error('[API] Error creating notification:', err);
                        });
                      }

                      res.json({
                        message: 'Message sent successfully',
                        messageId: msgId,
                        attachments: formattedAttachments,
                        replyToMessageId: replyToMessageId ? replyToMessageId.toString() : null,
                        linkPreview,
                        sticker,
                        type: stickerType,
                      });

                      indexMessage({
                        id: msgId,
                        chatId: chatId,
                        serverId: null,
                        userId: senderId,
                        text: msgText,
                        timestamp: new Date().toISOString(),
                      }).catch(err => {
                        console.error('[Meilisearch] Indexation error:', err);
                      });

                      createMentionNotifications(msgText, senderId, {
                        actorId: senderId,
                        actorUsername: senderData?.username || null,
                        actorAvatar: senderData?.avatar || null,
                        targetId: msgId,
                        targetType: 'message',
                        message: null,
                        url: `/messages/${senderId}?message=${msgId}`,
                      }, req);
                    });
                  });
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
  const { receiverId, duration, replyToMessageId } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required' });
  }

  if (!receiverId) {
    return res.status(400).json({ error: 'Receiver ID is required' });
  }

  const audioDuration = parseFloat(duration) || 0;

  let attachment = null;

  // Создаем сообщение
  const messageText = `\u0413\u043e\u043b\u043e\u0441\u043e\u0432\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 (${Math.floor(audioDuration)}\u0441)`;
  
  const insertMessageQuery = `
    INSERT INTO messages (sender_id, receiver_id, text, type, reply_to_message_id)
    VALUES ($1, $2, $3, 'voice', $4)
  `;

  const messageId = await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN', (beginErr) => {
        if (beginErr) return reject(beginErr);
        db.run(
          insertMessageQuery,
          [senderId, receiverId, messageText, replyToMessageId || null],
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
  const chatId = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM chats WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $3 AND user2_id = $4)',
      [senderId, receiverId, receiverId, senderId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.id : null);
      }
    );
  });

  if (chatId) {
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE chats SET last_message = $1, last_message_time = NOW(), unread_count = unread_count + 1 WHERE id = $2',
        [messageText, chatId],
        (err) => (err ? reject(err) : resolve())
      );
    });
  } else {
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO chats (user1_id, user2_id, last_message, last_message_time, unread_count) VALUES ($1, $2, $3, NOW(), 1)',
        [senderId, receiverId, messageText],
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  // Отправляем WebSocket уведомление
  const sendToUser = req.app.get('sendToUser');
  const createNotification = req.app.get('createNotification');

  if (sendToUser) {
    sendToUser(receiverId, {
      type: 'new_message',
      data: {
        id: messageId.toString(),
        senderId: senderId.toString(),
        receiverId: receiverId.toString(),
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
      }
    });
  }

  // Создаем уведомление для получателя
  if (createNotification) {
    const actorName = sender?.name || sender?.username || 'Someone';
    const chatQuery = `
      SELECT id FROM chats
      WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $3 AND user2_id = $4)
      ORDER BY id DESC
      LIMIT 1
    `;
    db.get(chatQuery, [senderId, receiverId, receiverId, senderId], (err, chat) => {
      const chatId = chat?.id;
      createNotification({
        userId: receiverId,
        type: 'message',
        actorId: senderId,
        actorUsername: sender?.username || null,
        actorAvatar: sender?.avatar || null,
        targetId: chatId || null,
        targetType: 'chat',
        message: `${actorName} отправил вам сообщение`,
        url: chatId ? `/messages/${chatId}` : '/messages',
      }).catch(err => {
        console.error('[API] Error creating notification:', err);
      });
    });
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
    SELECT c.id, c.user1_id, c.user2_id
    FROM chats c
    WHERE c.user1_id = $1 OR c.user2_id = $2
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
              c.id as chat_id,
              uc.id as contact_id,
              uc.name as contact_name,
              uc.username as contact_username,
              uc.avatar as contact_avatar,
              uc.verified as contact_verified
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       JOIN chats c ON (m.sender_id = c.user1_id AND m.receiver_id = c.user2_id)
                  OR (m.sender_id = c.user2_id AND m.receiver_id = c.user1_id)
       JOIN users uc ON uc.id = CASE
         WHEN c.user1_id = m.sender_id THEN c.user2_id
         ELSE c.user1_id
       END
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
    contact: row.contact_id ? {
      id: String(row.contact_id),
      name: row.contact_name,
      username: row.contact_username,
      avatar: row.contact_avatar,
      verified: row.contact_verified === 1,
    } : null,
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
    const hoursDiff = Math.floor(timeDiff / (1000 * 3600));

    if (hoursDiff < 2) {
      return res.status(400).json({ error: 'You must be registered for at least 2 hours to request verification' });
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
  const { receiverId, ttlSeconds = 86400 } = req.body;

  if (!receiverId) {
    throw new ValidationError('Receiver ID is required');
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
      [senderId, receiverId, filePath, mime, size, width, height, thumbDataUrl, ttlValue, expiresAt],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });

  // Insert message referencing moment
  const messageId = await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO messages (sender_id, receiver_id, text, type, moment_id)
       VALUES ($1, $2, $3, $4, $5)`
      ,
      [senderId, receiverId, 'Исчезающее фото', 'moment_image', momentId],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });

  // Update chats last message
  const getChatQuery = `
    SELECT id FROM chats
    WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $3 AND user2_id = $4)
  `;
  db.get(getChatQuery, [senderId, receiverId, receiverId, senderId], (err, existingChat) => {
    if (err) {
      return res.json({ messageId, momentId });
    }

    const chatMessage = 'Исчезающее фото';
    const updateOrCreateQuery = existingChat
      ? `UPDATE chats SET last_message = $1, last_message_time = NOW(), unread_count = unread_count + 1 WHERE id = $2`
      : `INSERT INTO chats (user1_id, user2_id, last_message, last_message_time, unread_count) VALUES ($1, $2, $3, NOW(), 1)`;
    const params = existingChat ? [chatMessage, existingChat.id] : [senderId, receiverId, chatMessage];
    db.run(updateOrCreateQuery, params, () => {
      const sendToUser = req.app.get('sendToUser');
      if (sendToUser) {
        sendToUser(receiverId, {
          type: 'new_message',
          data: {
            id: messageId,
            senderId: senderId.toString(),
            receiverId: receiverId.toString(),
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
          }
        });
      }

      res.json({ messageId, momentId, thumbDataUrl, ttlSeconds: ttlValue, expiresAt });
    });
  });
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

  if (String(moment.receiver_id) !== String(userId)) {
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

  if (String(moment.receiver_id) !== String(userId)) {
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

  if (String(moment.receiver_id) !== String(userId)) {
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

  // Upsert chat_reads record
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

      // Broadcast read update to other chat participants via WebSocket
      const sendToUser = req.app.get('sendToUser');
      if (sendToUser) {
        // Get other participants in the chat
        db.get('SELECT user1_id, user2_id FROM chats WHERE id = $1', [chatId], (err, chat) => {
          if (err || !chat) return;
          
          const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
          
          // Send read update to the other user
          sendToUser(otherUserId, {
            type: 'chat:read_update',
            data: {
              chatId: chatId.toString(),
              userId: userId.toString(),
              lastReadMessageId: lastReadMessageId.toString()
            }
          });
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

// Get chat read status for all participants
router.get('/chats/:chatId/read-status', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const chatId = req.params.chatId;

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
      lastReadMessageId: status.last_read_message_id.toString(),
      updatedAt: status.updated_at
    }));

    res.json({ chatId: chatId.toString(), readStatuses: formatted });
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
    const isReceiver = String(message.receiver_id) === String(userId);

    if (!isAuthor && !isReceiver) {
      return res.status(403).json({ error: 'You can only delete messages you sent or received' });
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
          const sendToUser = req.app.get('sendToUser');
          if (sendToUser && message.receiver_id) {
            sendToUser(message.receiver_id, {
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
      // Check if already deleted for this user
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

          // Insert deletion record
          db.run(
            'INSERT INTO message_deletions (message_id, user_id) VALUES ($1, $2)',
            [messageId, userId],
            function(err) {
              if (err) {
                console.error('[messages] delete-for-me insert error:', { err, messageId, userId });
                return res.status(500).json({ error: 'Database error' });
              }

              // Notify via WebSocket
              const sendToUser = req.app.get('sendToUser');
              const otherUserId = isAuthor ? message.receiver_id : message.sender_id;
              
              if (sendToUser && otherUserId) {
                sendToUser(otherUserId, {
                  type: 'message:deleted',
                  data: { 
                    messageId: messageId.toString(), 
                    scope: 'me', 
                    byUserId: userId.toString() 
                  }
                });
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

// Servers (Communities) module routes
const serversRoutes = require('./servers');
router.use('/servers', serversRoutes);

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




