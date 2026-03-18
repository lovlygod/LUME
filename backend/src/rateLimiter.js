/**
 * Rate Limiting Middleware с сохранением в БД
 * Защита от brute-force атак на логин/регистрацию
 */

const db = require('./db');
const { TooManyRequestsError } = require('./errors');
const { logger } = require('./logger');

// ==================== Конфигурация ====================

const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,           // Максимум попыток
    windowMs: 15 * 60 * 1000, // Окно времени (15 минут)
    blockDurationMs: 30 * 60 * 1000, // Длительность блокировки (30 минут)
  },
  register: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 час
    blockDurationMs: 60 * 60 * 1000, // 1 час
  },
  forgot_password: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000,
  },
  verification_request: {
    maxAttempts: 5,
    windowMs: 24 * 60 * 60 * 1000, // 24 часа
    blockDurationMs: 24 * 60 * 60 * 1000,
  },
};

// ==================== Database Functions ====================

/**
 * Получить запись о rate limit для IP
 */
const getRateLimitRecord = (ip, action) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM rate_limits WHERE ip = $1 AND action = $2',
      [ip, action],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

/**
 * Создать или обновить запись о попытке
 */
const updateRateLimitRecord = (ip, action, attempts, blockedUntil = null) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO rate_limits (ip, action, attempts, blocked_until, first_attempt_at, last_attempt_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT(ip, action)
       DO UPDATE SET
         attempts = EXCLUDED.attempts,
         blocked_until = EXCLUDED.blocked_until,
         last_attempt_at = NOW()`,
      [ip, action, attempts, blockedUntil],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });
};

/**
 * Увеличить счётчик попыток
 */
const incrementAttempts = (ip, action) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE rate_limits
       SET attempts = attempts + 1,
           last_attempt_at = NOW()
       WHERE ip = $1 AND action = $2`,
      [ip, action],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });
};

/**
 * Сбросить счётчик попыток
 */
const resetRateLimit = (ip, action) => {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM rate_limits WHERE ip = $1 AND action = $2',
      [ip, action],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

/**
 * Очистить старые записи (старше 24 часов)
 */
const cleanupOldRecords = () => {
  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM rate_limits WHERE last_attempt_at < NOW() - INTERVAL '24 hours'",
      function(err) {
        if (err) {
          logger.error('Rate limit cleanup failed', { error: err.message });
          reject(err);
        } else {
          logger.info('Rate limits cleanup', { deleted: this.changes || 0 });
          resolve(this.changes || 0);
        }
      }
    );
  });
};

// ==================== Rate Limit Logic ====================

/**
 * Проверить, заблокирован ли IP
 */
const isBlocked = (record, config) => {
  if (!record || !record.blocked_until) return false;
  
  const blockedUntil = new Date(record.blocked_until).getTime();
  const now = Date.now();
  
  return now < blockedUntil;
};

/**
 * Проверить, истекло ли окно времени
 */
const isWindowExpired = (record, config) => {
  if (!record) return true;
  
  const lastAttempt = new Date(record.last_attempt_at).getTime();
  const now = Date.now();
  
  return (now - lastAttempt) > config.windowMs;
};

/**
 * Основная функция проверки rate limit
 */
const checkRateLimit = async (ip, action) => {
  const config = RATE_LIMIT_CONFIG[action];
  
  if (!config) {
    throw new Error(`Unknown rate limit action: ${action}`);
  }
  
  // Получаем запись
  const record = await getRateLimitRecord(ip, action);
  
  // Проверяем, заблокирован ли IP
  if (record && isBlocked(record, config)) {
    const blockedUntil = new Date(record.blocked_until);
    const retryAfter = Math.ceil((blockedUntil.getTime() - Date.now()) / 1000);
    
    logger.warn('Rate limit blocked', {
      ip,
      action,
      attempts: record.attempts,
      retryAfter,
    });
    
    throw new TooManyRequestsError(
      `Too many attempts. Try again in ${Math.floor(retryAfter / 60)} minutes.`,
      retryAfter
    );
  }
  
  // Проверяем, истекло ли окно времени
  if (record && isWindowExpired(record, config)) {
    // Сбрасываем счётчик
    await updateRateLimitRecord(ip, action, 1);
    return { remaining: config.maxAttempts - 1 };
  }
  
  // Если записи нет или окно не истекло
  if (!record) {
    // Первая попытка
    await updateRateLimitRecord(ip, action, 1);
    return { remaining: config.maxAttempts - 1 };
  }
  
  // Проверяем количество попыток
  if (record.attempts >= config.maxAttempts) {
    // Блокируем IP
    const blockedUntil = new Date(Date.now() + config.blockDurationMs);
    await updateRateLimitRecord(ip, action, record.attempts, blockedUntil.toISOString());
    
    logger.warn('Rate limit exceeded - blocked', {
      ip,
      action,
      attempts: record.attempts,
      blockedUntil: blockedUntil.toISOString(),
    });
    
    const retryAfter = Math.ceil(config.blockDurationMs / 1000);
    throw new TooManyRequestsError(
      `Too many attempts. Blocked until ${blockedUntil.toLocaleTimeString()}.`,
      retryAfter
    );
  }
  
  // Увеличиваем счётчик
  await incrementAttempts(ip, action);
  
  const remaining = config.maxAttempts - record.attempts - 1;
  
  return { remaining };
};

/**
 * Создать middleware для rate limiting
 */
const createRateLimiter = (action) => {
  return async (req, res, next) => {
    try {
      // Получаем IP клиента (с учётом proxy)
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                 req.headers['x-real-ip'] || 
                 req.connection?.remoteAddress || 
                 req.socket?.remoteAddress ||
                 'unknown';
      
      await checkRateLimit(ip, action);
      
      // Добавляем заголовки с информацией о лимитах
      const config = RATE_LIMIT_CONFIG[action];
      const record = await getRateLimitRecord(ip, action);
      
      if (record) {
        res.setHeader('X-RateLimit-Limit', config.maxAttempts);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxAttempts - record.attempts));
      }
      
      next();
    } catch (error) {
      if (error instanceof TooManyRequestsError) {
        // Добавляем заголовок Retry-After
        res.setHeader('Retry-After', error.details?.retryAfter || 60);
      }
      next(error);
    }
  };
};

// ==================== Запуск очистки старых записей ====================

// Очищаем старые записи каждый час
setInterval(() => {
  cleanupOldRecords().catch(err => {
    logger.error('Rate limit cleanup failed', { error: err.message });
  });
}, 60 * 60 * 1000);

// ==================== Exports ====================

module.exports = {
  // Middleware factories
  createRateLimiter,

  // Specific middleware
  loginLimiter: createRateLimiter('login'),
  registerLimiter: createRateLimiter('register'),
  forgotPasswordLimiter: createRateLimiter('forgot_password'),
  verificationRequestLimiter: createRateLimiter('verification_request'),

  // Utils
  resetRateLimit,
  cleanupOldRecords,

  // Config (для тестов)
  RATE_LIMIT_CONFIG,
};
