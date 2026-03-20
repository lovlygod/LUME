# WebSocket Architecture (LUME)

English | [Русский](../docs-ru/WEBSOCKET_ARCHITECTURE.ru.md) | [中文](../docs-cn/WEBSOCKET_ARCHITECTURE.cn.md)

**Last updated:** 2026-03-11
**Status:** Implemented and in use

---

## Overview

LUME uses a Redis-backed WebSocket architecture to synchronize events across multiple Node.js instances.

---

## Architecture diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Redis Pub/Sub                         │
│  ┌─────────────┬──────────────┬──────────────┬─────────────┐ │
│  │ new_message │ post_created │ notification │ server_msg  │ │
│  └─────────────┴──────────────┴──────────────┴─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                     ▲         ▲         ▲
                     │         │         │
     ┌────────────────┼─────────┼─────────┼─────────┐
     ▼                ▼         ▼         ▼         ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Node #1 WS  │  │ Node #2 WS  │  │ Node #3 WS  │
│ Clients A/D │  │ Clients B/E │  │ Clients C/F │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## Components

| Component | File | Notes |
|-----------|------|-------|
| WebSocket server | `backend/src/server.js` | WS server using `ws` |
| Redis client | `backend/src/redis.js` | Pub/Sub integration |
| WS Redis adapter | `backend/src/wsRedisAdapter.js` | Cross-node sync |

---

## Redis integration

**Environment:**

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

**Channels:**

| Channel | Event | Description |
|---------|-------|-------------|
| `ws:new_message` | `new_message` | Private message |
| `ws:post_created` | `post_created` | New post |
| `ws:notification` | `notification` | User notification |
| `ws:chat_message` | `chat_message` | Chat channel message |

**Message format:**

```json
{
  "channel": "ws:new_message",
  "data": { "...": "..." },
  "timestamp": "2026-03-05T12:00:00.000Z",
  "nodeId": 12345
}
```

`nodeId` is the process PID and is used to ignore self-published messages.

---

## WebSocket events

**Client → Server**

| Event | Purpose |
|-------|---------|
| `register` | Register user in WS |
| `ping` | Keep-alive |
| `typing:start` / `typing:stop` | Typing indicator |
| `message:delivered` | Delivery ack |
| `chat:read` | Mark chat as read |
| `chat:subscribe` | Subscribe to chat updates |
| `chat:unsubscribe` | Unsubscribe |
| `chat:read` | Read receipt in chat |

**Server → Client**

| Event | Redis sync | Purpose |
|-------|------------|---------|
| `welcome` | ❌ | Greeting on connect |
| `pong` | ❌ | Ping response |
| `typing:update` | ❌ | Typing indicator update |
| `message:delivered` | ❌ | Delivery status |
| `chat:read_update` | ❌ | Read status update |
| `presence:update` | ❌ | Online/offline |
| `new_message` | ✅ | New private message |
| `post_created` | ✅ | New post |
| `notification` | ✅ | Notification |
| `notification_new` | ✅ | Notification (client payload) |
| `channel:new_message` | ✅ | Channel message |
| `channel:message_deleted` | ✅ | Channel message deleted |
| `channel:edited` | ✅ | Channel message edited |
| `session_terminated` | ✅ | Session revoked (logout all) |

---

## Event API helpers

```javascript
sendToUser(userId, event);          // local
broadcast(event);                   // local
broadcastToChat(chatId, event); // local

sendNewMessage(data);               // Redis-synced
sendPostCreated(data);              // Redis-synced
sendNotification(data);             // Redis-synced
sendChatMessage(data);             // Redis-synced
```

---

## Scaling

1. All nodes connect to the same Redis instance.
2. Each event is published to Redis.
3. All nodes receive the event.
4. Each node delivers it to local clients.

---

## Resilience

- Redis down → local WS still works (no cross-node sync).
- Node crash → clients reconnect via load balancer.
- Graceful shutdown closes WS + Redis connections.

---

## File structure

```
backend/
├── src/
│   ├── server.js         # WS server + HTTP API
│   ├── redis.js          # Redis client
│   └── wsRedisAdapter.js # WS Redis adapter
```

---

## Dependencies

```json
{
  "dependencies": {
    "ws": "^8.19.0",
    "ioredis": "^5.4.1"
  }
}
```

---

## Diagnostics

**Health check:**

```
GET http://localhost:5000/health
```

**Example response:**

```json
{
  "status": "OK",
  "timestamp": "2026-03-05T12:00:00.000Z",
  "websocket": {
    "connected": 42,
    "users": 15,
    "onlineUsers": 15
  }
}
```

---

## Related documents

- [Groups Module](./GROUPS_MODULE.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Features Inventory](./FEATURES_INVENTORY.md)
