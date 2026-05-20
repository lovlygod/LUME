# WebSocket 架构（LUME）

中文 | [Русский](../docs-ru/WEBSOCKET_ARCHITECTURE.ru.md) | [English](../docs/WEBSOCKET_ARCHITECTURE.md)

**最后更新：** 2026-03-19
**状态：** 已实现并在使用

---

## 概览

LUME 使用 Redis 支持的 WebSocket 架构来在多节点 Node.js 实例之间同步事件。

---

## 架构图

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

## 组件

| 组件 | 文件 | 说明 |
|------|------|------|
| WebSocket 服务器 | `backend/src/server.js` | 使用 `ws` 的 WS 服务器 |
| Redis 客户端 | `backend/src/redis.js` | Pub/Sub 集成 |
| WS Redis 适配器 | `backend/src/wsRedisAdapter.js` | 跨节点同步 |

---

## Redis 集成

**环境变量：**

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

**频道：**

| 频道 | 事件 | 描述 |
|------|------|------|
| `ws:new_message` | `new_message` | 私信消息 |
| `ws:post_created` | `post_created` | 新帖子 |
| `ws:notification` | `notification` | 用户通知 |
| `ws:chat_message` | `chat_message` | 聊天频道消息 |

**消息格式：**

```json
{
  "channel": "ws:new_message",
  "data": { "...": "..." },
  "timestamp": "2026-03-05T12:00:00.000Z",
  "nodeId": 12345
}
```

`nodeId` 为进程 PID，用于忽略自身发布的消息。

---

## WebSocket 事件

**客户端 → 服务器**

| 事件 | 作用 |
|------|------|
| `register` | 注册 WS 用户 |
| `ping` | 保持连接 |
| `typing:start` / `typing:stop` | 输入指示 |
| `message:delivered` | 送达确认 |
| `chat:read` | 标记已读 |
| `chat:subscribe` | 订阅聊天更新 |
| `chat:unsubscribe` | 取消订阅 |
| `chat:read` | 聊天已读回执 |

**服务器 → 客户端**

| 事件 | Redis 同步 | 作用 |
|------|-----------|------|
| `welcome` | ❌ | 连接欢迎 |
| `pong` | ❌ | 心跳响应 |
| `typing:update` | ❌ | 输入状态更新 |
| `message:delivered` | ❌ | 送达状态 |
| `chat:read_update` | ❌ | 已读状态更新 |
| `presence:update` | ❌ | 在线/离线 |
| `new_message` | ✅ | 新私信消息 |
| `post_created` | ✅ | 新帖子 |
| `notification` | ✅ | 通知 |
| `notification_new` | ✅ | 通知（客户端负载） |
| `channel:new_message` | ✅ | 频道消息 |
| `channel:message_deleted` | ✅ | 频道消息删除 |
| `channel:edited` | ✅ | 频道消息编辑 |
| `session_terminated` | ✅ | 会话被撤销（logout all） |

---

## 事件 API 辅助

```javascript
sendToUser(userId, event);          // 本地
broadcast(event);                   // 本地
broadcastToChat(chatId, event); // 本地

sendNewMessage(data);               // Redis 同步
sendPostCreated(data);              // Redis 同步
sendNotification(data);             // Redis 同步
sendChatMessage(data);             // Redis 同步
```

---

## 扩展与缩放

1. 所有节点连接同一个 Redis。
2. 每个事件发布到 Redis。
3. 所有节点接收事件。
4. 各节点向本地客户端分发。

---

## 可靠性

- Redis 不可用 → 本地 WS 仍可工作（无跨节点同步）。
- 节点崩溃 → 客户端通过负载均衡重连。
- 优雅关闭会断开 WS 和 Redis 连接。

---

## 文件结构

```
backend/
├── src/
│   ├── server.js         # WS 服务器 + HTTP API
│   ├── redis.js          # Redis 客户端
│   └── wsRedisAdapter.js # WS Redis 适配器
```

---

## 依赖

```json
{
  "dependencies": {
    "ws": "^8.19.0",
    "ioredis": "^5.4.1"
  }
}
```

---

## 诊断

**健康检查：**

```
GET http://localhost:5000/health
```

**示例响应：**

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

## 相关文档

- [Groups Module](./GROUPS_MODULE.cn.md)
- [Error Handling](./ERROR_HANDLING.cn.md)
- [Features Inventory](./FEATURES_INVENTORY.cn.md)
