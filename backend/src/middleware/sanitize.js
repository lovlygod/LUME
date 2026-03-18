/**
 * Middleware для автоматической санитизации входящих данных
 * Защищает от XSS атак
 */

const { sanitizeText, sanitizeHTML, sanitizeURL, escapeHTML } = require('../xss');

/**
 * Конфигурация санитизации
 */
const sanitizationConfig = {
  // Поля которые нужно санитизировать как текст
  textFields: ['text', 'name', 'username', 'bio', 'description', 'reason', 'reviewNotes'],
  
  // Поля которые нужно санитизировать как HTML (с тегами)
  htmlFields: [],
  
  // URL поля
  urlFields: ['website', 'tiktokVideoUrl', 'imageUrl'],
};

/**
 * Middleware для санитизации тела запроса
 */
const sanitizeRequest = (config = sanitizationConfig) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    const sanitizedBody = {};

    for (const [key, value] of Object.entries(req.body)) {
      if (value === null || value === undefined) {
        sanitizedBody[key] = value;
        continue;
      }

      // Санитизация текстовых полей
      if (config.textFields.includes(key) && typeof value === 'string') {
        sanitizedBody[key] = sanitizeText(value);
        continue;
      }

      // Санитизация HTML полей
      if (config.htmlFields.includes(key) && typeof value === 'string') {
        sanitizedBody[key] = sanitizeHTML(value);
        continue;
      }

      // Санитизация URL полей
      if (config.urlFields.includes(key) && typeof value === 'string') {
        sanitizedBody[key] = sanitizeURL(value);
        continue;
      }

      // Рекурсивная санитизация вложенных объектов
      if (typeof value === 'object') {
        sanitizedBody[key] = sanitizeObject(value, config);
        continue;
      }

      // Оставляем как есть
      sanitizedBody[key] = value;
    }

    req.body = sanitizedBody;
    next();
  };
};

/**
 * Санитизация объекта (рекурсивно)
 */
const sanitizeObject = (obj, config = sanitizationConfig) => {
  if (Array.isArray(obj)) {
    return obj.map(item => 
      typeof item === 'object' ? sanitizeObject(item, config) : item
    );
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
      continue;
    }

    if (config.textFields.includes(key) && typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
      continue;
    }

    if (config.htmlFields.includes(key) && typeof value === 'string') {
      sanitized[key] = sanitizeHTML(value);
      continue;
    }

    if (config.urlFields.includes(key) && typeof value === 'string') {
      sanitized[key] = sanitizeURL(value);
      continue;
    }

    if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, config);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
};

/**
 * Middleware для санитизации query параметров
 */
const sanitizeQuery = () => {
  return (req, res, next) => {
    if (!req.query || typeof req.query !== 'object') {
      return next();
    }

    const sanitizedQuery = {};
    
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        sanitizedQuery[key] = sanitizeText(value);
      } else {
        sanitizedQuery[key] = value;
      }
    }

    req.query = sanitizedQuery;
    next();
  };
};

/**
 * Экранирование для JSON ответов
 * Защищает от XSS при отображении JSON в браузере
 */
const escapeJSON = (data) => {
  const json = JSON.stringify(data);
  return json.replace(/</g, '\\u003c')
             .replace(/>/g, '\\u003e')
             .replace(/&/g, '\\u0026')
             .replace(/\//g, '\\u002f');
};

module.exports = {
  sanitizeRequest,
  sanitizeQuery,
  sanitizeObject,
  escapeJSON,
  sanitizationConfig,
};
