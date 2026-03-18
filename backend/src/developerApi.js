const express = require('express');
const crypto = require('crypto');
const db = require('./db');
const { asyncHandler, AuthError, ForbiddenError, ValidationError, NotFoundError, TooManyRequestsError } = require('./errors');
const { initRedis, getPubClient, isAvailable } = require('./redis');

const router = express.Router();

const RATE_LIMIT_WINDOW_SEC = 60;
const RATE_LIMIT_MAX = 100;
const API_KEY_PREFIX = 'lume_';

const hashSecret = (value) => crypto.createHash('sha256').update(value).digest('hex');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for']?.split(',')[0]?.trim();
  return forwarded || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || 'unknown';
};

const getRedisClient = () => {
  if (isAvailable()) {
    return getPubClient();
  }
  return null;
};

const checkRateLimit = async (key) => {
  const redisClient = getRedisClient();
  if (!redisClient) {
    return { allowed: true, remaining: RATE_LIMIT_MAX };
  }

  const now = Date.now();
  const windowStart = Math.floor(now / 1000 / RATE_LIMIT_WINDOW_SEC) * RATE_LIMIT_WINDOW_SEC;
  const redisKey = `devapi:rate:${key}:${windowStart}`;

  const count = await redisClient.incr(redisKey);
  if (count === 1) {
    await redisClient.expire(redisKey, RATE_LIMIT_WINDOW_SEC + 1);
  }

  if (count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX - count };
};

const authenticateDeveloperApi = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token || !token.startsWith(API_KEY_PREFIX)) {
    throw new AuthError('API key required', 'API_KEY_REQUIRED');
  }

  const apiKeyHash = hashSecret(token);
  const apiKeyRow = await new Promise((resolve, reject) => {
    db.get(
      `SELECT k.id, k.app_id, a.user_id, s.status
       FROM developer_api_keys k
       JOIN developer_apps a ON k.app_id = a.id
       LEFT JOIN developer_api_key_status s ON s.api_key_id = k.id
       WHERE k.api_key_hash = $1`,
      [apiKeyHash],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!apiKeyRow) {
    throw new AuthError('Invalid API key', 'INVALID_API_KEY');
  }

  if (apiKeyRow.status && apiKeyRow.status !== 'active') {
    throw new AuthError('API key inactive', 'API_KEY_INACTIVE');
  }

  const rateKey = `${apiKeyRow.app_id}`;
  const rateStatus = await checkRateLimit(rateKey);
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
  res.setHeader('X-RateLimit-Remaining', rateStatus.remaining);
  res.setHeader('X-RateLimit-Window', RATE_LIMIT_WINDOW_SEC);

  if (!rateStatus.allowed) {
    throw new TooManyRequestsError('Rate limit exceeded', RATE_LIMIT_WINDOW_SEC);
  }

  const ip = getClientIp(req);
  const endpoint = `${req.method} ${req.baseUrl}${req.path}`;

  db.run(
    `INSERT INTO developer_api_usage (app_id, endpoint, ip)
     VALUES ($1, $2, $3)`,
    [apiKeyRow.app_id, endpoint, ip],
    () => {}
  );

  res.on('finish', () => {
    db.run(
      `INSERT INTO developer_api_request_logs (app_id, api_key_id, endpoint, method, status_code, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [apiKeyRow.app_id, apiKeyRow.id, req.path, req.method, res.statusCode, ip],
      () => {}
    );
  });

  db.run(
    'UPDATE developer_api_keys SET last_used = NOW() WHERE id = $1',
    [apiKeyRow.id],
    () => {}
  );

  req.developerApi = {
    apiKeyId: apiKeyRow.id,
    appId: apiKeyRow.app_id,
    ownerId: apiKeyRow.user_id,
  };

  next();
});

const requireServerAccess = (paramName = 'id') => asyncHandler(async (req, res, next) => {
  const serverId = Number(req.params[paramName]);
  const ownerId = Number(req.developerApi?.ownerId);

  if (!Number.isFinite(serverId) || !Number.isFinite(ownerId)) {
    throw new ValidationError('Invalid server id');
  }

  const membership = await new Promise((resolve, reject) => {
    db.get(
      `SELECT sm.id
       FROM server_members sm
       WHERE sm.server_id = $1 AND sm.user_id = $2`,
      [serverId, ownerId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!membership) {
    throw new ForbiddenError('Access denied');
  }

  next();
});

const mapUserResponse = (row) => ({
  id: row.id.toString(),
  username: row.username,
  avatar: row.avatar,
  verified: row.verified === 1,
});

router.use(authenticateDeveloperApi);

router.get('/users/:id(\\d+)', asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    throw new ValidationError('Invalid user id');
  }

  const user = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id, username, avatar, verified FROM users WHERE id = $1',
      [userId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json(mapUserResponse(user));
}));

router.get('/users/:username', asyncHandler(async (req, res) => {
  const username = String(req.params.username || '').trim();
  if (!username) {
    throw new ValidationError('Username is required');
  }

  const user = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id, username, avatar, verified FROM users WHERE username = $1',
      [username],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json(mapUserResponse(user));
}));

router.get('/posts', asyncHandler(async (req, res) => {
  db.all(
    `SELECT p.id, p.user_id, p.text, p.image_url, p.timestamp,
            p.replies_count AS replies, p.reposts_count AS reposts, p.resonance_count AS resonance,
            u.username, u.avatar, u.verified
     FROM posts p
     JOIN users u ON p.user_id = u.id
     ORDER BY p.timestamp DESC
     LIMIT 50`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const posts = (rows || []).map((row) => ({
        id: row.id.toString(),
        userId: row.user_id.toString(),
        text: row.text,
        imageUrl: row.image_url,
        timestamp: row.timestamp,
        replies: row.replies,
        reposts: row.reposts,
        resonance: row.resonance,
        author: {
          username: row.username,
          avatar: row.avatar,
          verified: row.verified === 1,
        },
      }));
      res.json({ posts });
    }
  );
}));

router.get('/posts/:id', asyncHandler(async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isFinite(postId)) {
    throw new ValidationError('Invalid post id');
  }

  const post = await new Promise((resolve, reject) => {
    db.get(
      `SELECT p.id, p.user_id, p.text, p.image_url, p.timestamp,
              p.replies_count AS replies, p.reposts_count AS reposts, p.resonance_count AS resonance,
              u.username, u.avatar, u.verified
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [postId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  res.json({
    id: post.id.toString(),
    userId: post.user_id.toString(),
    text: post.text,
    imageUrl: post.image_url,
    timestamp: post.timestamp,
    replies: post.replies,
    reposts: post.reposts,
    resonance: post.resonance,
    author: {
      username: post.username,
      avatar: post.avatar,
      verified: post.verified === 1,
    },
  });
}));

router.get('/users/:id/posts', asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    throw new ValidationError('Invalid user id');
  }

  db.all(
    `SELECT p.id, p.user_id, p.text, p.image_url, p.timestamp,
            p.replies_count AS replies, p.reposts_count AS reposts, p.resonance_count AS resonance
     FROM posts p
     WHERE p.user_id = $1
     ORDER BY p.timestamp DESC
     LIMIT 50`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const posts = (rows || []).map((row) => ({
        id: row.id.toString(),
        userId: row.user_id.toString(),
        text: row.text,
        imageUrl: row.image_url,
        timestamp: row.timestamp,
        replies: row.replies,
        reposts: row.reposts,
        resonance: row.resonance,
      }));
      res.json({ posts });
    }
  );
}));

router.get('/servers', asyncHandler(async (req, res) => {
  db.all(
    `SELECT id, username, name, description, icon_url, type, owner_id, created_at
     FROM servers
     WHERE type = 'public'
     ORDER BY created_at DESC
     LIMIT 50`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const servers = (rows || []).map((row) => ({
        id: row.id.toString(),
        username: row.username,
        name: row.name,
        description: row.description,
        iconUrl: row.icon_url,
        type: row.type,
        ownerId: row.owner_id.toString(),
        createdAt: row.created_at,
      }));
      res.json({ servers });
    }
  );
}));

router.get('/servers/:id', asyncHandler(async (req, res) => {
  const serverId = Number(req.params.id);
  if (!Number.isFinite(serverId)) {
    throw new ValidationError('Invalid server id');
  }

  const server = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, username, name, description, icon_url, type, owner_id, created_at
       FROM servers
       WHERE id = $1`,
      [serverId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

  if (!server) {
    throw new NotFoundError('Server not found');
  }

  if (server.type !== 'public') {
    throw new ForbiddenError('Access denied');
  }

  res.json({
    id: server.id.toString(),
    username: server.username,
    name: server.name,
    description: server.description,
    iconUrl: server.icon_url,
    type: server.type,
    ownerId: server.owner_id.toString(),
    createdAt: server.created_at,
  });
}));

router.get('/servers/:id/members', requireServerAccess('id'), asyncHandler(async (req, res) => {
  const serverId = Number(req.params.id);
  if (!Number.isFinite(serverId)) {
    throw new ValidationError('Invalid server id');
  }

  db.all(
    `SELECT u.id, u.username, u.avatar, u.verified, sm.joined_at
     FROM server_members sm
     JOIN users u ON sm.user_id = u.id
     WHERE sm.server_id = $1
     ORDER BY sm.joined_at DESC
     LIMIT 100`,
    [serverId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const members = (rows || []).map((row) => ({
        id: row.id.toString(),
        username: row.username,
        avatar: row.avatar,
        verified: row.verified === 1,
        joinedAt: row.joined_at,
      }));
      res.json({ members });
    }
  );
}));

router.get('/feed/recommended', asyncHandler(async (req, res) => {
  db.all(
    `SELECT p.id, p.user_id, p.text, p.image_url, p.timestamp,
            p.replies_count AS replies, p.reposts_count AS reposts, p.resonance_count AS resonance,
            u.username, u.avatar, u.verified
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.timestamp >= NOW() - INTERVAL '14 days'
     ORDER BY (p.resonance_count * 2 + p.replies_count * 3 + p.reposts_count) DESC,
              p.timestamp DESC
     LIMIT 30`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const posts = (rows || []).map((row) => ({
        id: row.id.toString(),
        userId: row.user_id.toString(),
        text: row.text,
        imageUrl: row.image_url,
        timestamp: row.timestamp,
        replies: row.replies,
        reposts: row.reposts,
        resonance: row.resonance,
        author: {
          username: row.username,
          avatar: row.avatar,
          verified: row.verified === 1,
        },
      }));
      res.json({ posts });
    }
  );
}));

router.get('/feed/following', asyncHandler(async (req, res) => {
  const ownerId = req.developerApi?.ownerId;
  if (!ownerId) {
    throw new AuthError('Owner not resolved', 'OWNER_REQUIRED');
  }

  db.all(
    `SELECT p.id, p.user_id, p.text, p.image_url, p.timestamp,
            p.replies_count AS replies, p.reposts_count AS reposts, p.resonance_count AS resonance,
            u.username, u.avatar, u.verified
     FROM posts p
     JOIN followers f ON f.following_id = p.user_id
     JOIN users u ON p.user_id = u.id
     WHERE f.follower_id = $1
     ORDER BY p.timestamp DESC
     LIMIT 50`,
    [ownerId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const posts = (rows || []).map((row) => ({
        id: row.id.toString(),
        userId: row.user_id.toString(),
        text: row.text,
        imageUrl: row.image_url,
        timestamp: row.timestamp,
        replies: row.replies,
        reposts: row.reposts,
        resonance: row.resonance,
        author: {
          username: row.username,
          avatar: row.avatar,
          verified: row.verified === 1,
        },
      }));
      res.json({ posts });
    }
  );
}));

router.get('/search/users', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    throw new ValidationError('Query is required');
  }
  const searchQuery = `%${q}%`;
  db.all(
    `SELECT id, username, avatar, verified
     FROM users
     WHERE username ILIKE $1
     ORDER BY username
     LIMIT 20`,
    [searchQuery],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const users = (rows || []).map((row) => mapUserResponse(row));
      res.json({ users });
    }
  );
}));

router.get('/search/posts', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    throw new ValidationError('Query is required');
  }
  const searchQuery = `%${q}%`;
  db.all(
    `SELECT p.id, p.user_id, p.text, p.image_url, p.timestamp,
            u.username, u.avatar, u.verified
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.text ILIKE $1
     ORDER BY p.timestamp DESC
     LIMIT 20`,
    [searchQuery],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const posts = (rows || []).map((row) => ({
        id: row.id.toString(),
        userId: row.user_id.toString(),
        text: row.text,
        imageUrl: row.image_url,
        timestamp: row.timestamp,
        author: {
          username: row.username,
          avatar: row.avatar,
          verified: row.verified === 1,
        },
      }));
      res.json({ posts });
    }
  );
}));

router.get('/search/servers', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    throw new ValidationError('Query is required');
  }
  const searchQuery = `%${q}%`;
  db.all(
    `SELECT id, username, name, description, icon_url, type, owner_id, created_at
     FROM servers
     WHERE type = 'public' AND (name ILIKE $1 OR username ILIKE $1)
     ORDER BY created_at DESC
     LIMIT 20`,
    [searchQuery],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const servers = (rows || []).map((row) => ({
        id: row.id.toString(),
        username: row.username,
        name: row.name,
        description: row.description,
        iconUrl: row.icon_url,
        type: row.type,
        ownerId: row.owner_id.toString(),
        createdAt: row.created_at,
      }));
      res.json({ servers });
    }
  );
}));

initRedis().catch(() => {});

module.exports = router;
