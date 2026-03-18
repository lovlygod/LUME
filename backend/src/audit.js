/**
 * РЎРёСЃС‚РµРјР° Р°СѓРґРёС‚Р° РґР»СЏ LUME Backend
 * Р›РѕРіРёСЂРѕРІР°РЅРёРµ РєСЂРёС‚РёС‡РµСЃРєРё РІР°Р¶РЅС‹С… СЃРѕР±С‹С‚РёР№ РґР»СЏ Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё Рё РѕС‚Р»Р°РґРєРё
 */

const db = require('./db');
const { logger } = require('./logger');

// ==================== РўРёРїС‹ СЃРѕР±С‹С‚РёР№ РґР»СЏ Р°СѓРґРёС‚Р° ====================

const AUDIT_EVENTS = {
  // РђСѓС‚РµРЅС‚РёС„РёРєР°С†РёСЏ
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILED: 'auth.login.failed',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_REGISTER: 'auth.register',
  AUTH_PASSWORD_CHANGED: 'auth.password.changed',
  AUTH_TOKEN_REFRESHED: 'auth.token.refreshed',
  
  // РЈРґР°Р»РµРЅРёРµ РґР°РЅРЅС‹С…
  USER_DELETED: 'user.deleted',
  POST_DELETED: 'post.deleted',
  MESSAGE_DELETED: 'message.deleted',
  SERVER_MESSAGE_DELETED: 'server.message.deleted',
  CHANNEL_DELETED: 'channel.deleted',
  SERVER_DELETED: 'server.deleted',
  
  // РР·РјРµРЅРµРЅРёРµ СЂРѕР»РµР№ Рё РїСЂР°РІ
  ROLE_CHANGED: 'role.changed',
  ROLE_CREATED: 'role.created',
  ROLE_DELETED: 'role.deleted',
  PERMISSIONS_CHANGED: 'permissions.changed',
  
  // РЎРµСЂРІРµСЂС‹
  SERVER_CREATED: 'server.created',
  SERVER_UPDATED: 'server.updated',
  MEMBER_KICKED: 'member.kicked',
  MEMBER_BANNED: 'member.banned',
  MEMBER_UNBANNED: 'member.unbanned',
  JOIN_REQUEST_APPROVED: 'join_request.approved',
  JOIN_REQUEST_REJECTED: 'join_request.rejected',
  
  // РњРѕРґРµСЂР°С†РёСЏ
  CONTENT_REPORTED: 'content.reported',
  CONTENT_REMOVED: 'content.removed',
  USER_WARNED: 'user.warned',
  USER_MUTED: 'user.muted',
  USER_UNMUTED: 'user.unmuted',
  
  // Р’РµСЂРёС„РёРєР°С†РёСЏ
  VERIFICATION_REQUESTED: 'verification.requested',
  VERIFICATION_APPROVED: 'verification.approved',
  VERIFICATION_REJECTED: 'verification.rejected',
  
  // Р¤Р°Р№Р»С‹
  FILE_UPLOADED: 'file.uploaded',
  FILE_DELETED: 'file.deleted',
  
  // РђРґРјРёРЅ РґРµР№СЃС‚РІРёСЏ
  ADMIN_ACTION: 'admin.action',
  SETTINGS_CHANGED: 'settings.changed',
};

// ==================== Database Functions ====================

/**
 * РЎРѕР·РґР°С‚СЊ С‚Р°Р±Р»РёС†Сѓ audit_logs
 */
const createAuditTable = () => Promise.resolve();

/**
 * Р—Р°РїРёСЃР°С‚СЊ СЃРѕР±С‹С‚РёРµ РІ audit log
 */
const logAuditEvent = (eventType, userId, options = {}) => {
  const {
    targetId = null,
    targetType = null,
    ipAddress = null,
    userAgent = null,
    details = {},
  } = options;
  
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO audit_logs (event_type, user_id, target_id, target_type, ip_address, user_agent, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    const params = [
      eventType,
      userId,
      targetId,
      targetType,
      ipAddress,
      userAgent,
      JSON.stringify(details),
    ];
    
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, eventType, userId, targetId, targetType });
      }
    });
  });
};

/**
 * РџРѕР»СѓС‡РёС‚СЊ audit Р»РѕРіРё СЃ С„РёР»СЊС‚СЂР°С†РёРµР№
 */
const getAuditLogs = (filters = {}) => {
  const {
    eventType,
    userId,
    targetId,
    targetType,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = filters;
  
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    
    if (eventType) {
      query += ` AND event_type = $${params.length + 1}`;
      params.push(eventType);
    }
    
    if (userId) {
      query += ` AND user_id = $${params.length + 1}`;
      params.push(userId);
    }
    
    if (targetId) {
      query += ` AND target_id = $${params.length + 1}`;
      params.push(targetId);
    }
    
    if (targetType) {
      query += ` AND target_type = $${params.length + 1}`;
      params.push(targetType);
    }
    
    if (startDate) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else {
        // РџР°СЂСЃРёРј JSON details
        const logs = rows.map(row => ({
          ...row,
          details: row.details ? JSON.parse(row.details) : null,
        }));
        resolve(logs);
      }
    });
  });
};

/**
 * РћС‡РёСЃС‚РёС‚СЊ СЃС‚Р°СЂС‹Рµ audit Р»РѕРіРё (СЃС‚Р°СЂС€Рµ 90 РґРЅРµР№)
 */
const cleanupOldAuditLogs = () => {
  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days'",
      (err, result) => {
        if (err) reject(err);
        else {
          logger.info('Audit logs cleanup', { deleted: result.changes });
          resolve(result.changes);
        }
      }
    );
  });
};

// ==================== Audit Middleware ====================

/**
 * Middleware РґР»СЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРіРѕ Р»РѕРіРёСЂРѕРІР°РЅРёСЏ РґРµР№СЃС‚РІРёР№
 */
const createAuditMiddleware = (eventType, getDetailsFn) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = (data) => {
      // Р›РѕРіРёСЂСѓРµРј СѓСЃРїРµС€РЅРѕРµ РґРµР№СЃС‚РІРёРµ
      try {
        const userId = req.user?.userId;
        const details = getDetailsFn ? getDetailsFn(req, res, data) : {};
        
        logAuditEvent(eventType, userId, {
          targetId: details.targetId,
          targetType: details.targetType,
          ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
          userAgent: req.get('user-agent'),
          details,
        }).catch(err => {
          logger.error('Failed to write audit log', { error: err.message });
        });
      } catch (error) {
        logger.error('Audit middleware error', { error: error.message });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

// ==================== Convenience Functions ====================

const audit = {
  // РђСѓС‚РµРЅС‚РёС„РёРєР°С†РёСЏ
  login: (userId, success, ip, userAgent) => {
    return logAuditEvent(
      success ? AUDIT_EVENTS.AUTH_LOGIN_SUCCESS : AUDIT_EVENTS.AUTH_LOGIN_FAILED,
      userId,
      { ipAddress: ip, userAgent, details: { success } }
    );
  },
  
  logout: (userId, ip) => {
    return logAuditEvent(AUDIT_EVENTS.AUTH_LOGOUT, userId, { ipAddress: ip });
  },
  
  register: (userId, email, ip) => {
    return logAuditEvent(AUDIT_EVENTS.AUTH_REGISTER, userId, {
      ipAddress: ip,
      details: { email },
    });
  },
  
  // РЈРґР°Р»РµРЅРёРµ
  userDeleted: (userId, deletedBy, ip) => {
    return logAuditEvent(AUDIT_EVENTS.USER_DELETED, deletedBy, {
      targetId: userId,
      targetType: 'user',
      ipAddress: ip,
    });
  },
  
  postDeleted: (postId, deletedBy, userId, ip) => {
    return logAuditEvent(AUDIT_EVENTS.POST_DELETED, deletedBy, {
      targetId: postId,
      targetType: 'post',
      ipAddress: ip,
      details: { originalAuthorId: userId },
    });
  },
  
  messageDeleted: (messageId, deletedBy, scope, ip) => {
    return logAuditEvent(AUDIT_EVENTS.MESSAGE_DELETED, deletedBy, {
      targetId: messageId,
      targetType: 'message',
      ipAddress: ip,
      details: { scope },
    });
  },
  
  // Р РѕР»Рё
  roleChanged: (targetUserId, newRoleId, changedBy, ip) => {
    return logAuditEvent(AUDIT_EVENTS.ROLE_CHANGED, changedBy, {
      targetId: targetUserId,
      targetType: 'user',
      ipAddress: ip,
      details: { newRoleId },
    });
  },
  
  // РЎРµСЂРІРµСЂС‹
  serverCreated: (serverId, userId, name, ip) => {
    return logAuditEvent(AUDIT_EVENTS.SERVER_CREATED, userId, {
      targetId: serverId,
      targetType: 'server',
      ipAddress: ip,
      details: { name },
    });
  },
  
  serverDeleted: (serverId, userId, name, ip) => {
    return logAuditEvent(AUDIT_EVENTS.SERVER_DELETED, userId, {
      targetId: serverId,
      targetType: 'server',
      ipAddress: ip,
      details: { name },
    });
  },
  
  memberKicked: (memberId, kickedBy, serverId, ip) => {
    return logAuditEvent(AUDIT_EVENTS.MEMBER_KICKED, kickedBy, {
      targetId: memberId,
      targetType: 'user',
      ipAddress: ip,
      details: { serverId },
    });
  },
  
  memberBanned: (memberId, bannedBy, serverId, reason, ip) => {
    return logAuditEvent(AUDIT_EVENTS.MEMBER_BANNED, bannedBy, {
      targetId: memberId,
      targetType: 'user',
      ipAddress: ip,
      details: { serverId, reason },
    });
  },
  
  // РњРѕРґРµСЂР°С†РёСЏ
  contentReported: (contentId, reporterId, contentType, reason, ip) => {
    return logAuditEvent(AUDIT_EVENTS.CONTENT_REPORTED, reporterId, {
      targetId: contentId,
      targetType: contentType,
      ipAddress: ip,
      details: { reason },
    });
  },
  
  contentRemoved: (contentId, removedBy, contentType, reason, ip) => {
    return logAuditEvent(AUDIT_EVENTS.CONTENT_REMOVED, removedBy, {
      targetId: contentId,
      targetType: contentType,
      ipAddress: ip,
      details: { reason },
    });
  },
  
  // Р’РµСЂРёС„РёРєР°С†РёСЏ
  verificationRequested: (userId, reason, ip) => {
    return logAuditEvent(AUDIT_EVENTS.VERIFICATION_REQUESTED, userId, {
      ipAddress: ip,
      details: { reason },
    });
  },
  
  verificationApproved: (userId, approvedBy, ip) => {
    return logAuditEvent(AUDIT_EVENTS.VERIFICATION_APPROVED, approvedBy, {
      targetId: userId,
      targetType: 'user',
      ipAddress: ip,
    });
  },
  
  verificationRejected: (userId, rejectedBy, reason, ip) => {
    return logAuditEvent(AUDIT_EVENTS.VERIFICATION_REJECTED, rejectedBy, {
      targetId: userId,
      targetType: 'user',
      ipAddress: ip,
      details: { reason },
    });
  },
};

// ==================== Auto-cleanup ====================

// РћС‡РёС‰Р°РµРј СЃС‚Р°СЂС‹Рµ audit Р»РѕРіРё СЂР°Р· РІ СЃСѓС‚РєРё
setInterval(() => {
  cleanupOldAuditLogs().catch(err => {
    logger.error('Audit cleanup failed', { error: err.message });
  });
}, 24 * 60 * 60 * 1000);

// ==================== Initialization ====================

// РЎРѕР·РґР°С‘Рј С‚Р°Р±Р»РёС†Сѓ РїСЂРё Р·Р°РіСЂСѓР·РєРµ
createAuditTable().catch(err => {
  logger.error('Failed to create audit table', { error: err.message });
});

// ==================== Exports ====================

module.exports = {
  AUDIT_EVENTS,
  logAuditEvent,
  getAuditLogs,
  cleanupOldAuditLogs,
  createAuditMiddleware,
  audit,
};
