# LUME Messages UI

English | [Р СѓСЃСЃРєРёР№](../../docs-ru/PROJECT_UI/MESSAGES_UI.ru.md) | [дё­ж–‡](../../docs-cn/PROJECT_UI/MESSAGES_UI.cn.md)

**Last updated:** 2026-05-20

---

## Overview

Messages provide private 1:1 chats with real-time updates.

**Files:**
- Page: `src/pages/Messages.tsx` в†’ `src/pages/messages/MessagesPage.tsx`
- Components: `src/pages/messages/components/`
- Hooks: `src/pages/messages/hooks/`

---

## Page structure

```
Chat List (left)
Chat Panel (right)
```

---

## Chat list

**File:** `src/pages/messages/components/ChatList.tsx`

- Search input
- Chat items with unread badge

---

## Chat panel

**File:** `src/pages/messages/components/ChatPanel.tsx`

- Header: avatar, name, presence
- Message list
- Composer

---

## Message list & bubble

**File:** `src/pages/messages/components/MessageList.tsx`

- Supports replies and attachments
- Shows read receipts for own messages
- Typing indicator
- Voice messages (record + playback)
- Ephemeral "media" messages with TTL and view tracking
- **NPM Package Preview** вЂ” automatic detection of `npm <package>` commands

---

## NPM Package Preview

**Detection:** `src/utils/npmDetector.ts`

- Pattern: `npm <package>` (e.g., `npm react`, `npm express`, `npm @types/node`)
- Regex: `/^npm\s+([@a-z0-9-/]+)/i`

**Component:** `src/components/npm/NpmPackageCard.tsx`

- Glass panel UI with hover effects
- Displays: name, version, description, npmjs link
- Loading skeleton while fetching
- Fallback if package not found

**Backend:** `backend/src/npm.js`

- Endpoint: `GET /api/npm/:packageName`
- Fetches from `https://registry.npmjs.org/:packageName`
- Returns: `{ name, version, description, url }`
- In-memory cache (15 min TTL)

---

## Composer

**File:** `src/pages/messages/components/MessageComposer.tsx`

- Reply bar
- Attachments
- Send button
- media toggle (ephemeral image)
- Voice recorder

---

## States

| State | Behavior |
|------|----------|
| Loading | Skeleton list |
| Empty | вЂњNo chats yetвЂќ placeholder |
| Error | Retry button |

---

## Hooks

- `useChats`
- `useChatMessages`
- `useSendMessage`
- `useChatWs`

---

## WebSocket events

**Send:** `typing:start`, `chat:read`

**Receive:** `new_message`, `typing:update`, `chat:read_update`

---

## Scroll behavior

- Auto-scroll to newest on new message
- Preserve scroll position when loading history

---

## Media

- - Image attachments
- Open token flow: `POST /media/:id/open` в†’ signed content URL
- Viewed status tracked via `POST /media/:id/viewed`
- Hidden if already viewed

---

## Voice messages

- Recording UI in chat composer
- Playback UI in message bubble
- Upload endpoint: `POST /messages/voice`

---

## Multi-select messages

**Files:**
- State: `src/pages/messages/MessagesPage.tsx` (`selectedMessages` state)
- UI: Toolbar appears above message list when messages are selected
- Context menu: `src/components/chat/MessageContextMenu.tsx`

### Features

- **Selection trigger:** Click on message selects only if already in multi-select mode (after first Select action)
- **Visual feedback:** Checkmark appears on selected messages (white/20 background with white border)
- **Toolbar:** Appears at top of message area showing: count selected + Delete buttons + Cancel button
- **Clear selection:** Happens automatically on chat switch (useEffect)

### Permissions

| Chat type | Role | Actions available |
|-----------|------|-------------------|
| Private | - | Select, Copy, Delete for me, Delete for all |
| Group | - | Select, Copy, Delete for me, Delete for all (own messages only) |
| Channel | participant | Copy only |
| Channel | admin | Reply, Copy |
| Channel | owner | Reply, Select, Copy, Delete for all |

### Bulk delete

- **Endpoint:** `POST /api/chats/:chatId/messages/bulk-delete`
- **Body:** `{ messageIds: string[], scope: "me" | "all" }`
- **Limit:** Max 100 messages per operation
- **PostgreSQL:** Uses `ANY($1::bigint[])` array syntax for IN clause

### Translations

New keys added to `src/i18n/locales/`:
- `messages.select` вЂ” "Select"
- `messages.selected` вЂ” "Selected"
- `messages.deleteSelected` вЂ” "Delete selected"
- `messages.deleteSelectedForMe` вЂ” "Delete for me"
- `messages.deleteSelectedForAll` вЂ” "Delete for all"
- `messages.cancelSelection` вЂ” "Cancel selection"
- `messages.maxSelectionError` вЂ” "Maximum 100 messages can be selected"

---

## Related documents

- [Overview](./OVERVIEW.md)
- [Style System](./STYLE_SYSTEM.md)
- [Groups UI](./GROUPS_UI.md)

