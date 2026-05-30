module.exports = function registerMessengerRoutes(router, deps) {
  const {
    authenticateToken,
    asyncHandler,
    db,
    ValidationError,
    sanitizeText,
  } = deps;

  // Chat list for current user
  router.get('/chats', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const chats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT c.id, c.type, c.title, c.avatar, c.owner_id, c.is_public, c.is_private,
                c.username, c.invite_token, c.public_number, c.created_at, c.project_id,
                cm.role,
                lm.text AS last_message_text,
                lm.type AS last_message_type,
                COALESCE(lm.created_at, c.created_at) AS last_message_at,
                COALESCE(unread.unread_count, 0) AS unread_count
         FROM chat_members cm
         JOIN chats c ON c.id = cm.chat_id
         LEFT JOIN LATERAL (
           SELECT m.text, m.type, m.created_at
           FROM messages m
           WHERE m.chat_id = c.id
             AND m.deleted_for_all_at IS NULL
           ORDER BY m.created_at DESC
           LIMIT 1
         ) lm ON true
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::int AS unread_count
           FROM messages m2
           LEFT JOIN chat_reads cr ON cr.chat_id = c.id AND cr.user_id = cm.user_id
           WHERE m2.chat_id = c.id
             AND m2.sender_id <> cm.user_id
             AND m2.deleted_for_all_at IS NULL
             AND (cr.last_read_message_id IS NULL OR m2.id > cr.last_read_message_id)
         ) unread ON true
         WHERE cm.user_id = $1
         ORDER BY last_message_at DESC`,
        [userId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });

    const chatIds = chats.map((c) => c.id);
    let membersByChat = new Map();

    if (chatIds.length > 0) {
      const placeholders = chatIds.map((_, i) => `$${i + 1}`).join(',');
      const members = await new Promise((resolve, reject) => {
        db.all(
          `SELECT cm.chat_id, cm.user_id, cm.role, u.name, u.username, u.avatar, u.verified
           FROM chat_members cm
           JOIN users u ON u.id = cm.user_id
           WHERE cm.chat_id IN (${placeholders})`,
          chatIds,
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      });

      membersByChat = (members || []).reduce((acc, row) => {
        const key = String(row.chat_id);
        const list = acc.get(key) || [];
        list.push({
          id: String(row.user_id),
          role: row.role,
          name: row.name,
          username: row.username,
          avatar: row.avatar,
          verified: !!row.verified,
        });
        acc.set(key, list);
        return acc;
      }, new Map());
    }

    // Get project names for chats with project_id
    const projectIds = [...new Set(chats.filter(c => c.project_id).map(c => c.project_id))];
    let projectNames = new Map();
    if (projectIds.length > 0) {
      const placeholders = projectIds.map((_, i) => `$${i + 1}`).join(',');
      const projects = await new Promise((resolve, reject) => {
        db.all(
          `SELECT id, name FROM projects WHERE id IN (${placeholders})`,
          projectIds,
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      });
      projects.forEach(p => projectNames.set(p.id, p.name));
    }

    const payload = chats.map((chat) => ({
      id: String(chat.id),
      type: chat.type,
      title: chat.title,
      avatar: chat.avatar,
      ownerId: chat.owner_id ? String(chat.owner_id) : null,
      isPublic: !!chat.is_public,
      isPrivate: !!chat.is_private,
      username: chat.username,
      inviteToken: chat.invite_token,
      publicNumber: chat.public_number ? String(chat.public_number) : null,
      role: chat.role,
      members: membersByChat.get(String(chat.id)) || [],
      lastMessage: chat.last_message_text || '',
      lastMessageType: chat.last_message_type || 'text',
      timestamp: chat.last_message_at,
      unread: Number(chat.unread_count || 0),
      projectId: chat.project_id || null,
      projectName: chat.project_id ? projectNames.get(chat.project_id) || null : null,
    }));

    res.json({ chats: payload });
  }));

  // Notifications list
  router.get('/notifications', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const unreadOnly = String(req.query.unreadOnly || 'false').toLowerCase() === 'true';
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 200);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const notifications = await new Promise((resolve, reject) => {
      db.all(
        `SELECT n.id, n.user_id, n.type, n.entity_id, n.actor_id,
                COALESCE(n.actor_username, au.username) AS actor_username,
                COALESCE(n.actor_avatar, au.avatar) AS actor_avatar,
                n.target_id, n.target_type, n.message, n.url, n.read, n.created_at
         FROM notifications n
         LEFT JOIN users au ON au.id = n.actor_id
         WHERE n.user_id = $1
           AND ($2::boolean = false OR read = 0)
         ORDER BY n.created_at DESC
         LIMIT $3 OFFSET $4`,
        [userId, unreadOnly, limit, offset],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });

    res.json({
      notifications: notifications.map((n) => ({
        id: String(n.id),
        userId: String(n.user_id),
        type: n.type,
        entityId: n.entity_id ? String(n.entity_id) : null,
        actorId: n.actor_id ? String(n.actor_id) : null,
        actorUsername: n.actor_username,
        actorAvatar: n.actor_avatar,
        targetId: n.target_id ? String(n.target_id) : null,
        targetType: n.target_type,
        message: n.message,
        url: n.url,
        read: !!n.read,
        createdAt: n.created_at,
      })),
      limit,
      offset,
    });
  }));

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

  // Delete message (for me or for all)
  router.delete('/messages/:messageId', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const messageId = req.params.messageId;
    const { scope } = req.query;

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
        db.run(
          'UPDATE messages SET deleted_for_all_at = NOW(), deleted_for_all_by = $1 WHERE id = $2',
          [userId, messageId],
          function(err2) {
            if (err2) {
              return res.status(500).json({ error: 'Database error' });
            }

            const sendChatMessage = req.app.get('sendChatMessage');
            if (sendChatMessage) {
              sendChatMessage({
                chatId: message.chat_id ? String(message.chat_id) : null,
                type: 'message:deleted',
                data: { messageId: messageId.toString(), scope: 'all', byUserId: userId.toString() }
              });
            }

            res.json({ message: 'Message deleted for everyone', messageId: messageId.toString(), scope: 'all' });
          }
        );
      } else {
        db.get(
          'SELECT * FROM message_deletions WHERE message_id = $1 AND user_id = $2',
          [messageId, userId],
          (err2, deletion) => {
            if (err2) {
              return res.status(500).json({ error: 'Database error' });
            }
            if (deletion) {
              return res.status(400).json({ error: 'Already deleted for you' });
            }

            db.run('INSERT INTO message_deletions (message_id, user_id) VALUES ($1, $2)', [messageId, userId], (err3) => {
              if (err3) {
                return res.status(500).json({ error: 'Database error' });
              }
              res.json({ message: 'Message deleted for you', messageId: messageId.toString(), scope: 'me' });
            });
          }
        );
      }
    });
  });

  router.post('/notifications/read', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { notificationId, markAllAsRead = false } = req.body;

    if (markAllAsRead) {
      await new Promise((resolve, reject) => {
        db.run('UPDATE notifications SET read = 1 WHERE user_id = $1 AND read = 0', [userId], (err) => {
          if (err) reject(err); else resolve();
        });
      });

      res.json({ message: 'All notifications marked as read' });
      return;
    }

    if (!notificationId) {
      throw new ValidationError('Notification ID is required');
    }

    const result = await new Promise((resolve, reject) => {
      db.run('UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2', [notificationId, userId], function(err) {
        if (err) reject(err); else resolve(this);
      });
    });

    if (result.changes === 0) {
      throw new ValidationError('Notification not found or already read');
    }

    res.json({ message: 'Notification marked as read' });
  }));

  router.post('/notifications/:id/read', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const notificationId = req.params.id;

    const result = await new Promise((resolve, reject) => {
      db.run('UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2', [notificationId, userId], function(err) {
        if (err) reject(err); else resolve(this);
      });
    });

    if (result.changes === 0) {
      throw new ValidationError('Notification not found or already read');
    }

    res.json({ message: 'Notification marked as read' });
  }));

  router.post('/messages/:messageId/reaction', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const messageId = parseInt(req.params.messageId);
    const { reaction } = req.body;

    if (!messageId || !Number.isFinite(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    db.get(
      'SELECT id FROM chat_members cm JOIN messages m ON m.chat_id = cm.chat_id WHERE m.id = $1 AND cm.user_id = $2',
      [messageId, userId],
      (err, membership) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!membership) return res.status(403).json({ error: 'Not a member of this chat' });

        db.get('SELECT id FROM message_reactions WHERE message_id = $1 AND user_id = $2', [messageId, userId], (err2, existing) => {
          if (err2) return res.status(500).json({ error: 'Database error' });

          if (existing) {
            db.run('DELETE FROM message_reactions WHERE id = $1', [existing.id], (err3) => {
              if (err3) return res.status(500).json({ error: 'Database error' });
              res.json({ reacted: false, reaction: null });
            });
          } else {
            db.run(
              'INSERT INTO message_reactions (message_id, user_id, reaction) VALUES ($1, $2, $3) RETURNING id',
              [messageId, userId, reaction || 'heart'],
              (err3) => {
                if (err3) return res.status(500).json({ error: 'Database error' });
                res.json({ reacted: true, reaction: reaction || 'heart' });
              }
            );
          }
        });
      }
    );
  });

  router.get('/messages/:messageId/reactions', authenticateToken, (req, res) => {
    const messageId = parseInt(req.params.messageId);

    db.all(
      `SELECT mr.reaction, mr.user_id, u.username, u.name FROM message_reactions mr
       JOIN users u ON u.id = mr.user_id
       WHERE mr.message_id = $1`,
      [messageId],
      (err, reactions) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ reactions: (reactions || []).map(r => ({
          reaction: r.reaction,
          userId: r.user_id.toString(),
          username: r.username,
          name: r.name,
        }))});
      }
    );
  });

  router.post('/chats', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { type, title, isPublic, isPrivate, username, userIds, userId: targetUserId } = req.body;

    if (!type || !['private', 'group', 'channel'].includes(type)) {
      return res.status(400).json({ error: 'Invalid chat type' });
    }

    const isPrivateChat = type === 'private';
    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    const MAX_CHAT_TITLE_LENGTH = 128;

    if (!isPrivateChat && normalizedTitle.length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!isPrivateChat && normalizedTitle.length > MAX_CHAT_TITLE_LENGTH) {
      return res.status(400).json({ error: `Title too long (max ${MAX_CHAT_TITLE_LENGTH} chars)` });
    }

    const safeTitle = !isPrivateChat ? sanitizeText(normalizedTitle) : null;

    const publicGroup = isPublic && username;
    if (publicGroup && !/^[a-z0-9_]{5,}$/i.test(username)) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    let chatMembers = [];
    if (isPrivateChat) {
      const targetIds = Array.isArray(userIds)
        ? userIds
        : targetUserId
        ? [targetUserId]
        : [];

      const otherUserIds = [...new Set((targetIds || []).map((id) => String(id).trim()))]
        .filter(Boolean)
        .filter((id) => id !== String(userId));

      if (otherUserIds.length !== 1) {
        return res.status(400).json({ error: 'Private chat requires exactly one other user' });
      }

      chatMembers = [String(userId), otherUserIds[0]];

      const existingPrivateChat = await db.query(
        `SELECT c.id
         FROM chats c
         JOIN chat_members cm1 ON cm1.chat_id = c.id
         JOIN chat_members cm2 ON cm2.chat_id = c.id
         WHERE c.type = 'private'
           AND cm1.user_id = $1
           AND cm2.user_id = $2
         LIMIT 1`,
        [chatMembers[0], chatMembers[1]]
      );

      if (existingPrivateChat.rows.length > 0) {
        return res.status(200).json({ chatId: String(existingPrivateChat.rows[0].id), existing: true });
      }
    }

    const { rows } = await db.query(
        `INSERT INTO chats (type, title, is_public, is_private, username, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [type, safeTitle, Boolean(isPublic), Boolean(isPrivate) || isPrivateChat, username || null, userId]
      );
    const chatId = rows[0].id;

    await db.query(
      'INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, $3)',
      [chatId, userId, 'owner']
    );

    if (isPrivateChat) {
      await db.query(
        'INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, $3)',
        [chatId, chatMembers[1], 'member']
      );
    }

    res.status(201).json({ chatId: chatId.toString(), existing: false });
  }));

  // Bulk delete messages
  router.post('/chats/:chatId/messages/bulk-delete', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const chatId = req.params.chatId;
    const { messageIds, scope } = req.body || {};

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      throw new ValidationError('Message IDs are required');
    }

    if (messageIds.length > 100) {
      throw new ValidationError('Maximum 100 messages can be deleted at once');
    }

    if (!['me', 'all'].includes(scope)) {
      throw new ValidationError('Scope must be "me" or "all"');
    }

    const userIdNum = parseInt(userId, 10);
    const chatIdNum = parseInt(chatId, 10);

    const memberQuery = `SELECT cm.role, c.type FROM chat_members cm JOIN chats c ON c.id = cm.chat_id WHERE cm.chat_id = $1 AND cm.user_id = $2`;
    const memberResult = await db.query(memberQuery, [chatIdNum, userIdNum]);
    const membership = memberResult.rows[0];

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const isGroupChat = membership.type !== 'private';
    const messageIdsNum = messageIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    if (messageIdsNum.length === 0) {
      throw new ValidationError('Invalid message IDs');
    }

    const placeholders = messageIdsNum.map((_, i) => `$${i + 2}`).join(',');
    const userIdStr = String(userIdNum);

    if (scope === 'all') {
      if (isGroupChat) {
        const messagesResult = await db.query(`SELECT id::bigint as id, sender_id::bigint as sender_id FROM messages WHERE id::bigint = ANY($1::bigint[])`, [[...messageIdsNum]]);
        const myMessages = messagesResult.rows.filter(m => String(m.sender_id) === userIdStr);
        if (myMessages.length === 0) {
          return res.status(403).json({ error: 'You can only delete your own messages' });
        }
        const myIds = myMessages.map(m => Number(m.id));
        await db.query(`UPDATE messages SET deleted_for_all_at = NOW(), deleted_for_all_by = $1::bigint WHERE id::bigint = ANY($2::bigint[])`, [userIdNum, myIds]);
        const sendChatMessage = req.app.get('sendChatMessage');
        if (sendChatMessage) {
          myIds.forEach(id => sendChatMessage({ chatId: String(chatIdNum), type: 'message:deleted', data: { messageId: String(id), scope: 'all', byUserId: userIdStr } }));
        }
        res.json({ deleted: myIds.length, scope: 'all' });
      } else {
        await db.query(`UPDATE messages SET deleted_for_all_at = NOW(), deleted_for_all_by = $1::bigint WHERE id::bigint = ANY($2::bigint[])`, [userIdNum, messageIdsNum]);
        const sendChatMessage = req.app.get('sendChatMessage');
        if (sendChatMessage) {
          messageIdsNum.forEach(id => sendChatMessage({ chatId: String(chatIdNum), type: 'message:deleted', data: { messageId: String(id), scope: 'all', byUserId: userIdStr } }));
        }
        res.json({ deleted: messageIdsNum.length, scope: 'all' });
      }
    } else {
      for (const msgId of messageIdsNum) {
        const existingDeletion = await db.query('SELECT 1 FROM message_deletions WHERE message_id::bigint = $1 AND user_id::bigint = $2', [msgId, userIdNum]);
        if (existingDeletion.rows.length === 0) {
          await db.query('INSERT INTO message_deletions (message_id, user_id) VALUES ($1::bigint, $2::bigint)', [msgId, userIdNum]);
        }
      }
      res.json({ deleted: messageIdsNum.length, scope: 'me' });
    }
  }));
};
