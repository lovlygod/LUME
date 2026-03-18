/**
 * Утилиты для XSS защиты и санитизации на backend
 */

const sanitizeHtml = require('sanitize-html');

// ==================== Конфигурация ====================

const defaultOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a',
    'img',
    'div', 'span',
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel', 'title'],
    'img': ['src', 'alt', 'width', 'height', 'class'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  enforceHtmlBoundary: false,
  parseStyleAttributes: false,
};

// ==================== Функции санитизации ====================

/**
 * Санитизация HTML на сервере
 */
const sanitizeHTML = (html, options = {}) => {
  if (!html) return '';
  
  return sanitizeHtml(html, { ...defaultOptions, ...options });
};

/**
 * Санитизация текста (удаление всех HTML тегов)
 */
const sanitizeText = (text) => {
  if (!text) return '';
  
  // Удаляем все HTML теги
  return text.replace(/<[^>]*>/g, '').trim();
};

/**
 * Санитизация для полей с ограниченной длиной
 */
const sanitizeWithLength = (text, maxLength = 1000) => {
  if (!text) return '';
  
  const sanitized = sanitizeText(text);
  
  if (sanitized.length > maxLength) {
    return sanitized.substring(0, maxLength) + '...';
  }
  
  return sanitized;
};

/**
 * Проверка и санитизация URL
 */
const sanitizeURL = (url) => {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Разрешаем только http и https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    
    return url;
  } catch {
    // Если не валидный URL, пробуем как относительный путь
    if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) {
      return url;
    }
    return '';
  }
};

/**
 * Экранирование HTML специальных символов
 */
const escapeHTML = (text) => {
  if (!text) return '';
  
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return text.replace(/[&<>"']/g, (char) => escapeMap[char]);
};

/**
 * Санитизация для markdown контента
 */
const sanitizeMarkdown = (markdown) => {
  if (!markdown) return '';
  
  // Удаляем опасные теги
  return markdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
};

module.exports = {
  sanitizeHTML,
  sanitizeText,
  sanitizeWithLength,
  sanitizeURL,
  escapeHTML,
  sanitizeMarkdown,
  defaultOptions,
};
