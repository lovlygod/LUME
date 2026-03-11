п»ї??# РЎРёСЃС‚РµРјР° РѕР±СЂР°Р±РѕС‚РєРё РѕС€РёР±РѕРє Рё РІР°Р»РёРґР°С†РёРё LUME

**пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ:** 9 пїЅпїЅпїЅпїЅпїЅ 2026 пїЅ.
**РЎС‚Р°С‚СѓСЃ:** вњ… Р РµР°Р»РёР·РѕРІР°РЅРѕ Рё РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ

---

## РћР±Р·РѕСЂ

Р’ РїСЂРѕРµРєС‚Рµ СЂРµР°Р»РёР·РѕРІР°РЅР° РµРґРёРЅР°СЏ С†РµРЅС‚СЂР°Р»РёР·РѕРІР°РЅРЅР°СЏ СЃРёСЃС‚РµРјР° РѕР±СЂР°Р±РѕС‚РєРё РѕС€РёР±РѕРє РґР»СЏ backend Рё frontend, РІРєР»СЋС‡Р°СЏ РІР°Р»РёРґР°С†РёСЋ РґР°РЅРЅС‹С… С‡РµСЂРµР· Zod.

---

## Backend

### Р¤Р°Р№Р»С‹ СЃРёСЃС‚РµРјС‹

| Р¤Р°Р№Р» | РћРїРёСЃР°РЅРёРµ | РђРєС‚СѓР°Р»СЊРЅРѕСЃС‚СЊ |
|------|----------|--------------|
| `backend/src/errors.js` | РљР»Р°СЃСЃС‹ РѕС€РёР±РѕРє Рё middleware РѕР±СЂР°Р±РѕС‚С‡РёРє | вњ… РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ |
| `backend/src/logger.js` | РЎРёСЃС‚РµРјР° СЃС‚СЂСѓРєС‚СѓСЂРёСЂРѕРІР°РЅРЅРѕРіРѕ Р»РѕРіРёСЂРѕРІР°РЅРёСЏ | вњ… РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ |
| `backend/src/audit.js` | РђСѓРґРёС‚ СЃРѕР±С‹С‚РёР№ | вњ… РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ |
| `backend/src/validation.js` | Zod СЃС…РµРјС‹ РІР°Р»РёРґР°С†РёРё | вњ… РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ |
| `backend/src/rateLimiter.js` | Rate limiting middleware | вњ… РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ |
| `backend/src/permissions.js` | РЎРёСЃС‚РµРјР° РїСЂР°РІ РґРѕСЃС‚СѓРїР° | вњ… РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ |

### РљР»Р°СЃСЃС‹ РѕС€РёР±РѕРє

Р’СЃРµ РєР°СЃС‚РѕРјРЅС‹Рµ РѕС€РёР±РєРё РЅР°СЃР»РµРґСѓСЋС‚СЃСЏ РѕС‚ `AppError`:

```javascript
const {
  AppError,           // Р‘Р°Р·РѕРІС‹Р№ РєР»Р°СЃСЃ
  ValidationError,    // 400 - РћС€РёР±РєР° РІР°Р»РёРґР°С†РёРё
  AuthError,          // 401 - РћС€РёР±РєР° Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёРё
  ForbiddenError,     // 403 - РќРµС‚ РїСЂР°РІ РґРѕСЃС‚СѓРїР°
  NotFoundError,      // 404 - Р РµСЃСѓСЂСЃ РЅРµ РЅР°Р№РґРµРЅ
  ConflictError,      // 409 - РљРѕРЅС„Р»РёРєС‚ РґР°РЅРЅС‹С…
  TooManyRequestsError, // 429 - Rate limit
  InternalError,      // 500 - Р’РЅСѓС‚СЂРµРЅРЅСЏСЏ РѕС€РёР±РєР°
  ServiceError,       // 503 - РЎРµСЂРІРёСЃ РЅРµРґРѕСЃС‚СѓРїРµРЅ
} = require('./errors');
```

### РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РІ СЂРѕСѓС‚Р°С…

**Р’Р°СЂРёР°РЅС‚ 1: РЎ asyncHandler (СЂРµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ)**
```javascript
const { asyncHandler, ValidationError, NotFoundError } = require('./errors');

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json({ user });
}));
```

**Р’Р°СЂРёР°РЅС‚ 2: РЎ try/catch Рё next()**
```javascript
router.post('/posts', async (req, res, next) => {
  try {
    if (!req.body.text) {
      throw new ValidationError('Text is required', { field: 'text' });
    }
    const post = await createPost(req.body);
    res.json({ post });
  } catch (error) {
    next(error);
  }
});
```

### Р›РѕРіРёСЂРѕРІР°РЅРёРµ

```javascript
const { logger } = require('./logger');
const { audit } = require('./audit');

// Auth СЃРѕР±С‹С‚РёСЏ
logger.auth.login(userId, true, req.ip);
logger.auth.logout(userId, req.ip);
logger.auth.register(userId, email, req.ip);
logger.auth.tokenRefresh(userId, true);

// Server СЃРѕР±С‹С‚РёСЏ
logger.server.created(serverId, userId, name);
logger.server.deleted(serverId, userId, name);
logger.server.memberJoined(serverId, userId);
logger.server.memberKicked(serverId, userId, kickedBy);

// Post СЃРѕР±С‹С‚РёСЏ
logger.post.created(postId, userId);
logger.post.reported(postId, reporterId, reason);

// РђСѓРґРёС‚ (РґР»СЏ РІР°Р¶РЅС‹С… СЃРѕР±С‹С‚РёР№)
audit.login(userId, true, ip, userAgent);
audit.register(userId, email, ip);
audit.postDeleted(postId, deletedBy, originalAuthorId, ip);
audit.memberKicked(memberId, kickedBy, serverId, ip);
```

### Р¤РѕСЂРјР°С‚ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ

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

### Р¤Р°Р№Р»С‹ СЃРёСЃС‚РµРјС‹

| Р¤Р°Р№Р» | РћРїРёСЃР°РЅРёРµ | РђРєС‚СѓР°Р»СЊРЅРѕСЃС‚СЊ |
|------|----------|--------------|
| `src/services/errorHandler.ts` | Р¦РµРЅС‚СЂР°Р»РёР·РѕРІР°РЅРЅС‹Р№ РѕР±СЂР°Р±РѕС‚С‡РёРє РѕС€РёР±РѕРє | вњ… РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ |
| `src/services/api.ts` | API РєР»РёРµРЅС‚ СЃ РѕР±СЂР°Р±РѕС‚РєРѕР№ РѕС€РёР±РѕРє | вњ… РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ |
| `src/components/ErrorBoundary.tsx` | React РєРѕРјРїРѕРЅРµРЅС‚ РґР»СЏ РїРµСЂРµС…РІР°С‚Р° РѕС€РёР±РѕРє | вњ… РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ |
| `src/lib/queryClient.tsx` | React Query РєР»РёРµРЅС‚ СЃ РЅР°СЃС‚СЂРѕР№РєР°РјРё РѕС€РёР±РѕРє | вњ… РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ |

### РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ errorHandler

```typescript
import { errorHandler } from '@/services/errorHandler';

// Р‘Р°Р·РѕРІРѕРµ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ
try {
  await apiRequest('/posts', { method: 'POST', body: data });
} catch (error) {
  errorHandler.handleApiError(error, {
    level: 'error',      // 'info' | 'warning' | 'error' | 'critical'
    showToast: true,     // РџРѕРєР°Р·С‹РІР°С‚СЊ toast СѓРІРµРґРѕРјР»РµРЅРёРµ
    logToConsole: true,  // Р›РѕРіРёСЂРѕРІР°С‚СЊ РІ РєРѕРЅСЃРѕР»СЊ
    retryable: false,    // РњРѕР¶РЅРѕ Р»Рё РїРѕРІС‚РѕСЂРёС‚СЊ Р·Р°РїСЂРѕСЃ
  });
}

// РЎРѕР·РґР°РЅРёРµ РѕР±СЂР°Р±РѕС‚С‡РёРєР° РґР»СЏ РєРѕРЅРєСЂРµС‚РЅРѕРіРѕ РІС‹Р·РѕРІР°
const handleError = errorHandler.createHandler({
  showToast: true,
  level: 'warning'
});

fetch('/api/...')
  .then(res => res.json())
  .catch(handleError);
```

### ErrorBoundary РєРѕРјРїРѕРЅРµРЅС‚

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

// РћР±С‘СЂС‚С‹РІР°РЅРёРµ РІСЃРµРіРѕ РїСЂРёР»РѕР¶РµРЅРёСЏ
<ErrorBoundary>
  <App />
</ErrorBoundary>

// РЎ РєР°СЃС‚РѕРјРЅС‹Рј fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <Dashboard />
</ErrorBoundary>
```

### РҐСѓРєРё РґР»СЏ РѕР±СЂР°Р±РѕС‚РєРё РѕС€РёР±РѕРє

```tsx
import { useAsyncError, QueryErrorBoundary } from '@/components/ErrorBoundary';

function MyComponent() {
  const handleError = useAsyncError();

  const loadData = async () => {
    try {
      const data = await fetchData();
    } catch (error) {
      handleError(error); // РџСЂРѕР±СЂР°СЃС‹РІР°РµС‚ РѕС€РёР±РєСѓ РІ ErrorBoundary
    }
  };

  return (
    <QueryErrorBoundary onError={(error) => console.error(error)}>
      <DataList />
    </QueryErrorBoundary>
  );
}
```

### РЎРѕРѕР±С‰РµРЅРёСЏ РѕР± РѕС€РёР±РєР°С… (i18n)

Р’ `src/services/errorHandler.ts` РѕРїСЂРµРґРµР»РµРЅС‹ СЃС‚Р°РЅРґР°СЂС‚РЅС‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ:

| РљРѕРґ | РЎРѕРѕР±С‰РµРЅРёРµ |
|-----|-----------|
| `AUTH_REQUIRED` | РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ |
| `TOKEN_EXPIRED` | РЎРµСЃСЃРёСЏ РёСЃС‚РµРєР»Р°. РџРѕР¶Р°Р»СѓР№СЃС‚Р°, РІРѕР№РґРёС‚Рµ СЃРЅРѕРІР°. |
| `INVALID_CREDENTIALS` | РќРµРІРµСЂРЅС‹Р№ email РёР»Рё РїР°СЂРѕР»СЊ |
| `VALIDATION_ERROR` | РћС€РёР±РєР° РІР°Р»РёРґР°С†РёРё РґР°РЅРЅС‹С… |
| `FORBIDDEN` | Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ |
| `NOT_FOUND` | Р РµСЃСѓСЂСЃ РЅРµ РЅР°Р№РґРµРЅ |
| `RATE_LIMIT_EXCEEDED` | РЎР»РёС€РєРѕРј РјРЅРѕРіРѕ Р·Р°РїСЂРѕСЃРѕРІ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕР·Р¶Рµ. |
| `INTERNAL_ERROR` | Р’РЅСѓС‚СЂРµРЅРЅСЏСЏ РѕС€РёР±РєР° СЃРµСЂРІРµСЂР° |
| `NETWORK_ERROR` | РћС€РёР±РєР° СЃРµС‚Рё. РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕРґРєР»СЋС‡РµРЅРёРµ. |

---

## Р’Р°Р»РёРґР°С†РёСЏ РґР°РЅРЅС‹С… (Zod)

### РћСЃРЅРѕРІРЅС‹Рµ СЃС…РµРјС‹

Р’СЃРµ СЃС…РµРјС‹ РЅР°С…РѕРґСЏС‚СЃСЏ РІ `backend/src/validation.js`:

| РЎС…РµРјР° | РћРїРёСЃР°РЅРёРµ |
|-------|----------|
| `registerSchema` | Р РµРіРёСЃС‚СЂР°С†РёСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ |
| `loginSchema` | Р’С…РѕРґ РІ СЃРёСЃС‚РµРјСѓ |
| `createServerSchema` | РЎРѕР·РґР°РЅРёРµ СЃРµСЂРІРµСЂР° |
| `createChannelSchema` | РЎРѕР·РґР°РЅРёРµ РєР°РЅР°Р»Р° |
| `sendServerMessageSchema` | РћС‚РїСЂР°РІРєР° СЃРѕРѕР±С‰РµРЅРёСЏ |
| `uploadFileSchema` | Р—Р°РіСЂСѓР·РєР° С„Р°Р№Р»РѕРІ |
| `submitVerificationRequestSchema` | Р—Р°СЏРІРєР° РЅР° РІРµСЂРёС„РёРєР°С†РёСЋ |

### РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ

```javascript
const { z } = require('zod');
const { createServerSchema } = require('./validation');

router.post('/servers', authenticateToken, asyncHandler(async (req, res) => {
  const result = createServerSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid server data', {
      fields: result.error.flatten().fieldErrors,
    });
  }

  const { name, type, description } = result.data;
  // ... РґР°Р»СЊРЅРµР№С€Р°СЏ Р»РѕРіРёРєР°
}));
```

---

## Rate Limiting

### РљРѕРЅС„РёРіСѓСЂР°С†РёСЏ

| Р”РµР№СЃС‚РІРёРµ | Р›РёРјРёС‚ РїРѕРїС‹С‚РѕРє | РћРєРЅРѕ РІСЂРµРјРµРЅРё | Р‘Р»РѕРєРёСЂРѕРІРєР° |
|----------|--------------|--------------|------------|
| Login | 5 | 15 РјРёРЅСѓС‚ | 30 РјРёРЅСѓС‚ |
| Register | 3 | 1 С‡Р°СЃ | 1 С‡Р°СЃ |
| Forgot password | 3 | 1 С‡Р°СЃ | 1 С‡Р°СЃ |
| Verification request | 5 | 24 С‡Р°СЃР° | 24 С‡Р°СЃР° |

### РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ

```javascript
const { loginLimiter, registerLimiter } = require('./rateLimiter');

router.post('/login', async (req, res, next) => {
  await loginLimiter(req, res, next);
  // ... Р»РѕРіРёРєР° РІС…РѕРґР°
});
```

### РћС‚РІРµС‚ РїСЂРё РїСЂРµРІС‹С€РµРЅРёРё Р»РёРјРёС‚Р°

```json
{
  "error": {
    "message": "Too many attempts. Try again in 30 minutes.",
    "code": "RATE_LIMIT_EXCEEDED",
    "statusCode": 429,
    "details": {
      "retryAfter": 1800
    }
  }
}
```

---

## РўРёРїС‹ РѕС€РёР±РѕРє

### Network РѕС€РёР±РєРё
**Р“РґРµ РѕР±СЂР°Р±Р°С‚С‹РІР°СЋС‚СЃСЏ:** `src/services/errorHandler.ts`

**РџРѕРІРµРґРµРЅРёРµ:**
- РџСЂРѕРІРµСЂРєР° `navigator.onLine`
- Toast: "РћС€РёР±РєР° СЃРµС‚Рё. РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕРґРєР»СЋС‡РµРЅРёРµ."
- Р›РѕРіРёСЂРѕРІР°РЅРёРµ РІ РєРѕРЅСЃРѕР»СЊ

### Auth РѕС€РёР±РєРё
**Р“РґРµ РѕР±СЂР°Р±Р°С‚С‹РІР°СЋС‚СЃСЏ:** `src/services/errorHandler.ts`, `src/services/api.ts`

**РџРѕРІРµРґРµРЅРёРµ:**
- 401/403 в†’ РїРµСЂРµРЅР°РїСЂР°РІР»РµРЅРёРµ РЅР° `/login`
- РћС‡РёСЃС‚РєР° localStorage
- Toast: "РЎРµСЃСЃРёСЏ РёСЃС‚РµРєР»Р°. РџРѕР¶Р°Р»СѓР№СЃС‚Р°, РІРѕР№РґРёС‚Рµ СЃРЅРѕРІР°."

### Validation РѕС€РёР±РєРё
**Р“РґРµ РѕР±СЂР°Р±Р°С‚С‹РІР°СЋС‚СЃСЏ:** `backend/src/validation.js`, `src/services/errorHandler.ts`

**РџРѕРІРµРґРµРЅРёРµ:**
- Backend: Zod `safeParse()` в†’ `ValidationError`
- Frontend: РР·РІР»РµС‡РµРЅРёРµ `error.error.details`
- Toast СЃ РїРµСЂРІС‹Рј СЃРѕРѕР±С‰РµРЅРёРµРј РѕР± РѕС€РёР±РєРµ

### Server РѕС€РёР±РєРё (5xx)
**Р“РґРµ РѕР±СЂР°Р±Р°С‚С‹РІР°СЋС‚СЃСЏ:** `backend/src/errors.js`, `src/services/errorHandler.ts`

**РџРѕРІРµРґРµРЅРёРµ:**
- Backend: `asyncHandler` в†’ `errorHandler` middleware
- Frontend: Toast "Р’РЅСѓС‚СЂРµРЅРЅСЏСЏ РѕС€РёР±РєР° СЃРµСЂРІРµСЂР°"
- Р›РѕРіРёСЂРѕРІР°РЅРёРµ СЃ СѓСЂРѕРІРЅРµРј 'error' РёР»Рё 'critical'

---

## РџСЂРµРёРјСѓС‰РµСЃС‚РІР° СЃРёСЃС‚РµРјС‹

1. вњ… **Р•РґРёРЅС‹Р№ С„РѕСЂРјР°С‚ РѕС€РёР±РѕРє** вЂ” РІСЃРµ РѕС€РёР±РєРё РІРѕР·РІСЂР°С‰Р°СЋС‚СЃСЏ РІ РѕРґРёРЅР°РєРѕРІРѕРј С„РѕСЂРјР°С‚Рµ
2. вњ… **РЎС‚СЂСѓРєС‚СѓСЂРёСЂРѕРІР°РЅРЅРѕРµ Р»РѕРіРёСЂРѕРІР°РЅРёРµ** вЂ” Р»РµРіРєРѕ РёСЃРєР°С‚СЊ Рё Р°РЅР°Р»РёР·РёСЂРѕРІР°С‚СЊ РѕС€РёР±РєРё
3. вњ… **РђРІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ РѕР±СЂР°Р±РѕС‚РєР°** вЂ” РЅРµ РЅСѓР¶РЅРѕ РїРёСЃР°С‚СЊ try/catch РІ РєР°Р¶РґРѕРј СЂРѕСѓС‚Рµ
4. вњ… **Р§РµР»РѕРІРµРєРѕС‡РёС‚Р°РµРјС‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ** вЂ” РІСЃРµ СЃРѕРѕР±С‰РµРЅРёСЏ РЅР° СЂСѓСЃСЃРєРѕРј СЏР·С‹РєРµ
5. вњ… **Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ** вЂ” РґРµС‚Р°Р»Рё РѕС€РёР±РѕРє РЅРµ СѓС‚РµРєР°СЋС‚ РЅР° РєР»РёРµРЅС‚
6. вњ… **РђСѓРґРёС‚** вЂ” РІР°Р¶РЅС‹Рµ СЃРѕР±С‹С‚РёСЏ Р»РѕРіРёСЂСѓСЋС‚СЃСЏ РѕС‚РґРµР»СЊРЅРѕ
7. вњ… **React Error Boundary** вЂ” РїРµСЂРµС…РІР°С‚ РѕС€РёР±РѕРє СЂРµРЅРґРµСЂРёРЅРіР°
8. вњ… **Zod РІР°Р»РёРґР°С†РёСЏ** вЂ” СЃС‚СЂРѕРіР°СЏ РїСЂРѕРІРµСЂРєР° РІСЃРµС… РІС…РѕРґСЏС‰РёС… РґР°РЅРЅС‹С…
9. вњ… **Retry logic** вЂ” Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ РїРѕРІС‚РѕСЂРЅР°СЏ РїРѕРїС‹С‚РєР° РґР»СЏ network РѕС€РёР±РѕРє

---

## Best Practices

### Р”РѕР±Р°РІР»РµРЅРёРµ РЅРѕРІРѕР№ РѕС€РёР±РєРё

**Backend:**
```javascript
// 1. РЎРѕР·РґР°С‚СЊ РєР»Р°СЃСЃ РѕС€РёР±РєРё РІ errors.js
class PaymentError extends AppError {
  constructor(message, details) {
    super(message, 'PAYMENT_ERROR', 402, details);
  }
}

// 2. РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РІ СЂРѕСѓС‚Рµ
throw new PaymentError('Payment failed', { transactionId });
```

**Frontend:**
```typescript
// 1. Р”РѕР±Р°РІРёС‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ РІ ERROR_MESSAGES
const ERROR_MESSAGES = {
  PAYMENT_ERROR: 'РћС€РёР±РєР° РїР»Р°С‚РµР¶Р°',
};

// 2. РћР±СЂР°Р±РѕС‚Р°С‚СЊ РІ errorHandler
errorHandler.handleApiError(error, { level: 'warning' });
```

### РћР±СЂР°Р±РѕС‚РєР° РѕС€РёР±РѕРє РІ React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { errorHandler } from '@/services/errorHandler';

function MyComponent() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    retry: 1,
    onError: (err) => {
      errorHandler.handleApiError(err, { showToast: true });
    }
  });

  if (isLoading) return <div>Р—Р°РіСЂСѓР·РєР°...</div>;
  if (error) return <div>РћС€РёР±РєР°!</div>;
  return <div>{data}</div>;
}
```

---

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [API Documentation](../backend/API.md)
- [Servers Module](./SERVERS_MODULE.md)
- [Features Inventory](./FEATURES_INVENTORY.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.md)

