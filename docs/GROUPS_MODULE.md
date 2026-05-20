# Groups Module (LUME)

English | [Русский](../docs-ru/GROUPS_MODULE.ru.md) | [中文](../docs-cn/GROUPS_MODULE.cn.md)

**Last updated:** 2026-03-11
**Status:** Implemented and in use

---

## Overview

Groups and channels are implemented as **chat types** (`group` and `channel`) in the shared chats system. Public channels support discovery and subscriptions; groups support join requests and member management.

---

## Architecture

### Backend

**Files:**
- `backend/src/api.js` — Chats REST API (groups/channels)
- `backend/src/server.js` — WebSocket events
- `backend/src/permissions.js` — Role-based permissions
- `backend/src/validation.js` — Zod schemas
- `backend/src/auth.js` — Authentication
- `backend/src/errors.js` — Error handling

**DB tables:**
- `chats`
- `chat_members`
- `messages`
- `chat_join_requests`
- `chat_reads`

### Frontend

**Pages:**
- `src/pages/Messages.tsx`
- `src/pages/messages/MessagesPage.tsx` — Groups/channels UI inside messenger

**Components & hooks:**
- `src/pages/messages/components/`
- `src/pages/messages/hooks/`
- `src/services/api.ts` (messagesAPI)

---

## Chat types

| Type | Identifier | Access |
|------|------------|--------|
| `group` | `id` / `username` | Private by default, join requests supported |
| `channel` | `id` / `username` | Public discovery + subscribe/unsubscribe |

---

## Roles and permissions

| Role | Rank | Key permissions |
|------|------|----------------|
| Owner | 100 | Full access, delete chat, transfer ownership |
| Admin | 80 | Manage members, edit chat |
| Member | 10 | Read/send messages (channel is read-only for non-admins) |

Rule: users cannot manage members with equal or higher rank.

---

## API endpoints (summary)

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/api/chats` | Create chat (`group`/`channel`/`private`) |
| GET | `/api/chats` | My chats (includes groups/channels) |
| PATCH | `/api/chats/:id` | Update chat (owner/admin) |
| DELETE | `/api/chats/:id` | Delete group/channel (owner) |
| POST | `/api/chats/:id/members` | Add member |
| DELETE | `/api/chats/:id/members/:userId` | Remove member |
| GET | `/api/chats/public?q=` | Public channel discovery |
| GET | `/api/chats/:id/public` | Public channel details |
| POST | `/api/chats/:id/subscribe` | Subscribe to public channel |
| DELETE | `/api/chats/:id/subscribe` | Unsubscribe from public channel |
| POST | `/api/chats/:id/join-requests` | Request join (private group) |
| GET | `/api/chats/:id/join-requests` | List join requests |
| POST | `/api/chats/:id/join-requests/:requestId` | Approve/reject request |
| GET | `/api/chats/:chatId/messages` | Chat messages |
| POST | `/api/messages` | Send message to chat |

---

## WebSocket events

**Client → Server**
- `chat:subscribe`
- `chat:unsubscribe`
- `chat:read`

**Server → Client**
- `new_message`
- `chat:read_update`
- `channel:new_message` (public channel)

---

## UI routes

- `/messages` — chats list (includes groups/channels)
- `/messages/:chatId` — open group/channel

---

## Data flow (open group/channel)

1. Fetch chats via `messagesAPI.getChats`.
2. Resolve public channel metadata when needed (`getPublicChannel`).
3. Load messages via `messagesAPI.getMessages`.
4. Subscribe to chat updates via `chat:subscribe` (WS).

---

## Security

- All endpoints require `authenticateToken`.
- Permission checks use `requireMinRank` / `requireCanManageMember`.
- Zod validation for all inputs.
- Rate limiting on key actions.

---

## Implemented features

- [x] Create chats (group/channel/private)
- [x] Public channel discovery + subscribe
- [x] Join requests for private groups
- [x] Members management (owner/admin)
- [x] Messages + attachments
- [x] WebSocket chat updates

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
- Group audit log
- Voice channels (mediasoup-client ready)

---

## Related documents

- [WebSocket Architecture](./WEBSOCKET_ARCHITECTURE.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Features Inventory](./FEATURES_INVENTORY.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.md)
