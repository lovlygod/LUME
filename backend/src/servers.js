const express = require('express');
const path = require('path');
const { getPublicBaseUrl } = require('./utils/baseUrl');
const multer = require('multer');
const db = require('./db');
const { authenticateToken } = require('./auth');
const { asyncHandler, ValidationError, NotFoundError, ForbiddenError } = require('./errors');
const { logger } = require('./logger');
const { audit } = require('./audit');
const {
  createServerSchema,
  createChannelSchema,
  sendServerMessageSchema,
} = require('./validation');
const {
  requireServerOwner,
  requireServerMember,
  requireMinRank,
  requireCanManageMember,
  ROLE_RANKS,
} = require('./permissions');

const router = express.Router();

// Настройка multer для загрузки иконок серверов (только изображения)
const iconStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/servers/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'server-icon-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadIcon = multer({
  storage: iconStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Настройка multer для загрузки файлов в каналах (любые файлы)
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/servers/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'channel-file-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadFile = multer({
  storage: fileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Helper: получить роль пользователя на сервере
const getServerMemberRole = (serverId, userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT sr.id, sr.name, sr.rank, sr.permissions_json, sr.is_system
      FROM server_members sm
      JOIN server_roles sr ON sm.role_id = sr.id
      WHERE sm.server_id = $1 AND sm.user_id = $2
    `;
    db.get(query, [serverId, userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper: проверить, является ли пользователь владельцем сервера
const isServerOwner = (serverId, userId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM servers WHERE id = $1 AND owner_id = $2', [serverId, userId], (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    });
  });
};

// Helper: получить сервер по identifier (username или id)
const getServerByIdentifier = (identifier) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT s.*, u.name as owner_name, u.username as owner_username, u.avatar as owner_avatar
      FROM servers s
      JOIN users u ON s.owner_id = u.id
      WHERE s.username = $1 OR s.id = $2
    `;
    const idParam = /^\d+$/.test(identifier) ? Number(identifier) : null;
    db.get(query, [identifier, idParam], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const ensureServerRole = (serverId, name, rank, permissionsJson = null, isSystem = 1) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM server_roles WHERE server_id = $1 AND name = $2',
      [serverId, name],
      (err, row) => {
        if (err) return reject(err);
        if (row?.id) return resolve(row.id);
        db.run(
          `INSERT INTO server_roles (server_id, name, rank, permissions_json, is_system)
           VALUES ($1, $2, $3, $4, $5)`,
          [serverId, name, rank, permissionsJson, isSystem],
          function(insertErr) {
            if (insertErr) return reject(insertErr);
            resolve(this.lastID);
          }
        );
      }
    );
  });
};

const ensureServerMember = (serverId, userId, roleId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO server_members (server_id, user_id, role_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [serverId, userId, roleId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

const ensureDefaultChannel = (serverId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO server_channels (server_id, name, type, position) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [serverId, 'general', 'text', 0],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

const ensureServerRoles = async (serverId) => {
  await ensureServerRole(serverId, 'Owner', 100);
  await ensureServerRole(serverId, 'Admin', 80);
  await ensureServerRole(serverId, 'Moderator', 50);
  await ensureServerRole(serverId, 'Member', 10);
};

const ensureOwnerMembership = async (serverId, userId) => {
  await ensureServerRoles(serverId);
  const ownerRoleId = await ensureServerRole(serverId, 'Owner', 100);
  await ensureServerMember(serverId, userId, ownerRoleId);
  await ensureDefaultChannel(serverId);
};

// ==================== ROUTES ====================

// 1. Создать сервер
router.post('/', authenticateToken, uploadIcon.single('icon'), asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  // Валидация через Zod
  const result = createServerSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid server data', {
      fields: result.error.flatten().fieldErrors,
    });
  }
  
  let { name, username, type, description } = result.data;

  // Для публичного сервера username обязателен
  if (type === 'public' && !username) {
    throw new ValidationError('Public server must have a username', {
      fields: { username: ['Username is required for public servers'] },
    });
  }

  // Проверка уникальности username
  if (username) {
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM servers WHERE username = $1', [username.trim()], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existing) {
      throw new ValidationError('Server username already exists', {
        fields: { username: ['This username is taken'] },
      });
    }
  }

  const iconUrl = req.file ? `${getPublicBaseUrl(req)}/uploads/servers/${req.file.filename}` : null;

  // Создаём сервер (роли, участник и канал создаются триггером)
  const insertQuery = `
    INSERT INTO servers (username, name, description, icon_url, type, owner_id)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  const serverId = await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN', (beginErr) => {
        if (beginErr) return reject(beginErr);
        db.run(
          insertQuery,
          [
            type === 'public' ? username?.trim() : null,
            name.trim(),
            description?.trim() || null,
            iconUrl,
            type,
            userId
          ],
          function(err) {
            if (err) {
              return db.run('ROLLBACK', () => reject(err));
            }

            const createdServerId = this.lastID;

            ensureOwnerMembership(createdServerId, userId)
              .then(() => {
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) return reject(commitErr);
                  resolve(createdServerId);
                });
              })
              .catch((seedErr) => {
                db.run('ROLLBACK', () => reject(seedErr));
              });
          }
        );
      });
    });
  });

  // Отправляем WebSocket событие всем (сервер создан)
  const broadcast = req.app.get('broadcast');
  if (broadcast) {
    broadcast({
      type: 'server:created',
      data: {
        id: serverId,
        name: name.trim(),
        username: type === 'public' ? username?.trim() : null,
        type,
        ownerId: userId
      }
    });
  }

  // Логируем создание сервера
  logger.server.created(serverId, userId, name.trim());
  
  // Audit log
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  await audit.serverCreated(serverId, userId, name.trim(), ip);

  res.status(201).json({
    message: 'Server created successfully',
    server: {
      id: serverId,
      name: name.trim(),
      username: type === 'public' ? username?.trim() : null,
      type,
      iconUrl,
      description: description?.trim() || null,
      ownerId: userId,
      createdAt: new Date().toISOString()
    }
  });
}));

// 13. Получить мои серверы
router.get('/my', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT s.*, sm.role_id, sr.name as role_name, sr.rank
    FROM servers s
    JOIN server_members sm ON s.id = sm.server_id
    JOIN server_roles sr ON sm.role_id = sr.id
    WHERE sm.user_id = $1
    ORDER BY sm.joined_at DESC
  `;

  db.all(query, [userId], (err, servers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      servers: servers.map(s => ({
        id: s.id,
        username: s.username,
        name: s.name,
        description: s.description,
        iconUrl: s.icon_url,
        type: s.type,
        ownerId: s.owner_id,
        role: {
          id: s.role_id,
          name: s.role_name,
          rank: s.rank
        }
      }))
    });
  });
});

// 14. Получить публичные серверы
router.get('/public', authenticateToken, (req, res) => {
  const query = `
    SELECT s.*, u.name as owner_name
    FROM servers s
    JOIN users u ON s.owner_id = u.id
    WHERE s.type = 'public' AND s.username IS NOT NULL
    ORDER BY s.created_at DESC
    LIMIT 50
  `;

  db.all(query, [], (err, servers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      servers: servers.map(s => ({
        id: s.id,
        username: s.username,
        name: s.name,
        description: s.description,
        iconUrl: s.icon_url,
        type: s.type,
        ownerId: s.owner_id
      }))
    });
  });
});

// 2. Получить сервер по identifier
router.get('/:identifier', authenticateToken, async (req, res) => {
  const { identifier } = req.params;
  const userId = req.user.userId;
  const numericUserId = Number(userId);

  try {
    const server = await getServerByIdentifier(identifier);

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Проверяем, является ли пользователь участником
    let memberRole = await getServerMemberRole(server.id, userId);
    if (!memberRole && Number(server.owner_id) === Number(userId)) {
      try {
        await ensureOwnerMembership(server.id, userId);
        memberRole = await getServerMemberRole(server.id, userId);
      } catch (seedErr) {
        console.error('Ensure owner membership error:', seedErr);
      }
    }

    // Для закрытых серверов проверяем доступ
    const isOwner = Number(server.owner_id) === numericUserId;
    if (server.type === 'private' && !memberRole && !isOwner) {
      // Проверяем, есть ли заявка
      const hasRequest = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id, status FROM server_join_requests WHERE server_id = $1 AND user_id = $2',
          [server.id, userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      return res.json({
        server: {
          id: server.id,
          name: server.name,
          type: server.type,
          ownerId: server.owner_id,
          ownerName: server.owner_name,
          ownerUsername: server.owner_username,
          ownerAvatar: server.owner_avatar,
          isMember: false,
          joinRequest: hasRequest ? { id: hasRequest.id, status: hasRequest.status } : null
        }
      });
    }

    // Получаем каналы сервера
    const channels = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM server_channels WHERE server_id = $1 ORDER BY position ASC',
        [server.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      server: {
        id: server.id,
        username: server.username,
        name: server.name,
        description: server.description,
        iconUrl: server.icon_url,
        type: server.type,
        ownerId: server.owner_id,
        ownerName: server.owner_name,
        ownerUsername: server.owner_username,
        ownerAvatar: server.owner_avatar,
        isMember: !!memberRole,
        role: memberRole ? {
          id: memberRole.id,
          name: memberRole.name,
          rank: memberRole.rank,
          permissions: JSON.parse(memberRole.permissions_json || '{}')
        } : null,
        channels: channels.map(ch => ({
          id: ch.id,
          name: ch.name,
          type: ch.type,
          position: ch.position
        })),
        createdAt: server.created_at,
        isOwner,
      }
    });
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Подать заявку на вступление (для закрытых серверов)
router.post('/:id/request-join', authenticateToken, (req, res) => {
  const serverId = parseInt(req.params.id);
  const userId = req.user.userId;

  db.get('SELECT type, owner_id FROM servers WHERE id = $1', [serverId], (err, server) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.type !== 'private') {
      return res.status(400).json({ error: 'This server is not private' });
    }

    // Проверяем, не является ли пользователь уже участником
    db.get(
      'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
      [serverId, userId],
      (err, member) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (member) {
          return res.status(400).json({ error: 'Already a member' });
        }

        // Создаём заявку
        db.run(
        `INSERT INTO server_join_requests (server_id, user_id, status) VALUES ($1, $2, 'pending')`,
        [serverId, userId],
        function(err) {
          if (err) {
            if (err.code === '23505' || err.message.includes('UNIQUE constraint')) {
              return res.status(400).json({ error: 'Request already exists' });
            }
              return res.status(500).json({ error: 'Database error' });
            }

            const requestId = this.lastID;

            // Отправляем WebSocket событие владельцу
            const sendToUser = req.app.get('sendToUser');
            const createNotification = req.app.get('createNotification');
            
            if (sendToUser) {
              sendToUser(server.owner_id, {
                type: 'server:join_request',
                data: {
                  requestId,
                  serverId,
                  userId,
                  createdAt: new Date().toISOString()
                }
              });
            }
            
            // Создаем уведомление для владельца сервера
            if (createNotification) {
              db.get('SELECT name, username, avatar FROM users WHERE id = $1', [userId], (err, actor) => {
                const actorName = actor?.name || actor?.username || 'Someone';
                createNotification({
                  userId: server.owner_id,
                  type: 'server_join_request',
                  actorId: userId,
                  actorUsername: actor?.username || null,
                  actorAvatar: actor?.avatar || null,
                  targetId: serverId,
                  targetType: 'server',
                  message: `${actorName} отправил заявку на вступление в сервер "${server.name || 'Server'}"`,
                  url: `/server/${serverId}`
                }).catch(err => {
                  console.error('[Servers] Error creating notification:', err);
                });
              });
            }

            res.json({
              message: 'Join request sent',
              requestId
            });
          }
        );
      }
    );
  });
});

// 4. Принять заявку (только Owner)
router.post('/:id/requests/:requestId/approve', authenticateToken, async (req, res) => {
  const serverId = parseInt(req.params.id);
  const requestId = parseInt(req.params.requestId);
  const userId = req.user.userId;

  try {
    const isOwner = await isServerOwner(serverId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only server owner can approve requests' });
    }

    // Получаем заявку
    const request = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id FROM server_join_requests WHERE id = $1 AND server_id = $2 AND status = $3',
        [requestId, serverId, 'pending'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const requestingUserId = request.user_id;

    // Получаем роль Member
    await ensureServerRoles(serverId);
    const memberRoleId = await ensureServerRole(serverId, 'Member', 10);

    db.serialize(() => {
      db.run('BEGIN', (beginErr) => {
        if (beginErr) {
          return res.status(500).json({ error: 'Database error' });
        }
        db.run(
          'INSERT INTO server_members (server_id, user_id, role_id) VALUES ($1, $2, $3)',
          [serverId, requestingUserId, memberRoleId],
          function(err) {
            if (err) {
              return db.run('ROLLBACK', () => res.status(500).json({ error: 'Database error' }));
            }

            db.run(
              `UPDATE server_join_requests 
               SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1 
               WHERE id = $2`,
              [userId, requestId],
              (err) => {
                if (err) {
                  return db.run('ROLLBACK', () => res.status(500).json({ error: 'Database error' }));
                }

                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    return res.status(500).json({ error: 'Database error' });
                  }

                  const sendToUser = req.app.get('sendToUser');
                  const broadcastToServer = req.app.get('broadcastToServer');

                  if (sendToUser) {
                    sendToUser(requestingUserId, {
                      type: 'server:join_request_updated',
                      data: {
                        requestId,
                        serverId,
                        status: 'approved'
                      }
                    });
                  }

                  if (broadcastToServer) {
                    broadcastToServer(serverId, {
                      type: 'server:member_joined',
                      data: {
                        serverId,
                        userId: requestingUserId,
                        roleId: memberRoleId
                      }
                    });
                  }

                  res.json({ message: 'Request approved' });
                });
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. Отклонить заявку (только Owner)
router.post('/:id/requests/:requestId/reject', authenticateToken, async (req, res) => {
  const serverId = parseInt(req.params.id);
  const requestId = parseInt(req.params.requestId);
  const userId = req.user.userId;

  try {
    const isOwner = await isServerOwner(serverId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only server owner can reject requests' });
    }

    db.run(
      `UPDATE server_join_requests 
       SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $1 
       WHERE id = $2 AND server_id = $3`,
      [userId, requestId, serverId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const sendToUser = req.app.get('sendToUser');
        if (sendToUser) {
          db.get('SELECT user_id FROM server_join_requests WHERE id = $1', [requestId], (err, row) => {
            if (!err && row) {
              sendToUser(row.user_id, {
                type: 'server:join_request_updated',
                data: {
                  requestId,
                  serverId,
                  status: 'rejected'
                }
              });
            }
          });
        }

        res.json({ message: 'Request rejected' });
      }
    );
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. Вступить в открытый сервер
router.post('/:id/join', authenticateToken, async (req, res) => {
  const serverId = parseInt(req.params.id);
  const userId = req.user.userId;

  try {
    const server = await getServerByIdentifier(serverId.toString());
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.type !== 'public') {
      return res.status(400).json({ error: 'This server is not public' });
    }

    // Проверяем, не участник ли уже
    const existingMember = await getServerMemberRole(serverId, userId);
    if (existingMember) {
      return res.status(400).json({ error: 'Already a member' });
    }

    // Проверяем, не забанен ли
    const isBanned = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM server_bans WHERE server_id = $1 AND user_id = $2',
        [serverId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });

    if (isBanned) {
      return res.status(403).json({ error: 'You are banned from this server' });
    }

    // Получаем роль Member
    const memberRoleId = await ensureServerRole(serverId, 'Member', 10);

    db.serialize(() => {
      db.run('BEGIN', (beginErr) => {
        if (beginErr) {
          return res.status(500).json({ error: 'Database error' });
        }
        db.run(
          'INSERT INTO server_members (server_id, user_id, role_id) VALUES ($1, $2, $3)',
          [serverId, userId, memberRoleId],
          function(err) {
            if (err) {
              return db.run('ROLLBACK', () => res.status(500).json({ error: 'Database error' }));
            }
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                return res.status(500).json({ error: 'Database error' });
              }

              const broadcastToServer = req.app.get('broadcastToServer');
              if (broadcastToServer) {
                broadcastToServer(serverId, {
                  type: 'server:member_joined',
                  data: {
                    serverId,
                    userId,
                    roleId: memberRoleId
                  }
                });
              }

              res.json({ message: 'Joined server successfully' });
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('Join server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 7. Покинуть сервер
router.post('/:id/leave', authenticateToken, (req, res) => {
  const serverId = parseInt(req.params.id);
  const userId = req.user.userId;

  db.get('SELECT owner_id FROM servers WHERE id = $1', [serverId], (err, server) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Owner не может покинуть сервер (должен передать владение)
    if (Number(server.owner_id) === Number(userId)) {
      return res.status(400).json({ error: 'Owner cannot leave server. Transfer ownership first.' });
    }

    db.run(
      'DELETE FROM server_members WHERE server_id = $1 AND user_id = $2',
      [serverId, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const broadcastToServer = req.app.get('broadcastToServer');
        if (broadcastToServer) {
          broadcastToServer(serverId, {
            type: 'server:member_left',
            data: {
              serverId,
              userId
            }
          });
        }

        res.json({ message: 'Left server successfully' });
      }
    );
  });
});

// 8. Получить заявки на вступление (только Owner)
router.get('/:id/requests', authenticateToken, async (req, res) => {
  const serverId = parseInt(req.params.id);
  const userId = req.user.userId;

  try {
    const isOwner = await isServerOwner(serverId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only server owner can view requests' });
    }

    const query = `
      SELECT sjr.*, u.name, u.username, u.avatar, u.verified
      FROM server_join_requests sjr
      JOIN users u ON sjr.user_id = u.id
      WHERE sjr.server_id = $1 AND sjr.status = 'pending'
      ORDER BY sjr.created_at DESC
    `;

    db.all(query, [serverId], (err, requests) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        requests: requests.map(r => ({
          id: r.id,
          userId: r.user_id,
          name: r.name,
          username: r.username,
          avatar: r.avatar,
          verified: r.verified === 1,
          createdAt: r.created_at
        }))
      });
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 9. Создать канал (только Admin+)
router.post('/:id/channels', 
  authenticateToken,
  requireMinRank(ROLE_RANKS.Admin), // Централизованная проверка прав
  asyncHandler(async (req, res) => {
    const serverId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Валидация через Zod
    const result = createChannelSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError('Invalid channel data', {
        fields: result.error.flatten().fieldErrors,
      });
    }

    const { name } = result.data;

    // Получаем максимальную позицию
    const maxPos = await new Promise((resolve, reject) => {
      db.get(
        'SELECT MAX(position) as maxPos FROM server_channels WHERE server_id = $1',
        [serverId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row?.maxPos || 0);
        }
      );
    });

    const newPosition = maxPos + 1;

    const channel = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO server_channels (server_id, name, type, position) VALUES ($1, $2, $3, $4)',
        [serverId, name, 'text', newPosition],
        function(err) {
          if (err) {
            if (err.code === '23505' || err.message.includes('UNIQUE constraint')) {
              reject(new ValidationError('Channel already exists', {
                fields: { name: ['A channel with this name already exists'] },
              }));
            } else {
              reject(err);
            }
          } else {
            resolve({
              id: this.lastID,
              name,
              type: 'text',
              position: newPosition,
            });
          }
        }
      );
    });

    const broadcastToServer = req.app.get('broadcastToServer');
    if (broadcastToServer) {
      broadcastToServer(serverId, {
        type: 'server:channel_created',
        data: {
          serverId,
          channelId: channel.id,
          name
        }
      });
    }

    // Логируем создание канала
    logger.server.channelCreated(channel.id, serverId, userId, name);

    res.status(201).json({
      message: 'Channel created',
      channel
    });
  })
);

// 10. Получить сообщения канала
router.get('/:serverId/channels/:channelId/messages', authenticateToken, (req, res) => {
  const serverId = parseInt(req.params.serverId);
  const channelId = parseInt(req.params.channelId);
  const userId = req.user.userId;
  const { limit = 50, before } = req.query;

  // Проверяем, является ли пользователь участником сервера
  getServerMemberRole(serverId, userId).then(memberRole => {
    const server = db.get('SELECT owner_id FROM servers WHERE id = $1', [serverId], (err, server) => {
      const isOwner = server && Number(server.owner_id) === Number(userId);
      if (!server || (!memberRole && !isOwner)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      let query = `
        SELECT sm.*, u.name, u.username, u.avatar, u.verified
        FROM server_messages sm
        JOIN users u ON sm.user_id = u.id
        LEFT JOIN server_message_deletions smd ON smd.message_id = sm.id AND smd.user_id = $1
        WHERE sm.channel_id = $2
      `;
      const params = [userId, channelId];

      if (before) {
        query += ' AND sm.id < $3';
        params.push(parseInt(before));
      }

      query += before ? ' ORDER BY sm.created_at DESC LIMIT $4' : ' ORDER BY sm.created_at DESC LIMIT $3';
      params.push(parseInt(limit));

      db.all(query, params, (err, messages) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Получаем аттачи для сообщений
        const messageIds = messages.map(m => m.id);
        if (messageIds.length === 0) {
          return res.json({ messages: [] });
        }

        const placeholders = messageIds.map((_, index) => `$${index + 1}`).join(',');
        db.all(
          `SELECT * FROM server_message_attachments WHERE message_id IN (${placeholders})`,
          messageIds,
          (err, attachments) => {
            if (err) console.error('Error getting attachments:', err);

            const attachmentsByMessage = {};
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
                height: att.height
              });
            });

      const formattedMessages = messages.map(msg => ({
        id: msg.id.toString(),
        channelId: msg.channel_id.toString(),
        userId: msg.user_id.toString(),
        text: msg.text,
        createdAt: msg.created_at,
        editedAt: msg.edited_at,
        deleted_for_me: !!msg.deleted_at,
        deleted_for_all: !!msg.deleted_at,
        replyToMessageId: msg.reply_to_message_id ? msg.reply_to_message_id.toString() : null,
        linkPreview: msg.link_preview ? (() => {
          try {
            return JSON.parse(msg.link_preview);
          } catch (error) {
            return null;
          }
        })() : null,
        author: {
          id: msg.user_id.toString(),
          name: msg.name,
          username: msg.username,
          avatar: msg.avatar,
          verified: msg.verified === 1
        },
        attachments: attachmentsByMessage[msg.id] || []
      })).reverse(); // Возвращаем в хронологическом порядке
res.json({ messages: formattedMessages });
}
        );
      });
    });
  }).catch(err => {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Server error' });
  });
});

// 11. Отправить сообщение в канал
router.post('/:serverId/channels/:channelId/messages', authenticateToken, asyncHandler(async (req, res) => {
  const serverId = parseInt(req.params.serverId);
  const channelId = parseInt(req.params.channelId);
  const userId = req.user.userId;
  
  // Валидация через Zod
  const result = sendServerMessageSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid message data', {
      fields: result.error.flatten().fieldErrors,
    });
  }
  
  const { text, attachmentIds, replyToMessageId } = result.data;

  // Разрешаем отправку либо с текстом, либо с аттачами
  const hasText = text && text.trim().length > 0;
  const hasAttachments = attachmentIds && Array.isArray(attachmentIds) && attachmentIds.length > 0;

  if (!hasText && !hasAttachments) {
    throw new ValidationError('Message text or attachments are required');
  }

  // Проверяем, является ли пользователь участником сервера
  let memberRole = await getServerMemberRole(serverId, userId);
  const server = await new Promise((resolve, reject) => {
    db.get('SELECT owner_id FROM servers WHERE id = $1', [serverId], (err, server) => {
      if (err) reject(err);
      else resolve(server);
    });
  });

  console.warn('[ServerMessage] Access check', {
    serverId,
    channelId,
    userId,
    serverOwnerId: server?.owner_id || null,
    memberRole: memberRole ? { id: memberRole.id, name: memberRole.name, rank: memberRole.rank } : null,
  });

  if (!memberRole && server && Number(server.owner_id) === Number(userId)) {
    try {
      await ensureOwnerMembership(serverId, userId);
      memberRole = await getServerMemberRole(serverId, userId);
    } catch (seedErr) {
      console.error('Ensure owner membership error:', seedErr);
    }
  }

  if (!memberRole && server && server.type === 'public') {
    try {
      await ensureServerRoles(serverId);
      const memberRoleId = await ensureServerRole(serverId, 'Member', 10);
      await ensureServerMember(serverId, userId, memberRoleId);
      memberRole = await getServerMemberRole(serverId, userId);
    } catch (seedErr) {
      console.error('Auto-join public server error:', seedErr);
    }
  }

  const isOwner = server && Number(server.owner_id) === Number(userId);
  if (!server || (!memberRole && !isOwner)) {
    console.warn('[ServerMessage] Access denied', {
      serverId,
      channelId,
      userId,
      hasMemberRole: !!memberRole,
      isOwner
    });
    throw new ForbiddenError('Access denied');
  }

  const messageText = hasText ? text.trim() : '';

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

    const messageId = await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN', (beginErr) => {
          if (beginErr) return reject(beginErr);
          db.run(
            'INSERT INTO server_messages (channel_id, user_id, text, reply_to_message_id, link_preview) VALUES ($1, $2, $3, $4, $5)',
            [channelId, userId, messageText, replyToMessageId || null, linkPreview ? JSON.stringify(linkPreview) : null],
            function(err) {
              if (err) {
                return db.run('ROLLBACK', () => reject(err));
              }
              const createdMessageId = this.lastID;
              if (!hasAttachments) {
                return db.run('COMMIT', (commitErr) => {
                  if (commitErr) return reject(commitErr);
                  resolve(createdMessageId);
                });
              }

              const placeholders = attachmentIds.map((_, index) => `$${index + 2}`).join(',');
              db.run(
                `UPDATE server_message_attachments SET message_id = $1 WHERE id IN (${placeholders}) AND message_id = 0`,
                [createdMessageId, ...attachmentIds],
                (updateErr) => {
                  if (updateErr) {
                    return db.run('ROLLBACK', () => reject(updateErr));
                  }
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

  // Отправляем WebSocket событие в сервер (через Redis adapter)
  const sendServerMessage = req.app.get('sendServerMessage');
  if (sendServerMessage) {
    db.get(
      `SELECT sm.*, u.name, u.username, u.avatar, u.verified
       FROM server_messages sm
       JOIN users u ON sm.user_id = u.id
       WHERE sm.id = $1`,
      [messageId],
      async (err, row) => {
        if (err || !row) return;
        let parsedPreview = null;
        if (row.link_preview) {
          try {
            parsedPreview = JSON.parse(row.link_preview);
          } catch (_e) {
            parsedPreview = null;
          }
        }
        await sendServerMessage({
          serverId,
          type: 'channel:new_message',
          data: {
            id: row.id.toString(),
            channelId: row.channel_id.toString(),
            userId: row.user_id.toString(),
            text: row.text,
            createdAt: row.created_at,
            editedAt: row.edited_at,
            replyToMessageId: row.reply_to_message_id,
            linkPreview: parsedPreview,
            author: {
              id: row.user_id.toString(),
              name: row.name,
              username: row.username,
              avatar: row.avatar,
              verified: row.verified === 1,
            },
            attachments: [],
          },
        });
      }
    );
  }
// Логируем отправку сообщения
  logger.message.sent(messageId, channelId, userId);

  res.status(201).json({
    message: 'Message sent',
    messageId
  });
}));

// 12. Загрузить файл для сообщения (pre-upload) - СТАРЫЙ РОУТ, УДАЛИТЬ
router.post('/:serverId/channels/:channelId/upload', authenticateToken, uploadFile.single('file'), (req, res) => {
  const serverId = parseInt(req.params.serverId);
  const channelId = parseInt(req.params.channelId);
  const userId = req.user.userId;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Проверяем доступ
  getServerMemberRole(serverId, userId).then(memberRole => {
    const server = db.get('SELECT owner_id FROM servers WHERE id = $1', [serverId], (err, server) => {
      const isOwner = server && Number(server.owner_id) === Number(userId);
      if (!server || (!memberRole && !isOwner)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const fileUrl = `${getPublicBaseUrl(req)}/uploads/servers/${req.file.filename}`;
      const isImage = /jpeg|jpg|png|gif|webp/.test(req.file.mimetype);

      db.run(
        `INSERT INTO server_message_attachments (message_id, type, url, mime, size, width, height) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [null, isImage ? 'image' : 'file', fileUrl, req.file.mimetype, req.file.size, null, null],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.status(201).json({
            attachmentId: this.lastID,
            url: fileUrl,
            type: isImage ? 'image' : 'file',
            mime: req.file.mimetype,
            size: req.file.size
          });
        }
      );
    });
  }).catch(err => {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error' });
  });
});

// 12.1 Загрузить файл для сервера (аналог /uploads)
router.post('/uploads', authenticateToken, uploadFile.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `${getPublicBaseUrl(req)}/uploads/servers/${req.file.filename}`;
  const isImage = /jpeg|jpg|png|gif|webp/.test(req.file.mimetype);

  // Вставляем с message_id = 0 (будет обновлено при отправке сообщения)
  db.run(
    `INSERT INTO server_message_attachments (message_id, type, url, mime, size) 
     VALUES (0, $1, $2, $3, $4)`,
    [isImage ? 'image' : 'file', fileUrl, req.file.mimetype, req.file.size],
    function(err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ error: 'Database error: ' + err.message });
      }

      res.status(201).json({
        attachmentId: this.lastID,
        url: fileUrl,
        type: isImage ? 'image' : 'file',
        mime: req.file.mimetype,
        size: req.file.size
      });
    }
  );
});

// 15. Обновить сервер (только Owner)
router.put('/:id', authenticateToken, async (req, res) => {
  const serverId = parseInt(req.params.id);
  const userId = req.user.userId;
  const { name, description, username } = req.body;

  try {
    const isOwner = await isServerOwner(serverId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only server owner can update server' });
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push(`name = $${updates.length + 1}`);
      params.push(name.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${updates.length + 1}`);
      params.push(description.trim() || null);
    }
    if (username !== undefined) {
      updates.push(`username = $${updates.length + 1}`);
      params.push(username.trim() || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(serverId);
    const query = `UPDATE servers SET ${updates.join(', ')} WHERE id = $${updates.length + 1}`;

    db.run(query, params, function(err) {
      if (err) {
        if (err.code === '23505' || err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: 'Server updated' });
    });
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 16. Удалить сервер (только Owner)
router.delete('/:id', authenticateToken, async (req, res) => {
  const serverId = parseInt(req.params.id);
  const userId = req.user.userId;

  try {
    const isOwner = await isServerOwner(serverId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only server owner can delete server' });
    }

    db.run('DELETE FROM servers WHERE id = $1', [serverId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast({
          type: 'server:deleted',
          data: { serverId }
        });
      }

      res.json({ message: 'Server deleted' });
    });
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 17. Получить участников сервера (Owner/Admin)
router.get('/:id/members', authenticateToken, requireMinRank(ROLE_RANKS.Admin), async (req, res) => {
  const serverId = parseInt(req.params.id);
  const userId = req.user.userId;

  try {
    const query = `
      SELECT u.id, u.name, u.username, u.avatar, u.verified,
             sr.id as role_id, sr.name as role_name, sr.rank
      FROM server_members sm
      JOIN users u ON sm.user_id = u.id
      JOIN server_roles sr ON sm.role_id = sr.id
      WHERE sm.server_id = $1
      ORDER BY sr.rank DESC, sm.joined_at ASC
    `;

    db.all(query, [serverId], (err, members) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        members: members.map(m => ({
          id: m.id,
          name: m.name,
          username: m.username,
          avatar: m.avatar,
          verified: m.verified === 1,
          role: {
            id: m.role_id,
            name: m.role_name,
            rank: m.rank
          }
        }))
      });
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 17.1 Получить роли сервера (Owner/Admin)
router.get('/:id/roles', authenticateToken, requireMinRank(ROLE_RANKS.Admin), async (req, res) => {
  const serverId = parseInt(req.params.id);
  const userId = req.user.userId;

  try {
    await ensureServerRoles(serverId);

    db.all(
      'SELECT id, name, rank FROM server_roles WHERE server_id = $1 ORDER BY rank DESC',
      [serverId],
      (err, roles) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          roles: roles.map((role) => ({
            id: role.id,
            name: role.name,
            rank: role.rank,
          }))
        });
      }
    );
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 18. Изменить роль участника (только Owner/Admin)
router.put('/:serverId/members/:memberId/role', 
  authenticateToken, 
  requireMinRank(ROLE_RANKS.Admin), // Централизованная проверка: Admin+
  requireCanManageMember('memberId'), // Нельзя управлять тем, у кого ранг >= твоего
  asyncHandler(async (req, res) => {
    const serverId = parseInt(req.params.serverId);
    const memberId = parseInt(req.params.memberId);
    const { roleId } = req.body;

    // Нельзя передать роль Owner
    const newRole = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM server_roles WHERE id = $1 AND server_id = $2', [roleId, serverId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!newRole) {
      throw new NotFoundError('Role not found');
    }

    if (newRole.name === 'Owner') {
      throw new ValidationError('Cannot assign Owner role via API');
    }

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE server_members SET role_id = $1 WHERE server_id = $2 AND user_id = $3',
        [roleId, serverId, memberId],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    res.json({ message: 'Role updated' });
    
    // Audit log
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    await audit.roleChanged(memberId, roleId, userId, ip);
  })
);

// 19. Кикнуть участника (только Owner/Admin/Moderator)
router.delete('/:serverId/members/:memberId',
  authenticateToken,
  requireMinRank(ROLE_RANKS.Moderator), // Централизованная проверка: Moderator+
  requireCanManageMember('memberId'), // Нельзя управлять тем, у кого ранг >= твоего
  asyncHandler(async (req, res) => {
    const serverId = parseInt(req.params.serverId);
    const memberId = parseInt(req.params.memberId);
    const userId = req.user.userId;

    // Проверяем, не владелец ли тот, кого кикаем
    const targetUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM servers WHERE id = $1 AND owner_id = $2', [serverId, memberId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (targetUser) {
      throw new ForbiddenError('Cannot kick server owner');
    }

    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM server_members WHERE server_id = $1 AND user_id = $2',
        [serverId, memberId],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    const broadcastToServer = req.app.get('broadcastToServer');
    if (broadcastToServer) {
      broadcastToServer(serverId, {
        type: 'server:member_left',
        data: { serverId, userId: memberId }
      });
    }

    res.json({ message: 'Member kicked' });
    
    // Audit log
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    await audit.memberKicked(memberId, userId, serverId, ip);
  })
);

// 20. Удалить сообщение (только автор или Owner/Admin/Moderator)
router.delete('/:serverId/channels/:channelId/messages/:messageId', authenticateToken, async (req, res) => {
  const serverId = parseInt(req.params.serverId);
  const channelId = parseInt(req.params.channelId);
  const messageId = parseInt(req.params.messageId);
  const userId = req.user.userId;
  const { scope } = req.body; // 'me' or 'all'

  try {
    // Проверяем доступ к серверу
    const memberRole = await getServerMemberRole(serverId, userId);
    const isOwner = await isServerOwner(serverId, userId);

    if (!memberRole && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Получаем сообщение
    const message = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM server_messages WHERE id = $1 AND channel_id = $2', [messageId, channelId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Проверка прав: автор или модератор+
    const isAuthor = message.user_id === userId;
    const canModerate = memberRole && memberRole.rank >= 50;

    if (!isAuthor && !canModerate && !isOwner) {
      return res.status(403).json({ error: 'Cannot delete this message' });
    }

    if (scope === 'all') {
      // Удалить для всех (только автор или модератор+)
      if (!isAuthor && !canModerate && !isOwner) {
        return res.status(403).json({ error: 'Cannot delete for everyone' });
      }

      db.run(
        'UPDATE server_messages SET deleted_at = NOW() WHERE id = $1',
        [messageId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          const broadcastToServer = req.app.get('broadcastToServer');
          if (broadcastToServer) {
            broadcastToServer(serverId, {
              type: 'channel:message_deleted',
              data: { messageId, channelId, scope: 'all' }
            });
          }

          res.json({ message: 'Message deleted for all' });
        }
      );
    } else {
      // Удалить для себя (любой участник)
      // Используем таблицу server_message_deletions для "deleted for me"
      db.run(
        `INSERT INTO server_message_deletions (message_id, user_id, deleted_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (message_id, user_id) DO UPDATE SET deleted_at = NOW()`,
        [messageId, userId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          const broadcastToServer = req.app.get('broadcastToServer');
          if (broadcastToServer) {
            broadcastToServer(serverId, {
              type: 'channel:message_deleted',
              data: { messageId, channelId, scope: 'me', userId }
            });
          }

          res.json({ message: 'Message deleted for me' });
        }
      );
    }
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 21. Удалить канал (только Owner/Admin)
router.delete('/:serverId/channels/:channelId', authenticateToken, async (req, res) => {
  const serverId = parseInt(req.params.serverId);
  const channelId = parseInt(req.params.channelId);
  const userId = req.user.userId;

  try {
    const isOwner = await isServerOwner(serverId, userId);
    const memberRole = await getServerMemberRole(serverId, userId);

    if (!isOwner && (!memberRole || memberRole.rank < 80)) {
      return res.status(403).json({ error: 'Insufficient permissions. Admin role required.' });
    }

    // Нельзя удалить последний канал
    const channelCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM server_channels WHERE server_id = $1', [serverId], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.count : 0);
      });
    });

    if (channelCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last channel' });
    }

    db.run(
      'DELETE FROM server_channels WHERE id = $1 AND server_id = $2',
      [channelId, serverId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Channel not found' });
        }

        const broadcastToServer = req.app.get('broadcastToServer');
        if (broadcastToServer) {
          broadcastToServer(serverId, {
            type: 'server:channel_deleted',
            data: { serverId, channelId }
          });
        }

        res.json({ message: 'Channel deleted' });
      }
    );
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 22. Загрузить иконку сервера (только Owner)
router.post('/:serverId/icon', authenticateToken, uploadIcon.single('icon'), async (req, res) => {
  const serverId = parseInt(req.params.serverId);
  const userId = req.user.userId;

  try {
    const isOwner = await isServerOwner(serverId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only server owner can update server icon' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const iconUrl = `${getPublicBaseUrl(req)}/uploads/servers/${req.file.filename}`;

    db.run(
      'UPDATE servers SET icon_url = $1 WHERE id = $2',
      [iconUrl, serverId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ 
          message: 'Icon uploaded',
          iconUrl
        });
      }
    );
  } catch (error) {
    console.error('Upload icon error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 23. Удалить иконку сервера (только Owner)
router.delete('/:serverId/icon', authenticateToken, async (req, res) => {
  const serverId = parseInt(req.params.serverId);
  const userId = req.user.userId;

  try {
    const isOwner = await isServerOwner(serverId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only server owner can remove server icon' });
    }

    db.run(
      'UPDATE servers SET icon_url = NULL WHERE id = $1',
      [serverId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Icon removed' });
      }
    );
  } catch (error) {
    console.error('Remove icon error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
