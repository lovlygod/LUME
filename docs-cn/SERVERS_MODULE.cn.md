# 服务器模块（LUME）

中文 | [Русский](../docs-ru/SERVERS_MODULE.ru.md) | [English](../docs/SERVERS_MODULE.md)

**最后更新：** 2026-03-11
**状态：** 已实现并在使用

---

## 概览

服务器（communities）是包含角色、频道、权限和成员流程的群组空间。

---

## 架构

### 后端

**文件：**
- `backend/src/servers.js` — REST API 路由
- `backend/src/server.js` — WebSocket 事件
- `backend/src/permissions.js` — 角色权限
- `backend/src/validation.js` — Zod 校验
- `backend/src/auth.js` — 认证
- `backend/src/errors.js` — 错误处理

**数据库表：**
- `servers`
- `server_members`
- `server_roles`
- `server_channels`
- `server_messages`
- `server_message_attachments`
- `server_join_requests`
- `server_bans`

### 前端

**页面：**
- `src/pages/ServersPage.tsx` — 发现/我的服务器
- `src/pages/ServerPage.tsx` — 服务器视图
- `src/pages/ServerSettingsPage.tsx` — 服务器设置
- `src/pages/ServerMembersPage.tsx` — 成员管理

**组件与 hooks：**
- `src/pages/server/components/`
- `src/hooks/servers.ts`
- `src/pages/server/hooks/`

---

## 服务器类型

| 类型 | 标识符 | 访问 |
|------|--------|------|
| Public | `username` | 任何人可发现并加入 |
| Private | `id` | 通过加入申请 |

---

## 角色与权限

| 角色 | 级别 | 关键权限 |
|------|------|----------|
| Owner | 100 | 全权限，删除服务器，转移所有权 |
| Admin | 80 | 管理频道/角色，踢人/封禁，邀请 |
| Moderator | 50 | 管理消息，超时 |
| Member | 10 | 阅读/发送消息 |

规则：不能管理等级相同或更高的成员。

---

## API endpoints（摘要）

| 方法 | Endpoint | 说明 |
|------|----------|------|
| POST | `/api/servers` | 创建服务器（multipart） |
| GET | `/api/servers/my` | 我的服务器 |
| GET | `/api/servers/public` | 公共服务器 |
| GET | `/api/servers/:identifier` | 获取服务器 |
| PUT | `/api/servers/:id` | 更新（owner） |
| DELETE | `/api/servers/:id` | 删除（owner） |
| POST | `/api/servers/:id/join` | 加入公共服务器 |
| POST | `/api/servers/:id/request-join` | 申请加入 |
| POST | `/api/servers/:id/requests/:requestId/approve` | 通过申请 |
| POST | `/api/servers/:id/requests/:requestId/reject` | 拒绝申请 |
| POST | `/api/servers/:id/leave` | 离开服务器 |
| POST | `/api/servers/:id/channels` | 创建频道 |
| GET | `/api/servers/:id/members` | 成员列表 |
| PUT | `/api/servers/:serverId/members/:memberId/role` | 变更角色 |
| DELETE | `/api/servers/:serverId/members/:memberId` | 踢出成员 |
| GET | `/api/servers/:serverId/channels/:channelId/messages` | 频道消息 |
| POST | `/api/servers/:serverId/channels/:channelId/messages` | 发送消息 |
| POST | `/api/servers/:serverId/channels/:channelId/upload` | 上传附件 |
| POST | `/api/servers/uploads` | 上传服务器附件（新增） |
| DELETE | `/api/servers/:serverId/channels/:channelId/messages/:messageId` | 删除频道消息 |
| DELETE | `/api/servers/:serverId/channels/:channelId` | 删除频道 |
| POST | `/api/servers/:serverId/icon` | 上传服务器图标 |
| DELETE | `/api/servers/:serverId/icon` | 删除服务器图标 |
| GET | `/api/servers/:id/roles` | 获取服务器角色 |

---

## WebSocket 事件

**客户端 → 服务器**
- `server:subscribe`
- `server:unsubscribe`
- `server:message_read`

**服务器 → 客户端**
- `server:created`
- `server:deleted`
- `server:member_joined`
- `server:member_left`
- `server:join_request`
- `server:join_request_updated`
- `server:channel_created`
- `channel:new_message`

---

## UI 路由

- `/servers` — 目录
- `/server/:identifier` — 入口页
- `/server/:identifier/channel/:channelName` — 频道聊天
- `/server/:identifier/settings` — 设置
- `/server/:identifier/members` — 成员

---

## 数据流（打开服务器）

1. 通过 `useMyServers` / `usePublicServers` 获取服务器列表。
2. 通过 `useServer(identifier)` 获取服务器元数据。
3. 通过 `useChannelMessages(serverId, channelId)` 获取频道消息。
4. 订阅 `channel:new_message` 进行实时更新。

---

## 安全

- 所有 endpoints 需要 `authenticateToken`。
- 权限检查使用 `requireMinRank` / `requireCanManageMember`。
- 所有输入使用 Zod 校验。
- 关键操作限流。

---

## 已实现功能

- [x] 创建公共/私密服务器
- [x] 服务器目录（公共 + 我的）
- [x] 更新与删除服务器
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
- 服务器审计日志
- 语音频道（mediasoup-client ready）

---

## 相关文档

- [WebSocket Architecture](./WEBSOCKET_ARCHITECTURE.cn.md)
- [Error Handling](./ERROR_HANDLING.cn.md)
- [Features Inventory](./FEATURES_INVENTORY.cn.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.cn.md)
