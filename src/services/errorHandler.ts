/**
 * Централизованная система обработки ошибок для LUME Frontend
 */

import { toast } from 'sonner';

// ==================== Error Types ====================

export interface ApiError {
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
  };
}

export type ErrorLevel = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorConfig {
  level?: ErrorLevel;
  showToast?: boolean;
  logToConsole?: boolean;
  retryable?: boolean;
}

// ==================== Error Messages (i18n ready) ====================

const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  AUTH_REQUIRED: 'Требуется авторизация',
  INVALID_TOKEN: 'Неверный токен',
  TOKEN_EXPIRED: 'Сессия истекла. Пожалуйста, войдите снова.',
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  INVALID_REFRESH_TOKEN: 'Сессия истекла. Пожалуйста, войдите снова.',
  
  // Validation errors
  VALIDATION_ERROR: 'Ошибка валидации данных',
  
  // Permission errors
  FORBIDDEN: 'Доступ запрещён',
  
  // Resource errors
  NOT_FOUND: 'Ресурс не найден',
  CONFLICT: 'Конфликт данных',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Слишком много запросов. Попробуйте позже.',
  
  // Server errors
  INTERNAL_ERROR: 'Внутренняя ошибка сервера',
  SERVICE_ERROR: 'Сервис временно недоступен',
  
  // Network errors
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение.',
  TIMEOUT: 'Превышено время ожидания ответа сервера.',
  
  // Default
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка',
};

// ==================== Error Handler Class ====================

type ErrorLike = {
  message?: string;
  code?: string;
  status?: number;
  statusCode?: number;
  type?: string;
  name?: string;
  error?: { details?: unknown; message?: string; code?: string; statusCode?: number };
  response?: { data?: ApiError };
};

const toErrorLike = (error: unknown): ErrorLike => {
  if (typeof error === "object" && error !== null) {
    return error as ErrorLike;
  }
  return {};
};

class ErrorHandler {
  private static instance: ErrorHandler;
  
  private constructor() {}
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Получить человекочитаемое сообщение об ошибке
   */
  getErrorMessage(code: string, defaultMessage?: string): string {
    return ERROR_MESSAGES[code] || defaultMessage || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  /**
   * Обработка API ошибки
   */
  handleApiError(error: unknown, config?: ErrorConfig): void {
    const {
      level = 'error',
      showToast = true,
      logToConsole = true,
      retryable = false,
    } = config || {};

    // Извлекаем данные ошибки
    const apiError = this.extractApiError(error);
    const err = toErrorLike(error);
    const message = this.getErrorMessage(
      apiError.error?.code,
      apiError.error?.message || (err.message || (error instanceof Error ? error.message : undefined))
    );

    // Логирование
    if (logToConsole) {
      this.logError(error, { level, code: apiError.error?.code, statusCode: apiError.error?.statusCode });
    }

    // Показ уведомления
    if (showToast) {
      this.showToast(message, level);
    }

    // Специальная обработка для определённых ошибок
    this.handleSpecificErrors(apiError);
  }

  /**
   * Извлечение данных API ошибки
   */
  private extractApiError(error: unknown): ApiError {
    const err = toErrorLike(error);
    // Если это уже ApiError
    if (err.error?.message) {
      return err as ApiError;
    }

    // Если это Response error от fetch
    if (err.response?.data) {
      return err.response.data as ApiError;
    }

    // Возвращаем стандартный формат
    return {
      error: {
        message: err.message || 'Unknown error',
        code: err.code || 'UNKNOWN',
        statusCode: err.status || err.statusCode || 500,
      },
    };
  }

  /**
   * Логирование ошибки
   */
  private logError(error: unknown, meta: { level: ErrorLevel; code?: string; statusCode?: number }): void {
    const logMethod = meta.level === 'error' || meta.level === 'critical' ? 'error' : 'warn';

    const maybeDetails = (error as ApiError)?.error?.details;
    const details = maybeDetails ? JSON.stringify(maybeDetails, null, 2) : null;
    const suffix = details ? `\nDetails: ${details}` : '';
    console[logMethod](`[API Error] ${meta.code || 'UNKNOWN'} (${meta.statusCode || 500}):`, error, suffix);
    if (maybeDetails && typeof maybeDetails === 'object') {
      console[logMethod]('[API Error Details]:', maybeDetails);
    }
  }

  /**
   * Показ toast уведомления
   */
  private showToast(message: string, level: ErrorLevel): void {
    switch (level) {
      case 'info':
        toast.info(message);
        break;
      case 'warning':
        toast.warning(message);
        break;
      case 'error':
      case 'critical':
        toast.error(message);
        break;
      default:
        toast.error(message);
    }
  }

  /**
   * Обработка специфичных ошибок
   */
  private handleSpecificErrors(error: ApiError): void {
    const code = error.error?.code;
    const statusCode = error.error?.statusCode;

    // 401 - перенаправление на login
    if (statusCode === 401 || code === 'AUTH_REQUIRED' || code === 'TOKEN_EXPIRED') {
      // Очищаем локальное состояние авторизации
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Перенаправляем на страницу входа
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // 403 - возможно нужно обновить токен
    if (statusCode === 403) {
      // Может быть обработано в api.ts через refresh token
    }
  }

  /**
   * Обработка network ошибки
   */
  handleNetworkError(error: unknown, config?: ErrorConfig): void {
    const { showToast = true, logToConsole = true } = config || {};

    if (logToConsole) {
      console.error('[Network Error]:', error);
    }

    if (showToast) {
      if (!navigator.onLine) {
        toast.error(ERROR_MESSAGES.NETWORK_ERROR);
      } else {
        toast.error(ERROR_MESSAGES.TIMEOUT);
      }
    }
  }

  /**
   * Обработка ошибки валидации формы
   */
  handleValidationError(error: ApiError, formName?: string): void {
    const details = error.error?.details;
    
    if (details && typeof details === 'object') {
      // Логируем детали валидации
      console.warn(`[Validation Error] ${formName || 'Form'}:`, details);
      
      // Показываем первое сообщение об ошибке
      const firstError = Object.values(details)[0] as string;
      toast.warning(firstError || ERROR_MESSAGES.VALIDATION_ERROR);
    } else {
      toast.warning(error.error?.message || ERROR_MESSAGES.VALIDATION_ERROR);
    }
  }

  /**
   * Создать обработчик для конкретного API вызова
   */
  createHandler(config?: ErrorConfig): (error: unknown) => void {
    return (error: unknown) => {
      const err = toErrorLike(error);
      if (err.type === 'network-error' || err.name === 'TypeError' && err.message === 'Failed to fetch') {
        this.handleNetworkError(error, config);
      } else if (err.error?.details) {
        this.handleValidationError(error as ApiError);
      } else {
        this.handleApiError(error, config);
      }
    };
  }
}

// ==================== Error Boundary Helper ====================

/**
 * Проверка, является ли ошибка критической для всего приложения
 */
export const isCriticalError = (error: unknown): boolean => {
  const err = toErrorLike(error);
  const statusCode = err.error?.statusCode || err.status;
  return statusCode >= 500 || statusCode === 403;
};

/**
 * Проверка, можно ли повторить запрос
 */
export const isRetryableError = (error: unknown): boolean => {
  const err = toErrorLike(error);
  const code = err.error?.code;
  const statusCode = err.error?.statusCode || err.status;
  
  // Повторяем только network ошибки и 5xx
  return statusCode >= 500 || 
         code === 'SERVICE_ERROR' || 
         err.type === 'network-error';
};

// ==================== Export Singleton ====================

export const errorHandler = ErrorHandler.getInstance();

export default errorHandler;
