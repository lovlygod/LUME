/**
 * Централизованная система логирования для LUME Backend
 * Структурированные логи с поддержкой разных уровней
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

const currentLevel = process.env.LOG_LEVEL || LOG_LEVELS.INFO;

/**
 * Проверка, нужно ли логировать сообщение данного уровня
 */
const shouldLog = (level) => {
  const levels = [LOG_LEVELS.ERROR, LOG_LEVELS.WARN, LOG_LEVELS.INFO, LOG_LEVELS.DEBUG];
  const currentIndex = levels.indexOf(level);
  const thresholdIndex = levels.indexOf(currentLevel);
  return currentIndex <= thresholdIndex;
};

/**
 * Форматирование лог-сообщения
 */
const formatLog = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  return logEntry;
};

/**
 * Вывод лога
 */
const log = (level, message, meta = {}) => {
  if (!shouldLog(level)) return;

  const logEntry = formatLog(level, message, meta);

  if (process.env.NODE_ENV === 'production') {
    // В production выводим JSON для парсинга внешними системами
    console.info(JSON.stringify(logEntry));
  } else {
    // В development выводим красиво
    const color = {
      [LOG_LEVELS.ERROR]: '\x1b[31m', // red
      [LOG_LEVELS.WARN]: '\x1b[33m',  // yellow
      [LOG_LEVELS.INFO]: '\x1b[36m',  // cyan
      [LOG_LEVELS.DEBUG]: '\x1b[35m', // magenta
    }[level] || '\x1b[0m';

    const reset = '\x1b[0m';
    const time = logEntry.timestamp.split('T')[1].split('.')[0];
    
    console.info(`${color}[${time}] [${level.toUpperCase()}]${reset} ${message}`);
    
    if (Object.keys(meta).length > 0) {
      console.info('  ', meta);
    }
  }
};

// ==================== Public API ====================

const logger = {
  error: (message, meta) => log(LOG_LEVELS.ERROR, message, meta),
  warn: (message, meta) => log(LOG_LEVELS.WARN, message, meta),
  info: (message, meta) => log(LOG_LEVELS.INFO, message, meta),
  debug: (message, meta) => log(LOG_LEVELS.DEBUG, message, meta),

  // Специализированные логи для различных событий
  auth: {
    login: (userId, success, ip) => {
      logger.info(success ? 'User logged in' : 'Login failed', {
        userId,
        success,
        ip,
        category: 'auth',
        action: 'login',
      });
    },
    logout: (userId, ip) => {
      logger.info('User logged out', { userId, ip, category: 'auth', action: 'logout' });
    },
    register: (userId, email, ip) => {
      logger.info('New user registered', { userId, email, ip, category: 'auth', action: 'register' });
    },
    tokenRefresh: (userId, success) => {
      logger.info(success ? 'Token refreshed' : 'Token refresh failed', {
        userId,
        success,
        category: 'auth',
        action: 'token_refresh',
      });
    },
  },

  // Логи для серверов (communities)
  server: {
    created: (serverId, userId, name) => {
      logger.info('Server created', { serverId, userId, name, category: 'server', action: 'create' });
    },
    deleted: (serverId, userId, name) => {
      logger.info('Server deleted', { serverId, userId, name, category: 'server', action: 'delete' });
    },
    memberJoined: (serverId, userId) => {
      logger.info('User joined server', { serverId, userId, category: 'server', action: 'join' });
    },
    memberLeft: (serverId, userId) => {
      logger.info('User left server', { serverId, userId, category: 'server', action: 'leave' });
    },
    memberKicked: (serverId, userId, kickedBy) => {
      logger.warn('User kicked from server', { serverId, userId, kickedBy, category: 'server', action: 'kick' });
    },
    roleChanged: (serverId, userId, newRoleId, changedBy) => {
      logger.info('User role changed', { serverId, userId, newRoleId, changedBy, category: 'server', action: 'role_change' });
    },
    channelCreated: (channelId, serverId, userId, name) => {
      logger.info('Channel created', { channelId, serverId, userId, name, category: 'server', action: 'channel_create' });
    },
  },

  // Логи для сообщений
  message: {
    sent: (messageId, channelId, userId) => {
      logger.debug('Message sent', { messageId, channelId, userId, category: 'message', action: 'send' });
    },
    deleted: (messageId, userId, scope) => {
      logger.info('Message deleted', { messageId, userId, scope, category: 'message', action: 'delete' });
    },
  },

  // Логи для постов
  post: {
    created: (postId, userId) => {
      logger.debug('Post created', { postId, userId, category: 'post', action: 'create' });
    },
    deleted: (postId, userId) => {
      logger.info('Post deleted', { postId, userId, category: 'post', action: 'delete' });
    },
    reported: (postId, reporterId, reason) => {
      logger.warn('Post reported', { postId, reporterId, reason, category: 'post', action: 'report' });
    },
  },

  // Логи для модерации
  moderation: {
    userBanned: (userId, bannedBy, reason) => {
      logger.warn('User banned', { userId, bannedBy, reason, category: 'moderation', action: 'ban' });
    },
    userUnbanned: (userId, unbannedBy) => {
      logger.info('User unbanned', { userId, unbannedBy, category: 'moderation', action: 'unban' });
    },
    contentRemoved: (contentType, contentId, reason) => {
      logger.warn('Content removed', { contentType, contentId, reason, category: 'moderation', action: 'remove' });
    },
  },

  // Логи для ошибок
  errors: {
    database: (error, query) => {
      logger.error('Database error', { error: error.message, query, category: 'error', type: 'database' });
    },
    validation: (error, path, body) => {
      logger.warn('Validation error', { error: error.message, path, body, category: 'error', type: 'validation' });
    },
    unhandled: (error, req) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        path: req?.path,
        method: req?.method,
        userId: req?.user?.userId,
        category: 'error',
        type: 'unhandled',
      });
    },
  },
};

// ==================== Audit Log (для важных событий) ====================

/**
 * Аудит лог для критически важных событий
 * Эти логи можно отправлять в отдельное хранилище
 */
const auditLog = {
  adminAction: (adminId, action, targetId, details) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'AUDIT',
      adminId,
      action,
      targetId,
      details,
    };

    // В production можно сохранять в отдельную таблицу audit_logs
    console.info('🔒 AUDIT:', JSON.stringify(logEntry));
  },

  securityEvent: (eventType, userId, details) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'SECURITY',
      eventType,
      userId,
      details,
    };

    console.info('🛡️ SECURITY:', JSON.stringify(logEntry));
  },
};

module.exports = {
  logger,
  auditLog,
  LOG_LEVELS,
};


