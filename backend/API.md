# LUME API Documentation

РџРѕР»РЅР°СЏ РґРѕРєСѓРјРµРЅС‚Р°С†РёСЏ РїРѕ РІСЃРµРј API endpoint'Р°Рј LUME.

**Base URL:** `http://localhost:5000/api`

**Swagger UI:** `http://localhost:5000/api-docs`

---

## рџ”ђ РђСѓС‚РµРЅС‚РёС„РёРєР°С†РёСЏ

Р’СЃРµ Р·Р°РїСЂРѕСЃС‹ (РєСЂРѕРјРµ `/login`, `/register`) С‚СЂРµР±СѓСЋС‚:
- **Cookie:** `token` (httpOnly)
- **Header:** `X-CSRF-Token`
- **Header:** `Authorization: Bearer <token>` (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)

---

## рџ“‘ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [Auth](#auth)
- [Users](#users)
- [Posts](#posts)
- [Messages](#messages)
- [Servers](#servers)
- [Verification](#verification)
- [Admin](#admin)
- [Uploads](#uploads)

---

## Auth

### POST `/register`
Р РµРіРёСЃС‚СЂР°С†РёСЏ РЅРѕРІРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "username": "johndoe"
}
```

**Response 201:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "verified": false
  }
}
```

**Cookies:**
- `refreshToken` (httpOnly, 30 РґРЅРµР№)
- `token` (httpOnly, 24 С‡Р°СЃР°)

**Errors:**
- `400` - Validation error (email format, password length, username format)
- `409` - Email already exists

---

### POST `/login`
Р’С…РѕРґ РІ СЃРёСЃС‚РµРјСѓ.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "bio": "...",
    "avatar": "...",
    "banner": "...",
    "verified": false
  }
}
```

**Cookies:**
- `refreshToken` (httpOnly, 30 РґРЅРµР№)
- `token` (httpOnly, 24 С‡Р°СЃР°)

**Errors:**
- `401` - Invalid credentials

---

### POST `/refresh`
РћР±РЅРѕРІР»РµРЅРёРµ access С‚РѕРєРµРЅР°.

**Cookies:** `refreshToken`

**Response 200:**
```json
{
  "token": "РЅРѕРІС‹Р№ access token"
}
```

**Cookies:**
- `token` (РѕР±РЅРѕРІР»С‘РЅРЅС‹Р№, 24 С‡Р°СЃР°)

**Errors:**
- `401` - Invalid or expired refresh token

---

### POST `/logout`
Р’С‹С…РѕРґ РёР· СЃРёСЃС‚РµРјС‹.

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

**Cookies:** `refreshToken` Рё `token` РѕС‡РёС‰Р°СЋС‚СЃСЏ

---

## Users

### GET `/profile`
РџРѕР»СѓС‡РµРЅРёРµ РґР°РЅРЅС‹С… С‚РµРєСѓС‰РµРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.

**Response 200:**
```json
{
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "bio": "Hello!",
    "avatar": "http://localhost:5000/uploads/...",
    "banner": "http://localhost:5000/uploads/...",
    "verified": false,
    "joinDate": "2024-01-01T00:00:00.000Z",
    "followersCount": 42,
    "city": "Moscow",
    "website": "https://example.com"
  }
}
```

---

### GET `/profile/:userId`
РџРѕР»СѓС‡РµРЅРёРµ РїСЂРѕС„РёР»СЏ РґСЂСѓРіРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.

**Response 200:**
```json
{
  "user": {
    "id": "1",
    "name": "John Doe",
    "username": "johndoe",
    "bio": "Hello!",
    "avatar": "...",
    "banner": "...",
    "verified": false,
    "joinDate": "2024-01-01T00:00:00.000Z",
    "followersCount": 42
  }
}
```

---

### PUT `/profile`
РћР±РЅРѕРІР»РµРЅРёРµ РїСЂРѕС„РёР»СЏ.

**Body:**
```json
{
  "name": "New Name",
  "username": "newusername",
  "bio": "Updated bio",
  "city": "Saint Petersburg",
  "website": "https://newsite.com"
}
```

**Response 200:**
```json
{
  "message": "Profile updated successfully"
}
```

---

### POST `/profile/avatar`
Р—Р°РіСЂСѓР·РєР° Р°РІР°С‚Р°СЂР°.

**Content-Type:** `multipart/form-data`

**Body:**
- `avatar`: С„Р°Р№Р» (image/jpeg, png, gif, webp, max 25MB)

**Response 200:**
```json
{
  "message": "Avatar uploaded successfully",
  "avatar": "http://localhost:5000/uploads/..."
}
```

---

### POST `/profile/banner`
Р—Р°РіСЂСѓР·РєР° Р±Р°РЅРЅРµСЂР°.

**Content-Type:** `multipart/form-data`

**Body:**
- `banner`: С„Р°Р№Р» (image/jpeg, png, gif, webp, max 25MB)

**Response 200:**
```json
{
  "message": "Banner uploaded successfully",
  "banner": "http://localhost:5000/uploads/..."
}
```

---

### DELETE `/profile`
РЈРґР°Р»РµРЅРёРµ Р°РєРєР°СѓРЅС‚Р°.

**Body:**
```json
{
  "password": "password123"
}
```

**Response 200:**
```json
{
  "message": "Account deleted permanently"
}
```

**Errors:**
- `400` - Password is required
- `401` - Invalid password

---

## Posts

### GET `/posts`
РџРѕР»СѓС‡РµРЅРёРµ Р»РµРЅС‚С‹ РїСѓР±Р»РёРєР°С†РёР№.

**Response 200:**
```json
{
  "posts": [
    {
      "id": "1",
      "userId": "1",
      "text": "Hello world!",
      "imageUrl": "http://localhost:5000/uploads/...",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "replies": 5,
      "reposts": 2,
      "resonance": 10,
      "author": {
        "name": "John Doe",
        "username": "johndoe",
        "avatar": "...",
        "verified": false
      }
    }
  ]
}
```

---

### GET `/posts/recommended`
РџРѕРїСѓР»СЏСЂРЅС‹Рµ РїРѕСЃС‚С‹ (Р·Р° 7 РґРЅРµР№).

**Response 200:**
```json
{
  "posts": [...]
}
```

---

### GET `/posts/following`
РџРѕСЃС‚С‹ РѕС‚ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№, РЅР° РєРѕС‚РѕСЂС‹С… РІС‹ РїРѕРґРїРёСЃР°РЅС‹.

**Response 200:**
```json
{
  "posts": [...]
}
```

---

### GET `/users/:userId/posts`
РџРѕСЃС‚С‹ РєРѕРЅРєСЂРµС‚РЅРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.

**Response 200:**
```json
{
  "posts": [...]
}
```

---

### POST `/posts`
РЎРѕР·РґР°РЅРёРµ РїРѕСЃС‚Р°.

**Content-Type:** `application/json` РёР»Рё `multipart/form-data`

**Body (JSON):**
```json
{
  "text": "My new post"
}
```

**Body (FormData):**
- `text`: СЃС‚СЂРѕРєР° (max 420 СЃРёРјРІРѕР»РѕРІ)
- `image`: С„Р°Р№Р» (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)

**Response 201:**
```json
{
  "message": "Post created successfully",
  "postId": 1,
  "post": { ... }
}
```

**Errors:**
- `400` - Text too long (>420 chars)

---

### DELETE `/posts/:postId`
РЈРґР°Р»РµРЅРёРµ РїРѕСЃС‚Р°.

**Response 200:**
```json
{
  "message": "Post deleted successfully"
}
```

**Errors:**
- `403` - Not your post
- `404` - Post not found

---

### POST `/posts/:postId/resonance`
РџРѕСЃС‚Р°РІРёС‚СЊ/СЃРЅСЏС‚СЊ Р»Р°Р№Рє (Resonance).

**Response 200:**
```json
{
  "message": "Post resonated",
  "resonance": 11,
  "liked": true
}
```

---

### GET `/posts/:postId/comments`
РџРѕР»СѓС‡РµРЅРёРµ РєРѕРјРјРµРЅС‚Р°СЂРёРµРІ Рє РїРѕСЃС‚Сѓ.

**Response 200:**
```json
{
  "comments": [
    {
      "id": 1,
      "userId": "1",
      "text": "Great post!",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "name": "John Doe",
      "username": "johndoe",
      "avatar": "...",
      "verified": false
    }
  ]
}
```

---

### POST `/posts/:postId/comments`
Р”РѕР±Р°РІР»РµРЅРёРµ РєРѕРјРјРµРЅС‚Р°СЂРёСЏ.

**Body:**
```json
{
  "text": "Great post!"
}
```

**Response 201:**
```json
{
  "message": "Comment added",
  "commentId": 1,
  "comment": { ... }
}
```

---

### POST `/posts/:postId/report`
Р–Р°Р»РѕР±Р° РЅР° РїРѕСЃС‚.

**Body:**
```json
{
  "reason": "Inappropriate content"
}
```

**Response 201:**
```json
{
  "message": "Report submitted",
  "reportId": 1
}
```

---

## Messages

### GET `/messages`
РџРѕР»СѓС‡РµРЅРёРµ СЃРїРёСЃРєР° С‡Р°С‚РѕРІ.

**Response 200:**
```json
{
  "chats": [
    {
      "id": "1",
      "userId": "2",
      "name": "Jane Doe",
      "username": "janedoe",
      "avatar": "...",
      "verified": false,
      "lastMessage": "Hello!",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "unread": 3
    }
  ]
}
```

---

### GET `/messages/:userId`
РСЃС‚РѕСЂРёСЏ РїРµСЂРµРїРёСЃРєРё СЃ РїРѕР»СЊР·РѕРІР°С‚РµР»РµРј.

**Response 200:**
```json
{
  "messages": [
    {
      "id": "1",
      "senderId": "2",
      "text": "Hello!",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "own": false,
      "attachments": [],
      "deletedForMe": false,
      "deletedForAll": false
    }
  ]
}
```

---

### POST `/messages`
РћС‚РїСЂР°РІРєР° СЃРѕРѕР±С‰РµРЅРёСЏ.

**Body:**
```json
{
  "receiverId": "2",
  "text": "Hello!",
  "attachmentIds": ["1", "2"]
}
```

**Response 201:**
```json
{
  "message": "Message sent",
  "messageId": 1,
  "attachments": [...]
}
```

---

### DELETE `/messages/:messageId?scope=me|all`
РЈРґР°Р»РµРЅРёРµ СЃРѕРѕР±С‰РµРЅРёСЏ.

**Query Parameters:**
- `scope`: `me` (РґР»СЏ СЃРµР±СЏ) РёР»Рё `all` (РґР»СЏ РІСЃРµС…, С‚РѕР»СЊРєРѕ 15 РјРёРЅ)

**Response 200:**
```json
{
  "message": "Message deleted"
}
```

---

### GET `/messages/search`
РџРѕР»РЅРѕС‚РµРєСЃС‚РѕРІС‹Р№ РїРѕРёСЃРє СЃРѕРѕР±С‰РµРЅРёР№ (Meilisearch).

**Query Parameters:**
- `q`: РџРѕРёСЃРєРѕРІС‹Р№ Р·Р°РїСЂРѕСЃ (РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ)
- `limit`: РњР°РєСЃРёРјР°Р»СЊРЅРѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ, РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ 50)

**Features:**
- Fuzzy search (Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРµ РёСЃРїСЂР°РІР»РµРЅРёРµ РѕРїРµС‡Р°С‚РѕРє)
- Partial match (РїРѕРёСЃРє РїРѕ С‡Р°СЃС‚Рё СЃР»РѕРІР°)
- РЎРѕСЂС‚РёСЂРѕРІРєР° РїРѕ РґР°С‚Рµ (РЅРѕРІС‹Рµ СЃРЅР°С‡Р°Р»Р°)
- РћРіСЂР°РЅРёС‡РµРЅРёРµ: С‚РѕР»СЊРєРѕ С‡Р°С‚С‹, РіРґРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЏРІР»СЏРµС‚СЃСЏ СѓС‡Р°СЃС‚РЅРёРєРѕРј

**Response 200:**
```json
{
  "query": "hello",
  "results": [
    {
      "id": "123",
      "text": "Hello! How are you?",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "chatId": "45",
      "user": {
        "id": "2",
        "name": "John Doe",
        "username": "johndoe",
        "avatar": "...",
        "verified": false
      },
      "contact": {
        "id": "1",
        "name": "Jane Doe",
        "username": "janedoe",
        "avatar": "...",
        "verified": true
      }
    }
  ],
  "total": 1
}
```

**Errors:**
- `400` - Search query "q" is required

---

### POST `/chats/:chatId/read`
РћС‚РјРµС‚РёС‚СЊ С‡Р°С‚ РєР°Рє РїСЂРѕС‡РёС‚Р°РЅРЅС‹Р№.

**Body:**
```json
{
  "lastReadMessageId": "123"
}
```

**Response 200:**
```json
{
  "message": "Chat marked as read"
}
```

---

### GET `/chats/:chatId/read-status`
РџРѕР»СѓС‡РёС‚СЊ СЃС‚Р°С‚СѓСЃ РїСЂРѕС‡С‚РµРЅРёСЏ.

**Response 200:**
```json
{
  "chatId": "1",
  "userId": "2",
  "lastReadMessageId": "100"
}
```

---

## Servers

### POST `/servers`
РЎРѕР·РґР°РЅРёРµ СЃРµСЂРІРµСЂР°.

**Content-Type:** `multipart/form-data`

**Body:**
- `name`: СЃС‚СЂРѕРєР° (РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ)
- `username`: СЃС‚СЂРѕРєР° (min 5 СЃРёРјРІРѕР»РѕРІ, РґР»СЏ public)
- `type`: `public` РёР»Рё `private`
- `description`: СЃС‚СЂРѕРєР° (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
- `icon`: С„Р°Р№Р» (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ, image)

**Response 201:**
```json
{
  "message": "Server created successfully",
  "server": {
    "id": 1,
    "name": "Gaming Hub",
    "username": "gaminghub",
    "type": "public",
    "description": "...",
    "iconUrl": "...",
    "ownerId": 1
  }
}
```

**Errors:**
- `400` - Validation error (username format, name required)
- `409` - Username already exists

---

### GET `/servers/my`
РњРѕРё СЃРµСЂРІРµСЂС‹.

**Response 200:**
```json
{
  "servers": [
    {
      "id": 1,
      "username": "gaminghub",
      "name": "Gaming Hub",
      "type": "public",
      "role": {
        "id": 1,
        "name": "Owner",
        "rank": 100
      }
    }
  ]
}
```

---

### GET `/servers/public`
РџСѓР±Р»РёС‡РЅС‹Рµ СЃРµСЂРІРµСЂС‹.

**Response 200:**
```json
{
  "servers": [...]
}
```

---

### GET `/servers/:identifier`
РџРѕР»СѓС‡РёС‚СЊ СЃРµСЂРІРµСЂ РїРѕ username РёР»Рё ID.

**Response 200:**
```json
{
  "server": {
    "id": 1,
    "username": "gaminghub",
    "name": "Gaming Hub",
    "type": "public",
    "isMember": true,
    "role": {
      "id": 3,
      "name": "Member",
      "rank": 10
    },
    "channels": [
      {
        "id": 1,
        "name": "general",
        "type": "text",
        "position": 0
      }
    ]
  }
}
```

**Errors:**
- `404` - Server not found

---

### PUT `/servers/:id`
РћР±РЅРѕРІРёС‚СЊ СЃРµСЂРІРµСЂ (Owner).

**Body:**
```json
{
  "name": "New Name",
  "description": "...",
  "username": "newusername"
}
```

**Response 200:**
```json
{
  "message": "Server updated"
}
```

**Errors:**
- `403` - Not owner
- `404` - Server not found

---

### DELETE `/servers/:id`
РЈРґР°Р»РёС‚СЊ СЃРµСЂРІРµСЂ (Owner).

**Response 200:**
```json
{
  "message": "Server deleted"
}
```

**Errors:**
- `403` - Not owner
- `404` - Server not found

---

### POST `/servers/:id/join`
Р’СЃС‚СѓРїРёС‚СЊ РІ РїСѓР±Р»РёС‡РЅС‹Р№ СЃРµСЂРІРµСЂ.

**Response 200:**
```json
{
  "message": "Joined server successfully"
}
```

**Errors:**
- `400` - Already a member
- `403` - Cannot join private server (use request-join)
- `404` - Server not found

---

### POST `/servers/:id/request-join`
РџРѕРґР°С‚СЊ Р·Р°СЏРІРєСѓ РІ РїСЂРёРІР°С‚РЅС‹Р№ СЃРµСЂРІРµСЂ.

**Response 200:**
```json
{
  "message": "Join request sent",
  "requestId": 1
}
```

**Errors:**
- `400` - Already a member or pending request
- `403` - Can only request join to private servers
- `404` - Server not found

---

### GET `/servers/:id/requests`
РџРѕР»СѓС‡РёС‚СЊ Р·Р°СЏРІРєРё (Owner).

**Response 200:**
```json
{
  "requests": [
    {
      "id": 1,
      "userId": 2,
      "name": "Jane Doe",
      "username": "janedoe",
      "avatar": "...",
      "verified": false,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `403` - Not owner

---

### POST `/servers/:id/requests/:requestId/approve`
РћРґРѕР±СЂРёС‚СЊ Р·Р°СЏРІРєСѓ (Owner).

**Response 200:**
```json
{
  "message": "Request approved"
}
```

**Errors:**
- `403` - Not owner
- `404` - Request not found

---

### POST `/servers/:id/requests/:requestId/reject`
РћС‚РєР»РѕРЅРёС‚СЊ Р·Р°СЏРІРєСѓ (Owner).

**Response 200:**
```json
{
  "message": "Request rejected"
}
```

**Errors:**
- `403` - Not owner
- `404` - Request not found

---

### POST `/servers/:id/leave`
РџРѕРєРёРЅСѓС‚СЊ СЃРµСЂРІРµСЂ.

**Response 200:**
```json
{
  "message": "Left server successfully"
}
```

**Errors:**
- `400` - Not a member
- `403` - Owner cannot leave
- `404` - Server not found

---

### POST `/servers/:id/channels`
РЎРѕР·РґР°С‚СЊ РєР°РЅР°Р» (Admin+).

**Body:**
```json
{
  "name": "new-channel"
}
```

**Response 201:**
```json
{
  "message": "Channel created",
  "channel": {
    "id": 1,
    "name": "new-channel",
    "type": "text",
    "position": 0
  }
}
```

**Errors:**
- `403` - Insufficient rank (Admin+ required)
- `404` - Server not found

---

### GET `/servers/:serverId/channels/:channelId/messages`
РџРѕР»СѓС‡РёС‚СЊ СЃРѕРѕР±С‰РµРЅРёСЏ РєР°РЅР°Р»Р°.

**Query Parameters:**
- `limit`: (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ, default 50)
- `before`: (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ, ID СЃРѕРѕР±С‰РµРЅРёСЏ РґР»СЏ РїР°РіРёРЅР°С†РёРё)

**Response 200:**
```json
{
  "messages": [
    {
      "id": "1",
      "channelId": "1",
      "userId": "1",
      "text": "Hello!",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "author": {
        "id": "1",
        "name": "John Doe",
        "username": "johndoe",
        "avatar": "...",
        "verified": false
      },
      "attachments": []
    }
  ]
}
```

**Errors:**
- `403` - Not a member
- `404` - Channel not found

---

### POST `/servers/:serverId/channels/:channelId/messages`
РћС‚РїСЂР°РІРёС‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ РІ РєР°РЅР°Р».

**Body:**
```json
{
  "text": "Hello channel!",
  "attachmentIds": ["1", "2"]
}
```

**Response 201:**
```json
{
  "message": "Message sent",
  "messageId": 1
}
```

**Errors:**
- `403` - Not a member
- `404` - Channel not found

---

### DELETE `/servers/:serverId/channels/:channelId/messages/:messageId`
РЈРґР°Р»РёС‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ (Author/Moderator+).

**Body:**
```json
{
  "scope": "all"
}
```

**Response 200:**
```json
{
  "message": "Message deleted"
}
```

**Errors:**
- `403` - Insufficient permissions
- `404` - Message not found

---

### GET `/servers/:id/members`
РџРѕР»СѓС‡РёС‚СЊ СѓС‡Р°СЃС‚РЅРёРєРѕРІ СЃРµСЂРІРµСЂР°.

**Response 200:**
```json
{
  "members": [
    {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "avatar": "...",
      "verified": false,
      "role": {
        "id": 1,
        "name": "Owner",
        "rank": 100
      }
    }
  ]
}
```

**Errors:**
- `403` - Not a member

---

### PUT `/servers/:serverId/members/:memberId/role`
РР·РјРµРЅРёС‚СЊ СЂРѕР»СЊ СѓС‡Р°СЃС‚РЅРёРєР° (Admin+).

**Body:**
```json
{
  "roleId": 2
}
```

**Response 200:**
```json
{
  "message": "Role updated"
}
```

**Errors:**
- `403` - Insufficient rank
- `404` - Member not found

---

### DELETE `/servers/:serverId/members/:memberId`
РљРёРєРЅСѓС‚СЊ СѓС‡Р°СЃС‚РЅРёРєР° (Moderator+).

**Response 200:**
```json
{
  "message": "Member kicked"
}
```

**Errors:**
- `403` - Insufficient rank (cannot manage higher rank)
- `404` - Member not found

---

## Verification

### GET `/profile/:userId/verification-status`
РџРѕР»СѓС‡РёС‚СЊ СЃС‚Р°С‚СѓСЃ РІРµСЂРёС„РёРєР°С†РёРё.

**Response 200:**
```json
{
  "verificationStatus": {
    "status": "approved",
    "reason": "Content creator",
    "tiktokVideoUrl": "https://tiktok.com/...",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "reviewedAt": "2024-01-02T12:00:00.000Z",
    "reviewerName": "Admin"
  }
}
```

---

### POST `/profile/verification-request`
РџРѕРґР°С‚СЊ Р·Р°СЏРІРєСѓ РЅР° РІРµСЂРёС„РёРєР°С†РёСЋ.

**Body:**
```json
{
  "reason": "I'm a content creator",
  "tiktokVideoUrl": "https://tiktok.com/@user/video/123"
}
```

**Response 201:**
```json
{
  "message": "Verification request submitted",
  "requestId": 1
}
```

**Errors:**
- `400` - Invalid TikTok URL
- `409` - Pending request already exists

---

## Admin

### GET `/admin/verification-requests`
РџРѕР»СѓС‡РёС‚СЊ РІСЃРµ Р·Р°СЏРІРєРё РЅР° РІРµСЂРёС„РёРєР°С†РёСЋ.

**Response 200:**
```json
{
  "requests": [
    {
      "id": 1,
      "userId": 2,
      "name": "Jane Doe",
      "username": "janedoe",
      "email": "jane@example.com",
      "reason": "Content creator",
      "tiktokVideoUrl": "https://tiktok.com/...",
      "status": "pending",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### POST `/admin/review-verification-request/:requestId`
Р Р°СЃСЃРјРѕС‚СЂРµС‚СЊ Р·Р°СЏРІРєСѓ.

**Body:**
```json
{
  "status": "approved",
  "reviewNotes": "Looks good!"
}
```

**Response 200:**
```json
{
  "message": "Request reviewed"
}
```

**Errors:**
- `400` - Invalid status

---

### GET `/admin/users`
РџРѕР»СѓС‡РёС‚СЊ РІСЃРµС… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.

**Response 200:**
```json
{
  "users": [...]
}
```

---

### GET `/admin/post-reports`
РџРѕР»СѓС‡РёС‚СЊ Р¶Р°Р»РѕР±С‹ РЅР° РїРѕСЃС‚С‹.

**Response 200:**
```json
{
  "reports": [
    {
      "id": 1,
      "postId": 5,
      "postText": "...",
      "postImage": "...",
      "reporterName": "John",
      "reporterUsername": "john",
      "postAuthorName": "Jane",
      "postAuthorUsername": "jane",
      "reason": "Spam",
      "status": "pending",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### POST `/admin/post-reports/:reportId`
Р Р°СЃСЃРјРѕС‚СЂРµС‚СЊ Р¶Р°Р»РѕР±Сѓ.

**Body:**
```json
{
  "action": "delete_post",
  "reviewNotes": "Confirmed spam"
}
```

**Response 200:**
```json
{
  "message": "Report reviewed"
}
```

**Errors:**
- `400` - Invalid action

---

## Uploads

### POST `/uploads`
Р—Р°РіСЂСѓР·РёС‚СЊ С„Р°Р№Р».

**Content-Type:** `multipart/form-data`

**Body:**
- `file`: С„Р°Р№Р» (max 10MB)

**Response 201:**
```json
{
  "message": "File uploaded successfully",
  "attachmentId": "123",
  "url": "http://localhost:5000/uploads/...",
  "type": "image",
  "mime": "image/jpeg",
  "size": 102400
}
```

**Errors:**
- `400` - File too large or invalid type

---

### GET `/attachments/:attachmentId`
РџРѕР»СѓС‡РёС‚СЊ РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ РІР»РѕР¶РµРЅРёРё.

**Response 200:**
```json
{
  "attachment": {
    "id": "123",
    "url": "http://localhost:5000/uploads/...",
    "type": "image",
    "mime": "image/jpeg",
    "size": 102400,
    "width": 1920,
    "height": 1080
  }
}
```

---

## РћС€РёР±РєРё

### 400 Bad Request
```json
{
  "error": {
    "message": "Validation error",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": {
      "fields": {
        "email": ["Invalid email format"]
      }
    }
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "message": "Authentication required",
    "code": "AUTH_REQUIRED",
    "statusCode": 401
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "message": "Insufficient permissions",
    "code": "FORBIDDEN",
    "statusCode": 403
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "message": "Resource not found",
    "code": "NOT_FOUND",
    "statusCode": 404
  }
}
```

### 409 Conflict
```json
{
  "error": {
    "message": "Resource already exists",
    "code": "CONFLICT",
    "statusCode": 409
  }
}
```

### 429 Too Many Requests
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

### 500 Internal Server Error
```json
{
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR",
    "statusCode": 500
  }
}
```

---

## Notifications

### GET `/notifications`
РџРѕР»СѓС‡РµРЅРёРµ СѓРІРµРґРѕРјР»РµРЅРёР№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.

**Query Parameters:**
- `limit`: (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ, default 50) - РјР°РєСЃРёРјР°Р»СЊРЅРѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ СѓРІРµРґРѕРјР»РµРЅРёР№
- `unreadOnly`: (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ) - РµСЃР»Рё `true`, РІРѕР·РІСЂР°С‰Р°РµС‚ С‚РѕР»СЊРєРѕ РЅРµРїСЂРѕС‡РёС‚Р°РЅРЅС‹Рµ

**Response 200:**
```json
{
  "notifications": [
    {
      "id": "1",
      "userId": "1",
      "type": "message",
      "entityId": "123",
      "read": false,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Notification Types:**
- `message` - РЅРѕРІРѕРµ СЃРѕРѕР±С‰РµРЅРёРµ
- `reply` - РѕС‚РІРµС‚ РЅР° РІР°С€ РїРѕСЃС‚
- `mention` - СѓРїРѕРјРёРЅР°РЅРёРµ (@username)
- `reaction` - СЂРµР°РєС†РёСЏ РЅР° РїРѕСЃС‚ (Resonance)
- `server_invite` - Р·Р°СЏРІРєР° РЅР° РІСЃС‚СѓРїР»РµРЅРёРµ РІ СЃРµСЂРІРµСЂ

---

### POST `/notifications/read`
РћС‚РјРµС‚РёС‚СЊ СѓРІРµРґРѕРјР»РµРЅРёСЏ РєР°Рє РїСЂРѕС‡РёС‚Р°РЅРЅС‹Рµ.

**Body:**
```json
{
  "notificationId": "1",
  "markAllAsRead": false
}
```

**Parameters:**
- `notificationId`: (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ) - ID СѓРІРµРґРѕРјР»РµРЅРёСЏ РґР»СЏ РѕС‚РјРµС‚РєРё
- `markAllAsRead`: (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ) - РµСЃР»Рё `true`, РѕС‚РјРµС‡Р°РµС‚ РІСЃРµ СѓРІРµРґРѕРјР»РµРЅРёСЏ РєР°Рє РїСЂРѕС‡РёС‚Р°РЅРЅС‹Рµ

**Response 200:**
```json
{
  "message": "Notification marked as read"
}
```

---

## WebSocket Events

### `notification_new`
РЎРѕР±С‹С‚РёРµ Рѕ РЅРѕРІРѕРј СѓРІРµРґРѕРјР»РµРЅРёРё.

**Payload:**
```json
{
  "type": "notification_new",
  "data": {
    "userId": "1",
    "type": "message",
    "entityId": "123",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [Features Inventory](../docs/FEATURES_INVENTORY.md)
- [Error Handling](../docs/ERROR_HANDLING.md)
- [Servers Module](../docs/SERVERS_MODULE.md)
- [README](../README.md)

