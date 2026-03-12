# Error Handling and Validation (LUME)

English | [Русский](../docs-ru/ERROR_HANDLING.ru.md) | [中文](../docs-cn/ERROR_HANDLING.cn.md)

**Last updated:** 2026-03-11
**Status:** Implemented and in use

---

## Overview

LUME uses a centralized error-handling approach across backend and frontend. Validation is handled with Zod on the backend, and the frontend maps API errors to user-facing messages.

---

## Backend

### Core files

| File | Purpose |
|------|---------|
| `backend/src/errors.js` | Error classes and async handler middleware |
| `backend/src/logger.js` | Structured logging (auth, server, post events) |
| `backend/src/audit.js` | Audit log for sensitive actions |
| `backend/src/validation.js` | Zod schemas |
| `backend/src/rateLimiter.js` | Rate limit middleware |
| `backend/src/permissions.js` | Permission checks |

### Error classes

All custom errors inherit from `AppError`:

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

### Usage in routes

Recommended `asyncHandler` pattern:

```javascript
const { asyncHandler, ValidationError, NotFoundError } = require('./errors');

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  res.json({ user });
}));
```

### Logging

```javascript
const { logger } = require('./logger');
const { audit } = require('./audit');

logger.auth.login(userId, true, req.ip);
logger.server.created(serverId, userId, name);
logger.post.created(postId, userId);

audit.login(userId, true, ip, userAgent);
audit.postDeleted(postId, deletedBy, originalAuthorId, ip);
```

### Error response format

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

### Core files

| File | Purpose |
|------|---------|
| `src/services/errorHandler.ts` | Central error handler |
| `src/services/api.ts` | API client that passes errors to handler |
| `src/components/ErrorBoundary.tsx` | React error boundary |
| `src/lib/queryClient.tsx` | React Query setup with error hooks |

### Error handler usage

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

### ErrorBoundary

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### i18n error messages

Error code mappings live in `src/services/errorHandler.ts` (e.g. `AUTH_REQUIRED`, `TOKEN_EXPIRED`, `VALIDATION_ERROR`).

### Notifications errors

Notifications are fetched and marked as read in `src/components/NotificationsPanel.tsx`. Failures are logged to console and do not block UI rendering; unread counts are updated via the `notifications:updated` custom event.

---

## Validation (Zod)

```javascript
const { createServerSchema } = require('./validation');

router.post('/servers', authenticateToken, asyncHandler(async (req, res) => {
  const result = createServerSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid server data', {
      fields: result.error.flatten().fieldErrors,
    });
  }
  // ...
}));
```

---

## Rate limiting

| Action | Limit | Window | Block |
|--------|-------|--------|-------|
| Login | 5 | 15 min | 30 min |
| Register | 3 | 1 hour | 1 hour |
| Forgot password | 3 | 1 hour | 1 hour |
| Verification request | 5 | 24 hours | 24 hours |

---

## Error types and handling

| Type | Where | Behavior |
|------|-------|----------|
| Network | frontend | Toast + console log, optional retry |
| Auth (401/403) | frontend + backend | Redirect to `/login`, clear session data |
| Validation | backend + frontend | Zod errors → field-level messages |
| 5xx | backend + frontend | Logged with level `error` / `critical` |

---

## Best practices

**Add new backend error:**

```javascript
class PaymentError extends AppError {
  constructor(message, details) {
    super(message, 'PAYMENT_ERROR', 402, details);
  }
}
```

**Add new frontend message:**

```typescript
const ERROR_MESSAGES = {
  PAYMENT_ERROR: 'Payment failed',
};
```

---

## Related documents

- [Servers Module](./SERVERS_MODULE.md)
- [WebSocket Architecture](./WEBSOCKET_ARCHITECTURE.md)
- [Features Inventory](./FEATURES_INVENTORY.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.md)
