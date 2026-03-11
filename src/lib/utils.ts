import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL as CONFIG_API_BASE_URL } from "@/lib/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE_URL = CONFIG_API_BASE_URL;

/**
 * Нормализует URL изображения, добавляя базовый URL если нужно
 */
export const normalizeImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // Если URL уже полный (начинается с http:// или https://), возвращаем как есть
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Если URL относительный (начинается с /), добавляем базовый URL
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  
  // Иначе возвращаем как есть
  return url;
};

/**
 * Helper для получения аватара пользователя
 */
export const getUserAvatar = (user: { avatar?: string | null; name: string }): string => {
  const normalizedUrl = normalizeImageUrl(user.avatar);
  
  if (normalizedUrl) {
    return normalizedUrl;
  }
  
  // Возвращаем placeholder с первой буквой имени
  return '';
};
