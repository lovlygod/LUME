const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const apiRoutes = require('./api');
const { errorHandler } = require('./errors');
const { generateCSRFTokenMiddleware } = require('./csrf');
const db = require('./db');
const wsRedisAdapter = require('./wsRedisAdapter');

const app = express();
app.set('trust proxy', true);
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// WebSocket сервер для реального времени
const wss = new WebSocket.Server({ server, path: '/ws' });

// Status metrics (in-memory)
const statusMetrics = {
  requests: [],
  errors: []
};

// Хранилище подключенных клиентов
const clients = new Map(); // userId -> Set of WebSocket connections

// Online status tracking
const onlineUsers = new Map(); // userId -> { lastPing, connections: Set }

// Typing indicators with TTL (3 seconds)
const typingTimers = new Map(); // `${chatId}-${userId}` -> timeoutId

// WebSocket Rate Limiting
const wsRateLimits = new Map(); // userId -> { messages: number, lastReset: number }
const WS_RATE_LIMIT = {
  messagesPerMinute: 30, // Максимум сообщений в минуту
  subscriptionsPerUser: 50, // Максимум подписок на серверы
};

// Cookie options for httpOnly tokens
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true только для HTTPS
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
  path: '/'
};

// Middleware
const envFrontendUrls = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map((url) => url.trim()).filter(Boolean)
  : [];

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  ...envFrontendUrls,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // Разрешаем cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Request tracking for status metrics
app.use((req, res, next) => {
  const now = Date.now();
  statusMetrics.requests.push(now);
  res.on('finish', () => {
    if (res.statusCode >= 500) {
      statusMetrics.errors.push(now);
    }
  });
  next();
});
// Skip JSON/body parsing for multipart uploads (multer handles it)
app.use((req, res, next) => {
  if (req.is('multipart/form-data')) {
    return next();
  }
  return bodyParser.json({ limit: '10mb' })(req, res, next);
});
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
// Generate CSRF token cookie for all requests
app.use(generateCSRFTokenMiddleware);

// Security headers
app.use((req, res, next) => {
  // Content Security Policy
  const connectSrc = [
    "'self'",
    'http://localhost:5000',
    'ws://localhost:5000',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://unpkg.com',
    'https://cdn.jsdelivr.net',
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    ...envFrontendUrls,
  ].filter(Boolean).join(' ');

  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: http:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'"
  ].join('; '));
  
  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Update user online status in DB
function updateUserOnlineStatus(userId, online) {
  if (online) {
    db.run('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [userId], (err) => {
      if (err) console.error('Error updating last_seen_at:', err);
    });
  }
}

// Broadcast presence update to relevant users
function broadcastPresence(userId, online, lastSeenAt = null) {
  const event = JSON.stringify({
    type: 'presence:update',
    data: { userId: userId.toString(), online, lastSeenAt }
  });

  // Send to all connected clients except the user themselves
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.userId !== userId) {
      client.send(event);
    }
  });
}

const parseCookies = (cookieHeader = '') => {
  return cookieHeader.split(';').reduce((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join('=') || '');
    return acc;
  }, {});
};

// Обработка WebSocket подключений
wss.on('connection', (ws, req) => {
  const cookies = parseCookies(req?.headers?.cookie || '');
  if (cookies.refreshToken) {
    ws.sessionToken = cookies.refreshToken;
  }
  const accessToken = cookies.token;
  if (!accessToken) {
    ws.close(4401, 'Unauthorized');
    return;
  }

  try {
    const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
    if (!payload?.userId) {
      ws.close(4401, 'Unauthorized');
      return;
    }
    ws.authenticatedUserId = String(payload.userId);
  } catch (_error) {
    ws.close(4401, 'Unauthorized');
    return;
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Регистрация пользователя в системе WebSocket
      if (data.type === 'register') {
        const requestedUserId = data.userId ? String(data.userId) : null;
        const userId = ws.authenticatedUserId;
        if (requestedUserId && requestedUserId !== userId) {
          ws.send(JSON.stringify({
            type: 'error',
            error: { code: 'AUTH_MISMATCH', message: 'User mismatch in register payload' },
          }));
          return;
        }

        if (!clients.has(userId)) {
          clients.set(userId, new Set());
        }
        clients.get(userId).add(ws);
        ws.userId = userId;
        
        // Инициализация rate limit для пользователя
        if (!wsRateLimits.has(userId)) {
          wsRateLimits.set(userId, { messages: 0, lastReset: Date.now() });
        }

        // Track online status
        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, { lastPing: Date.now(), connections: new Set() });
        }
        onlineUsers.get(userId).connections.add(ws);

        // Update last_seen_at and broadcast online status
        updateUserOnlineStatus(userId, true);
        broadcastPresence(userId, true);
      }
      
      // WebSocket Rate Limiting проверка
      const userId = ws.userId;
      if (userId) {
        const rateLimit = wsRateLimits.get(userId) || { messages: 0, lastReset: Date.now() };
        const now = Date.now();
        
        // Сброс счётчика каждую минуту
        if (now - rateLimit.lastReset > 60000) {
          rateLimit.messages = 0;
          rateLimit.lastReset = now;
        }
        
        rateLimit.messages++;
        wsRateLimits.set(userId, rateLimit);
        
        // Проверка лимита
        if (rateLimit.messages > WS_RATE_LIMIT.messagesPerMinute) {
          ws.send(JSON.stringify({
            type: 'error',
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many WebSocket messages',
            },
          }));
          return;
        }
      }

      // Handle ping for keeping connection alive
      if (data.type === 'ping' && ws.userId) {
        if (onlineUsers.has(ws.userId)) {
          onlineUsers.get(ws.userId).lastPing = Date.now();
        }
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }

      // Typing indicator: typing:start
      if (data.type === 'typing:start' && data.chatId && ws.userId) {
        const userId = ws.userId;
        const chatId = data.chatId;
        const timerKey = `${chatId}-${userId}`;

        // Clear existing timer
        if (typingTimers.has(timerKey)) {
          clearTimeout(typingTimers.get(timerKey));
        }

        // Broadcast typing event to other chat participants
        const event = JSON.stringify({
          type: 'typing:update',
          data: { chatId, userId: userId.toString(), isTyping: true }
        });

        // Send to all clients except the typing user
        clients.forEach((userClients, otherUserId) => {
          if (String(otherUserId) !== String(userId)) {
            userClients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(event);
              }
            });
          }
        });

        // Set TTL timer (3 seconds)
        const timer = setTimeout(() => {
          typingTimers.delete(timerKey);
          const stopEvent = JSON.stringify({
            type: 'typing:update',
            data: { chatId, userId: userId.toString(), isTyping: false }
          });
          clients.forEach((userClients, otherUserId) => {
            if (String(otherUserId) !== String(userId)) {
              userClients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(stopEvent);
                }
              });
            }
          });
        }, 3000);

        typingTimers.set(timerKey, timer);
      }

      // Typing indicator: typing:stop
      if (data.type === 'typing:stop' && data.chatId && ws.userId) {
        const userId = ws.userId;
        const chatId = data.chatId;
        const timerKey = `${chatId}-${userId}`;

        if (typingTimers.has(timerKey)) {
          clearTimeout(typingTimers.get(timerKey));
          typingTimers.delete(timerKey);
        }

        const event = JSON.stringify({
          type: 'typing:update',
          data: { chatId, userId: userId.toString(), isTyping: false }
        });

        clients.forEach((userClients, otherUserId) => {
          if (String(otherUserId) !== String(userId)) {
            userClients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(event);
              }
            });
          }
        });
      }

      // Message delivered acknowledgment
      if (data.type === 'message:delivered' && data.messageId && ws.userId) {
        const userId = ws.userId;
        const messageId = data.messageId;

        // Update message as delivered (we'll use read_status for simplicity)
        db.run(
          'UPDATE messages SET read_status = 1 WHERE id = $1 AND receiver_id = $2',
          [messageId, userId],
          (err) => {
            if (err) console.error('Error updating message delivered:', err);
          }
        );

        // Notify sender that message was delivered
        const event = JSON.stringify({
          type: 'message:delivered',
          data: { messageId: messageId.toString(), userId: userId.toString() }
        });

        // Find the sender and notify them
        db.get('SELECT sender_id FROM messages WHERE id = $1', [messageId], (err, msg) => {
          if (err || !msg) return;
          const senderClients = clients.get(msg.sender_id);
          if (senderClients) {
            senderClients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(event);
              }
            });
          }
        });
      }

      // Chat read receipt: chat:read
      if (data.type === 'chat:read' && data.chatId && ws.userId) {
        const userId = ws.userId;
        const chatId = data.chatId;
        const lastReadMessageId = data.lastReadMessageId;

        // Upsert chat_reads record
        db.serialize(() => {
          db.run(
            `INSERT INTO chat_reads (chat_id, user_id, last_read_message_id, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT(chat_id, user_id)
             DO UPDATE SET last_read_message_id = $4, updated_at = NOW()`,
            [chatId, userId, lastReadMessageId, lastReadMessageId],
            (err) => {
              if (err) console.error('Error updating chat_reads:', err);
            }
          );
        });

        // Broadcast read update to other chat participants
        const event = JSON.stringify({
          type: 'chat:read_update',
          data: { chatId, userId: userId.toString(), lastReadMessageId: lastReadMessageId.toString() }
        });

        clients.forEach((userClients, otherUserId) => {
          if (String(otherUserId) !== String(userId)) {
            userClients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(event);
              }
            });
          }
        });
      }

      // ========== SERVERS (COMMUNITIES) EVENTS ==========

      // Subscribe to server updates
      if (data.type === 'server:subscribe' && data.serverId && ws.userId) {
        if (!ws.subscribedServers) {
          ws.subscribedServers = new Set();
        }
        ws.subscribedServers.add(parseInt(data.serverId));
        console.info('[WS] server:subscribe', { userId: ws.userId, serverId: data.serverId });
      }

      // Unsubscribe from server
      if (data.type === 'server:unsubscribe' && data.serverId && ws.userId) {
        if (ws.subscribedServers) {
          ws.subscribedServers.delete(parseInt(data.serverId));
        }
        console.info('[WS] server:unsubscribe', { userId: ws.userId, serverId: data.serverId });
      }

      // Server message read receipt
      if (data.type === 'server:message_read' && data.channelId && data.messageId && ws.userId) {
        // Can be extended for read receipts in channels
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      const userClients = clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        
        // Update online status
        if (onlineUsers.has(ws.userId)) {
          onlineUsers.get(ws.userId).connections.delete(ws);
          
          // If no more connections, mark as offline
          if (onlineUsers.get(ws.userId).connections.size === 0) {
            const userId = ws.userId;
            updateUserOnlineStatus(userId, false);
            broadcastPresence(userId, false, new Date().toISOString());
            onlineUsers.delete(userId);
          }
        }
        
        if (userClients.size === 0) {
          clients.delete(ws.userId);
        }
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Отправляем приветственное сообщение
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to LUME real-time server',
    timestamp: new Date().toISOString()
  }));
});

// Функция для отправки событий пользователю
const sendToUser = (userId, event) => {
  const userClients = clients.get(userId);
  if (userClients) {
    const message = JSON.stringify(event);
    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};

// Функция для отправки событий всем подключенным клиентам
const broadcast = (event) => {
  const message = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Функция для отправки событий подписанным пользователям сервера
const broadcastToServer = (serverId, event) => {
  const message = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.subscribedServers) {
      if (client.subscribedServers.has(parseInt(serverId))) {
        client.send(message);
      }
    }
  });
};

// ========== Redis-synced wrappers ==========
// Эти функции публикуют события в Redis для синхронизации между нодами

/**
 * Отправляет событие о новом сообщении с синхронизацией Redis
 */
const sendNewMessage = async (data) => {
  // Публикуем в Redis для синхронизации с другими нодами
  await wsRedisAdapter.publishNewMessage(data);
  
  // Локальная отправка получателю
  const { receiverId } = data;
  if (receiverId) {
    sendToUser(receiverId, {
      type: 'new_message',
      data,
    });
  }
};

/**
 * Отправляет событие о создании поста с синхронизацией Redis
 */
const sendPostCreated = async (data) => {
  // Публикуем в Redis для синхронизации с другими нодами
  await wsRedisAdapter.publishPostCreated(data);
  
  // Локальная рассылка всем клиентам
  broadcast({
    type: 'post_created',
    data,
  });
};

/**
 * Отправляет уведомление с синхронизацией Redis
 */
const sendNotification = async (data) => {
  // Публикуем в Redis для синхронизации с другими нодами
  await wsRedisAdapter.publishNotification(data);

  // Локальная отправка получателю
  const { userId } = data;
  if (userId) {
    sendToUser(userId, {
      type: 'notification_new',
      data,
    });
  }
};

/**
 * Создаёт уведомление в БД и отправляет через WebSocket
 * @param {object} params - параметры уведомления
 * @param {number} params.userId - ID получателя
 * @param {string} params.type - тип уведомления (message, reply, mention, reaction, server_invite, server_join, follow, comment, post_resonance, post_comment)
 * @param {number|null} params.actorId - ID актёра
 * @param {string|null} params.actorUsername - username актёра
 * @param {string|null} params.actorAvatar - avatar актёра
 * @param {number|null} params.targetId - ID цели
 * @param {string|null} params.targetType - тип цели (chat, message, post, comment, server, user)
 * @param {string|null} params.message - текст уведомления
 * @param {string|null} params.url - ссылка
 */
let notificationsHasEntityId = null;

const createNotification = async ({
  userId,
  type,
  actorId = null,
  actorUsername = null,
  actorAvatar = null,
  targetId = null,
  targetType = null,
  message = null,
  url = null,
}) => {
  const db = require('./db');
  let finalActorUsername = actorUsername;
  let finalActorAvatar = actorAvatar;
  const entityId = targetId ?? actorId ?? userId ?? null;

  if (actorId && (!finalActorUsername || !finalActorAvatar)) {
    const actor = await new Promise((resolve) => {
      db.get('SELECT username, avatar FROM users WHERE id = $1', [actorId], (err, row) => {
        if (err) resolve(null);
        else resolve(row);
      });
    });
    if (!finalActorUsername && actor?.username) {
      finalActorUsername = actor.username;
    }
    if (!finalActorAvatar && actor?.avatar) {
      finalActorAvatar = actor.avatar;
    }
  }
  
  if (notificationsHasEntityId === null) {
    notificationsHasEntityId = await new Promise((resolve) => {
      db.get(
        "SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'entity_id'",
        (err, row) => {
          if (err) {
            resolve(false);
          } else {
            resolve(Boolean(row));
          }
        }
      );
    });
  }

  // Создаём запись в БД
  await new Promise((resolve, reject) => {
    const insertQuery = notificationsHasEntityId
      ? 'INSERT INTO notifications (user_id, type, entity_id, actor_id, actor_username, actor_avatar, target_id, target_type, message, url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)'
      : 'INSERT INTO notifications (user_id, type, actor_id, actor_username, actor_avatar, target_id, target_type, message, url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
    const params = notificationsHasEntityId
      ? [userId, type, entityId, actorId, finalActorUsername, finalActorAvatar, targetId, targetType, message, url]
      : [userId, type, actorId, finalActorUsername, finalActorAvatar, targetId, targetType, message, url];

    db.run(insertQuery, params, (err) => {
      if (err) {
        console.error('[Server] Error creating notification:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });

  // Отправляем WebSocket уведомление
  await sendNotification({
    userId: userId.toString(),
    type,
    actor_id: actorId ? actorId.toString() : null,
    actor_username: finalActorUsername,
    actor_avatar: finalActorAvatar,
    target_id: targetId ? targetId.toString() : null,
    target_type: targetType,
    message,
    url,
    timestamp: new Date().toISOString()
  });
};

/**
 * Отправляет событие сервера с синхронизацией Redis
 */
const sendServerMessage = async (data) => {
  // Публикуем в Redis для синхронизации с другими нодами
  await wsRedisAdapter.publishServerMessage(data);
  
  // Локальная рассылка подписчикам сервера
  const { serverId } = data;
  if (serverId) {
    broadcastToServer(serverId, {
      type: data.type || 'channel:new_message',
      data,
    });
  }
};

// Экспортируем функции для использования в API роутах
app.set('sendToUser', sendToUser);
app.set('broadcast', broadcast);
app.set('broadcastToServer', broadcastToServer);
// Экспортируем Redis-synced функции
app.set('sendNewMessage', sendNewMessage);
app.set('sendPostCreated', sendPostCreated);
app.set('sendNotification', sendNotification);
app.set('sendServerMessage', sendServerMessage);
app.set('createNotification', createNotification);
app.set('clients', clients);
app.set('onlineUsers', onlineUsers);

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    websocket: {
      connected: wss.clients.size,
      users: clients.size,
      onlineUsers: onlineUsers.size
    }
  });
});

// Live status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const startApi = process.hrtime.bigint();
    await new Promise((resolve) => setImmediate(resolve));
    const apiLatencyMs = Number(process.hrtime.bigint() - startApi) / 1e6;

    const startDb = process.hrtime.bigint();
    await new Promise((resolve, reject) => {
      db.get('SELECT 1', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    const dbLatencyMs = Number(process.hrtime.bigint() - startDb) / 1e6;

    const now = Date.now();
    const windowMs = 60 * 1000;
    statusMetrics.requests = statusMetrics.requests.filter((ts) => now - ts < windowMs);
    statusMetrics.errors = statusMetrics.errors.filter((ts) => now - ts < windowMs);
    const requestsPerMinute = statusMetrics.requests.length;
    const errorRate = requestsPerMinute === 0 ? 0 : (statusMetrics.errors.length / requestsPerMinute) * 100;

    const mem = process.memoryUsage();
    const totalMem = mem.heapTotal || 1;
    const memoryPercent = (mem.heapUsed / totalMem) * 100;
    const cpuLoad = require('os').loadavg();

    res.json({
      timestamp: new Date().toISOString(),
      uptimeSec: process.uptime(),
      api: {
        available: true,
        latencyMs: Math.round(apiLatencyMs),
        requestsPerMinute,
        errorRate: Number(errorRate.toFixed(2))
      },
      database: {
        available: true,
        latencyMs: Math.round(dbLatencyMs)
      },
      websocket: {
        available: true,
        latencyMs: null,
        connections: wss.clients.size
      },
      media: {
        available: true,
        latencyMs: null
      },
      system: {
        memory: {
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
          percent: Number(memoryPercent.toFixed(2))
        },
        cpu: {
          loadAvg: cpuLoad
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'STATUS_UNAVAILABLE' });
  }
});

// Handle 404 for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

// Centralized error handling middleware (must be last)
app.use(errorHandler);

server.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
  console.info(`Health check: http://localhost:${PORT}/health`);
  console.info(`API base: http://localhost:${PORT}/api`);
  console.info(`WebSocket: ws://localhost:${PORT}/ws`);

  try {
    const api = require('./api');
    if (typeof api.ensureStickerData === 'function') {
      api.ensureStickerData().then(() => {
        console.info('[Startup] Sticker packs synced');
      }).catch((err) => {
        console.error('[Startup] Sticker sync failed:', err?.message || err);
      });
    }
  } catch (err) {
    console.error('[Startup] Sticker sync error:', err?.message || err);
  }

  // Cleanup expired refresh tokens and orphaned sessions on startup
  db.run(
    'DELETE FROM refresh_tokens WHERE expires_at <= NOW()',
    (err) => {
      if (err) {
        console.warn('[Startup] Failed to cleanup expired refresh_tokens:', err.message);
        return;
      }
      console.info('[Startup] Expired refresh_tokens cleaned');
    }
  );
  db.run(
    'DELETE FROM sessions WHERE token NOT IN (SELECT token FROM refresh_tokens)',
    (err) => {
      if (err) {
        console.warn('[Startup] Failed to cleanup orphaned sessions:', err.message);
        return;
      }
      console.info('[Startup] Orphaned sessions cleaned');
    }
  );
  
  // Инициализируем WebSocket Redis адаптер
  wsRedisAdapter.initWsRedisAdapter({
    sendToUser,
    broadcast,
    broadcastToServer,
    clients,
  }).then(() => {
    console.info('[Server] WebSocket Redis Adapter initialized');
  }).catch((err) => {
    console.error('[Server] WebSocket Redis Adapter initialization error:', err);
  });
});

module.exports = { app, server, wss, sendToUser, broadcast };

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.info('[Server] SIGTERM received, shutting down gracefully...');
  
  // Закрываем WebSocket подключения
  wss.clients.forEach((client) => {
    client.close(1001, 'Server shutting down');
  });
  
  // Закрываем Redis подключения
  await wsRedisAdapter.shutdown();
  
  // Закрываем HTTP сервер
  server.close(() => {
    console.info('[Server] Closed out remaining connections');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.info('[Server] SIGINT received, shutting down gracefully...');
  
  // Закрываем WebSocket подключения
  wss.clients.forEach((client) => {
    client.close(1001, 'Server shutting down');
  });
  
  // Закрываем Redis подключения
  await wsRedisAdapter.shutdown();
  
  // Закрываем HTTP сервер
  server.close(() => {
    console.info('[Server] Closed out remaining connections');
    process.exit(0);
  });
});


