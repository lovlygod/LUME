/**
 * Утилиты для XSS защиты и санитизации контента
 */

import DOMPurify from 'dompurify';

// ==================== Конфигурация DOMPurify ====================

// Разрешённые теги
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a',
  'img',
  'div', 'span',
];

// Разрешённые атрибуты
const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'title',
  'src', 'alt', 'width', 'height',
  'class',
];

// ==================== Функции санитизации ====================

/**
 * Санитизация HTML для отображения
 * Удаляет опасные теги и атрибуты
 */
export const sanitizeHTML = (html: string): string => {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target'],
    FORCE_URI: true,
  });
};

/**
 * Санитизация текста (полное удаление HTML)
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Создаём временный элемент и получаем только текст
  const div = document.createElement('div');
  div.textContent = text;
  return div.textContent || '';
};

/**
 * Обработка ссылок для безопасности
 * Добавляет noopener, noreferrer для внешних ссылок
 */
export const processLinks = (html: string): string => {
  if (!html) return '';
  
  return html.replace(/<a\s+([^>]*?)href="([^"]*?)"([^>]*)>/gi, (match, before, href, after) => {
    const isExternal = !href.startsWith('/') && !href.startsWith('#');
    const newBefore = before.replace(/target="[^"]*"/gi, '');
    const newAfter = after.replace(/target="[^"]*"/gi, '');
    
    if (isExternal) {
      return `<a ${newBefore}href="${href}"${newAfter} target="_blank" rel="noopener noreferrer">`;
    }
    return `<a ${newBefore}href="${href}"${newAfter}>`;
  });
};

/**
 * Полная санитизация для отображения контента
 * Комбинирует sanitizeHTML и processLinks
 */
export const sanitizeContent = (html: string): string => {
  if (!html) return '';
  
  const sanitized = sanitizeHTML(html);
  return processLinks(sanitized);
};

/**
 * Санитизация для markdown (если будет использоваться)
 */
export const sanitizeMarkdown = (markdown: string): string => {
  if (!markdown) return '';
  
  // Базовая защита от script injection в markdown
  return markdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
};

/**
 * Проверка URL на безопасность
 */
export const isSafeURL = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    // Разрешаем только http и https
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Санитизация URL для использования в href/src
 */
export const sanitizeURL = (url: string): string => {
  if (!url) return '';
  
  if (isSafeURL(url)) {
    return url;
  }
  
  // Если относительный URL или якорь
  if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) {
    return url;
  }
  
  return '';
};

/**
 * Экранирование HTML специальных символов
 */
export const escapeHTML = (text: string): string => {
  if (!text) return '';
  
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return text.replace(/[&<>"']/g, (char) => escapeMap[char]);
};
