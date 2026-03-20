# 群组模块（LUME）

中文 | [Русский](../docs-ru/GROUPS_MODULE.ru.md) | [English](../docs/GROUPS_MODULE.md)

**最后更新：** 2026-03-11
**状态：** 已实现并在使用

---

## 概览

群组与频道是 **聊天类型**（`group` / `channel`）。公共频道支持发现与订阅；群组支持加入申请与成员管理。

---

## 架构

### 后端

**文件：**
- `backend/src/api.js` — 聊天 REST API（群组/频道）
- `backend/src/server.js` — WebSocket 事件
- `backend/src/permissions.js` — 角色权限
- `backend/src/validation.js` — Zod 校验
- `backend/src/auth.js` — 认证
- `backend/src/errors.js` — 错误处理

**数据库表：**
- `chats`
- `chat_members`
- `messages`
- `chat_join_requests`
- `chat_reads`

### 前端

**页面：**
- `src/pages/Messages.tsx`
- `src/pages/messages/MessagesPage.tsx` — 群组/频道 UI

**组件与 hooks：**
- `src/pages/messages/components/`
- `src/pages/messages/hooks/`
- `src/services/api.ts` (messagesAPI)

---

## 聊天类型

| 类型 | 标识符 | 访问 |
|------|--------|------|
| `group` | `id` / `username` | 默认私密，支持加入申请 |
| `channel` | `id` / `username` | 公共发现 + 订阅/取消订阅 |

---

## 角色与权限

| 角色 | 级别 | 关键权限 |
|------|------|----------|
| Owner | 100 | 全权限，删除聊天，转移所有权 |
| Admin | 80 | 管理成员、编辑聊天 |
| Member | 10 | 阅读/发送消息（频道仅 owner/admin 可发言） |

规则：不能管理等级相同或更高的成员。

---

## API endpoints（摘要）

| 方法 | Endpoint | 说明 |
|------|----------|------|
| POST | `/api/chats` | 创建聊天（group/channel/private） |
| GET | `/api/chats` | 我的聊天（含群组/频道） |
| PATCH | `/api/chats/:id` | 更新聊天（owner/admin） |
| DELETE | `/api/chats/:id` | 删除聊天（owner） |
| POST | `/api/chats/:id/members` | 添加成员 |
| DELETE | `/api/chats/:id/members/:userId` | 移除成员 |
| GET | `/api/chats/public?q=` | 公开频道搜索 |
| GET | `/api/chats/:id/public` | 公开频道详情 |
| POST | `/api/chats/:id/subscribe` | 订阅频道 |
| DELETE | `/api/chats/:id/subscribe` | 取消订阅 |
| POST | `/api/chats/:id/join-requests` | 加入申请 |
| GET | `/api/chats/:id/join-requests` | 申请列表 |
| POST | `/api/chats/:id/join-requests/:requestId` | 通过/拒绝 |
| GET | `/api/chats/:chatId/messages` | 聊天消息 |
| POST | `/api/messages` | 发送消息 |

---

## WebSocket 事件

**客户端 → 服务器**
- `chat:subscribe`
- `chat:unsubscribe`
- `chat:read`

**服务器 → 客户端**
- `new_message`
- `chat:read_update`
- `channel:new_message`

---

## UI 路由

- `/messages` — 聊天列表（含群组/频道）
- `/messages/:chatId` — 打开群组/频道

---

## 数据流（群组/频道）

1. 通过 `messagesAPI.getChats` 获取聊天列表。
2. 需要时调用 `getPublicChannel` 获取公开频道元数据。
3. 通过 `messagesAPI.getMessages` 获取消息。
4. 通过 `chat:subscribe` 订阅 WS。

---

## 安全

- 所有 endpoints 需要 `authenticateToken`。
- 权限检查使用 `requireMinRank` / `requireCanManageMember`。
- 所有输入使用 Zod 校验。
- 关键操作限流。

---

## 已实现功能

- [x] 创建公共/私密群组
- [x] 群组目录（公共 + 我的）
- [x] 更新与删除群组
- [x] 加入/离开与加入申请
- [x] 角色与权限
- [x] 频道与消息
- [x] 附件
- [x] WebSocket 通知

---

## 已知问题

1. **消息发送后缓存偏移** → 发送后应失效 React Query 缓存。
2. **WS 订阅清理** → 在 `useEffect` 清理中取消订阅。
3. **上拉历史滚动跳动** → 保持滚动位置。
4. **API + WS 重复消息** → 按 `messageId` 去重。

---

## TODO

- 频道编辑/删除
- 封禁系统
- 超时（timeout）
- 置顶消息
- 消息搜索
- 已读回执
- 带过期时间的邀请
- 所有权转移
- 群组审计日志
- 语音频道（mediasoup-client ready）

---

## 相关文档

- [WebSocket Architecture](./WEBSOCKET_ARCHITECTURE.cn.md)
- [Error Handling](./ERROR_HANDLING.cn.md)
- [Features Inventory](./FEATURES_INVENTORY.cn.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.cn.md)
