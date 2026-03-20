# Обработка ошибок и валидация (LUME)

[English](../docs/ERROR_HANDLING.md) | Русский | [中文](../docs-cn/ERROR_HANDLING.cn.md)

**Последнее обновление:** 2026-03-11
**Статус:** реализовано и используется

---

## Обзор

В LUME используется единая система обработки ошибок на backend и frontend. Валидация выполняется через Zod на backend, а frontend отображает ошибки пользователю.

---

## Backend

### Основные файлы

| Файл | Назначение |
|------|------------|
| `backend/src/errors.js` | Классы ошибок и async handler |
| `backend/src/logger.js` | Структурированные логи |
| `backend/src/audit.js` | Аудит чувствительных действий |
| `backend/src/validation.js` | Zod схемы |
| `backend/src/rateLimiter.js` | Rate limit middleware |
| `backend/src/permissions.js` | Проверки прав |

### Классы ошибок

Все ошибки наследуются от `AppError`:

```javascript
const {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalError,
  ServiceError,
} = require('./errors');
```

### Использование в роутерах

Рекомендуемый шаблон `asyncHandler`:

```javascript
const { asyncHandler, NotFoundError } = require('./errors');

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  res.json({ user });
}));
```

### Формат ответа ошибки

```json
{
  "error": {
    "message": "Email already exists",
    "code": "UNIQUE_CONSTRAINT",
    "statusCode": 409,
    "details": {
      "field": "email"
    }
  }
}
```

---

## Frontend

### Основные файлы

| Файл | Назначение |
|------|------------|
| `src/services/errorHandler.ts` | Централизованный обработчик |
| `src/services/api.ts` | API клиент |
| `src/components/ErrorBoundary.tsx` | React error boundary |
| `src/lib/queryClient.tsx` | React Query и обработка ошибок |

### Использование errorHandler

```typescript
import { errorHandler } from '@/services/errorHandler';

try {
  await apiRequest('/posts', { method: 'POST', body: data });
} catch (error) {
  errorHandler.handleApiError(error, {
    level: 'error',
    showToast: true,
    logToConsole: true,
    retryable: false,
  });
}
```

---

## Валидация (Zod)

```javascript
const { createGroupSchema } = require('./validation');

router.post('/groups', authenticateToken, asyncHandler(async (req, res) => {
  const result = createGroupSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid group data', {
      fields: result.error.flatten().fieldErrors,
    });
  }
}));
```

---

## Rate limiting

| Действие | Лимит | Окно | Блокировка |
|----------|-------|------|------------|
| Вход | 5 | 15 мин | 30 мин |
| Регистрация | 3 | 1 час | 1 час |
| Восстановление | 3 | 1 час | 1 час |
| Верификация | 5 | 24 часа | 24 часа |

---

## Типы ошибок

| Тип | Где | Поведение |
|-----|-----|----------|
| Сеть | frontend | Toast + лог, опциональный retry |
| Авторизация | frontend + backend | Редирект на `/login`, очистка сессии |
| Валидация | backend + frontend | Поля ошибок из Zod |
| 5xx | backend + frontend | Логирование уровня `error` / `critical` |

### Ошибки уведомлений

Уведомления загружаются и помечаются как прочитанные в `src/components/NotificationsPanel.tsx`. Ошибки логируются в консоль и не блокируют UI; счётчик непрочитанных обновляется через событие `notifications:updated`.

---

## Связанные документы

- [Groups Module](./GROUPS_MODULE.ru.md)
- [WebSocket Architecture](./WEBSOCKET_ARCHITECTURE.ru.md)
- [Features Inventory](./FEATURES_INVENTORY.ru.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.md)
