/**
 * Централизованная система обработки ошибок для LUME Backend
 */

// ==================== Custom Error Classes ====================

/**
 * Базовый класс для всех кастомных ошибок приложения
 */
class AppError extends Error {
  constructor(message, statusCode, code, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Операционные ошибки (ожидаемые)

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: Object.keys(this.details).length > 0 ? this.details : undefined,
      },
    };
  }
}

/**
 * Ошибка валидации данных
 */
class ValidationError extends AppError {
  constructor(message = 'Validation error', details = {}) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Ошибка аутентификации
 */
class AuthError extends AppError {
  constructor(message = 'Authentication required', code = 'AUTH_REQUIRED') {
    super(message, 401, code);
  }
}

/**
 * Ошибка авторизации (нет прав)
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

/**
 * Ресурс не найден
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

/**
 * Конфликт (например, уникальный constraint)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource already exists', code = 'CONFLICT', details = {}) {
    super(message, 409, code, details);
  }
}

/**
 * Слишком много запросов (rate limit)
 */
class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

/**
 * Внутренняя ошибка сервера
 */
class InternalError extends AppError {
  constructor(message = 'Internal server error', code = 'INTERNAL_ERROR', details = {}) {
    super(message, 500, code, details);
    this.isOperational = false; // Не операционная ошибка (неожидаемая)
  }
}

/**
 * Ошибка сервиса (внешние зависимости)
 */
class ServiceError extends AppError {
  constructor(message = 'Service unavailable', code = 'SERVICE_ERROR', details = {}) {
    super(message, 503, code, details);
  }
}

// ==================== Error Handler Middleware ====================

/**
 * Централизованный обработчик ошибок Express
 */
const errorHandler = (err, req, res, next) => {
  // Если ответ уже отправлен, не делаем ничего
  if (res.headersSent) {
    console.error('Error occurred after response was sent:', err);
    return next(err);
  }

  // Логирование ошибки
  logError(err, req);

  // Если ошибка уже обработана (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Обработка TooManyRequestsError из rate limiter
  if (err instanceof TooManyRequestsError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Обработка ошибок валидации от библиотек (например, multer)
  if (err.name === 'ValidationError') {
    const validationError = new ValidationError(err.message, {
      field: err.field || 'unknown',
    });
    return res.status(validationError.statusCode).json(validationError.toJSON());
  }

  // Обработка ошибок JWT
  if (err.name === 'JsonWebTokenError') {
    const authError = new AuthError('Invalid token', 'INVALID_TOKEN');
    return res.status(authError.statusCode).json(authError.toJSON());
  }

  if (err.name === 'TokenExpiredError') {
    const authError = new AuthError('Token expired', 'TOKEN_EXPIRED');
    return res.status(authError.statusCode).json(authError.toJSON());
  }

  // Обработка ошибок multer (загрузка файлов)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const validationDetails = {
      maxSize: err.maxSize || '5MB',
    };
    if (process.env.NODE_ENV !== 'production') {
      validationDetails.code = err.code;
      validationDetails.message = err.message;
      validationDetails.name = err.name;
    }
    const validationError = new ValidationError('File too large', validationDetails);
    return res.status(validationError.statusCode).json(validationError.toJSON());
  }

  // Обработка ошибок базы данных
  if (err.message && err.message.includes('SQLITE')) {
    console.error('Database error:', err.message);
    const internalError = new InternalError('Database error');
    return res.status(internalError.statusCode).json(internalError.toJSON());
  }

  // Обработка ошибок парсинга JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const validationError = new ValidationError('Invalid JSON in request body');
    return res.status(validationError.statusCode).json(validationError.toJSON());
  }

  // Все остальные ошибки - внутренняя ошибка сервера
  console.error('Unhandled error:', err);
  const internalDetails = {};
  if (process.env.NODE_ENV !== 'production') {
    internalDetails.message = err.message;
    internalDetails.name = err.name;
    internalDetails.code = err.code;
  }
  const internalError = new InternalError('Internal server error', 'INTERNAL_ERROR', internalDetails);
  return res.status(internalError.statusCode).json(internalError.toJSON());
};

// ==================== Logging ====================

/**
 * Структурированное логирование ошибок
 */
const logError = (err, req) => {
  const softAuthCodes = new Set([
    'TOKEN_EXPIRED',
    'INVALID_REFRESH_TOKEN',
    'SESSION_REVOKED',
    'INVALID_TOKEN'
  ]);
  const baseLevel = err.isOperational ? 'error' : 'critical';
  const level = err instanceof AuthError && softAuthCodes.has(err.code) ? 'warn' : baseLevel;
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: err.message,
    code: err.code || 'UNKNOWN',
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    userId: req.user?.userId || null,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    stack: err.stack,
  };

  // В production можно отправлять в external logging service (Sentry, etc.)
  // Для sekarang просто выводим в консоль в структурированном виде
  if (process.env.NODE_ENV === 'production') {
    console.info(JSON.stringify(logEntry));
  } else {
    const logFn = logEntry.level === 'warn' ? console.warn : console.error;
    logFn(`[${logEntry.level.toUpperCase()}] ${logEntry.code}: ${logEntry.message}`);
    if (logEntry.userId) {
      logFn(`  User: ${logEntry.userId}`);
    }
    logFn(`  Path: ${logEntry.method} ${logEntry.path}`);
  }
};

// ==================== Async Handler Wrapper ====================

/**
 * Обёртка для async route handlers для автоматической передачи ошибок в errorHandler
 * Использование: router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== Exports ====================

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalError,
  ServiceError,
  
  // Middleware
  errorHandler,
  
  // Utilities
  asyncHandler,
  logError,
};

