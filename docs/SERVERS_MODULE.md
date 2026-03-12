# Servers Module (LUME)

English | [Русский](../docs-ru/SERVERS_MODULE.ru.md) | [中文](../docs-cn/SERVERS_MODULE.cn.md)

**Last updated:** 2026-03-11
**Status:** Implemented and in use

---

## Overview

Servers (communities) are group spaces with roles, channels, permissions, and membership workflows.

---

## Architecture

### Backend

**Files:**
- `backend/src/servers.js` — REST API routes
- `backend/src/server.js` — WebSocket events
- `backend/src/permissions.js` — Role-based permissions
- `backend/src/validation.js` — Zod schemas
- `backend/src/auth.js` — Authentication
- `backend/src/errors.js` — Error handling

**DB tables:**
- `servers`
- `server_members`
- `server_roles`
- `server_channels`
- `server_messages`
- `server_message_attachments`
- `server_join_requests`
- `server_bans`

### Frontend

**Pages:**
- `src/pages/ServersPage.tsx` — Discover/My servers
- `src/pages/ServerPage.tsx` — Server view
- `src/pages/ServerSettingsPage.tsx` — Server settings
- `src/pages/ServerMembersPage.tsx` — Members management

**Components & hooks:**
- `src/pages/server/components/`
- `src/hooks/servers.ts`
- `src/pages/server/hooks/`

---

## Server types

| Type | Identifier | Access |
|------|------------|--------|
| Public | `username` | Anyone can discover and join |
| Private | `id` | Join requests only |

---

## Roles and permissions

| Role | Rank | Key permissions |
|------|------|----------------|
| Owner | 100 | Full access, delete server, transfer ownership |
| Admin | 80 | Manage channels/roles, kick/ban, invites |
| Moderator | 50 | Moderate messages, timeouts |
| Member | 10 | Read/send messages |

Rule: users cannot manage members with equal or higher rank.

---

## API endpoints (summary)

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/api/servers` | Create server (multipart) |
| GET | `/api/servers/my` | My servers |
| GET | `/api/servers/public` | Public servers |
| GET | `/api/servers/:identifier` | Get server |
| PUT | `/api/servers/:id` | Update (owner) |
| DELETE | `/api/servers/:id` | Delete (owner) |
| POST | `/api/servers/:id/join` | Join public |
| POST | `/api/servers/:id/request-join` | Request access |
| POST | `/api/servers/:id/requests/:requestId/approve` | Approve request |
| POST | `/api/servers/:id/requests/:requestId/reject` | Reject request |
| POST | `/api/servers/:id/leave` | Leave server |
| POST | `/api/servers/:id/channels` | Create channel |
| GET | `/api/servers/:id/members` | Members list |
| PUT | `/api/servers/:serverId/members/:memberId/role` | Change role |
| DELETE | `/api/servers/:serverId/members/:memberId` | Kick member |
| GET | `/api/servers/:serverId/channels/:channelId/messages` | Channel messages |
| POST | `/api/servers/:serverId/channels/:channelId/messages` | Send message |
| POST | `/api/servers/:serverId/channels/:channelId/upload` | Upload attachments |
| POST | `/api/servers/uploads` | Upload server attachment (new) |
| DELETE | `/api/servers/:serverId/channels/:channelId/messages/:messageId` | Delete channel message |
| DELETE | `/api/servers/:serverId/channels/:channelId` | Delete channel |
| POST | `/api/servers/:serverId/icon` | Upload server icon |
| DELETE | `/api/servers/:serverId/icon` | Delete server icon |
| GET | `/api/servers/:id/roles` | Get server roles |

---

## WebSocket events

**Client → Server**
- `server:subscribe`
- `server:unsubscribe`
- `server:message_read`

**Server → Client**
- `server:created`
- `server:deleted`
- `server:member_joined`
- `server:member_left`
- `server:join_request`
- `server:join_request_updated`
- `server:channel_created`
- `channel:new_message`

---

## UI routes

- `/servers` — catalog
- `/server/:identifier` — entry page
- `/server/:identifier/channel/:channelName` — channel chat
- `/server/:identifier/settings` — settings
- `/server/:identifier/members` — members

---

## Data flow (open server)

1. Fetch server list via `useMyServers` / `usePublicServers`.
2. Load server metadata via `useServer(identifier)`.
3. Load channel messages via `useChannelMessages(serverId, channelId)`.
4. Subscribe to `channel:new_message` for real-time updates.

---

## Security

- All endpoints require `authenticateToken`.
- Permission checks use `requireMinRank` / `requireCanManageMember`.
- Zod validation for all inputs.
- Rate limiting on key actions.

---

## Implemented features

- [x] Create public/private servers
- [x] Server catalog (public + my)
- [x] Update and delete server
- [x] Join/leave and join requests
- [x] Roles and permissions
- [x] Channels and messages
- [x] Attachments
- [x] WebSocket notifications

---

## Known pitfalls

1. **Cache drift** after message send → invalidate React Query caches.
2. **WS subscription cleanup** → unsubscribe in `useEffect` cleanup.
3. **Scroll jump** when prepending older messages → persist scroll position.
4. **Duplicate messages** from API + WS → de-dupe by `messageId`.

---

## TODO

- Channel edit/delete
- Ban system
- Timeouts
- Pin messages
- Message search
- Read receipts
- Invites with expiry
- Ownership transfer
- Server audit log
- Voice channels (mediasoup-client ready)

---

## Related documents

- [WebSocket Architecture](./WEBSOCKET_ARCHITECTURE.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Features Inventory](./FEATURES_INVENTORY.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.md)
