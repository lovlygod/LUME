# 错误处理与验证（LUME）

中文 | [Русский](../docs-ru/ERROR_HANDLING.ru.md) | [English](../docs/ERROR_HANDLING.md)

**最后更新：** 2026-03-11
**状态：** 已实现并在使用

---

## 概览

LUME 在后端与前端使用统一的错误处理体系。后端通过 Zod 进行校验，前端将 API 错误映射为用户可读的提示。

---

## 后端

### 核心文件

| 文件 | 作用 |
|------|------|
| `backend/src/errors.js` | 错误类与 async handler 中间件 |
| `backend/src/logger.js` | 结构化日志（认证、服务器、帖子事件） |
| `backend/src/audit.js` | 敏感操作审计日志 |
| `backend/src/validation.js` | Zod 校验规则 |
| `backend/src/rateLimiter.js` | 限流中间件 |
| `backend/src/permissions.js` | 权限检查 |

### 错误类

所有自定义错误继承自 `AppError`：

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

### 在路由中的使用

推荐使用 `asyncHandler` 模式：

```javascript
const { asyncHandler, ValidationError, NotFoundError } = require('./errors');

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  res.json({ user });
}));
```

### 日志

```javascript
const { logger } = require('./logger');
const { audit } = require('./audit');

logger.auth.login(userId, true, req.ip);
logger.group.created(groupId, userId, name);
logger.post.created(postId, userId);

audit.login(userId, true, ip, userAgent);
audit.postDeleted(postId, deletedBy, originalAuthorId, ip);
```

### 错误响应格式

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

## 前端

### 核心文件

| 文件 | 作用 |
|------|------|
| `src/services/errorHandler.ts` | 中心化错误处理器 |
| `src/services/api.ts` | API 客户端（将错误交给 handler） |
| `src/components/ErrorBoundary.tsx` | React 错误边界 |
| `src/lib/queryClient.tsx` | React Query 及错误 hook |

### 错误处理器使用

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

### i18n 错误文案

错误码映射在 `src/services/errorHandler.ts` 中（如 `AUTH_REQUIRED`、`TOKEN_EXPIRED`、`VALIDATION_ERROR`）。

### 通知错误

通知在 `src/components/NotificationsPanel.tsx` 中获取与标记已读。失败会写入控制台，但不会阻塞 UI 渲染；未读数量通过 `notifications:updated` 自定义事件更新。

---

## 验证（Zod）

```javascript
const { createGroupSchema } = require('./validation');

router.post('/groups', authenticateToken, asyncHandler(async (req, res) => {
  const result = createGroupSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid group data', {
      fields: result.error.flatten().fieldErrors,
    });
  }
  // ...
}));
```

---

## 限流

| 动作 | 限制 | 窗口 | 封禁 |
|------|------|------|------|
| 登录 | 5 | 15 分钟 | 30 分钟 |
| 注册 | 3 | 1 小时 | 1 小时 |
| 忘记密码 | 3 | 1 小时 | 1 小时 |
| 认证申请 | 5 | 24 小时 | 24 小时 |

---

## 错误类型与处理

| 类型 | 位置 | 行为 |
|------|------|------|
| 网络 | 前端 | Toast + 控制台日志，可选重试 |
| 认证（401/403） | 前端 + 后端 | 跳转 `/login`，清理会话数据 |
| 校验 | 后端 + 前端 | Zod 错误 → 字段级提示 |
| 5xx | 后端 + 前端 | 以 `error` / `critical` 级别记录 |

---

## 最佳实践

**新增后端错误：**

```javascript
class PaymentError extends AppError {
  constructor(message, details) {
    super(message, 'PAYMENT_ERROR', 402, details);
  }
}
```

**新增前端提示文案：**

```typescript
const ERROR_MESSAGES = {
  PAYMENT_ERROR: 'Payment failed',
};
```

---

## 相关文档

- [Groups Module](./GROUPS_MODULE.cn.md)
- [WebSocket Architecture](./WEBSOCKET_ARCHITECTURE.cn.md)
- [Features Inventory](./FEATURES_INVENTORY.cn.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.cn.md)
