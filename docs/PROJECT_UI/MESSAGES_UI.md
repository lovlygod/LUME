# LUME Messages UI

English | [Русский](./MESSAGES_UI.ru.md)

**Last updated:** 2026-03-11

---

## Overview

Messages provide private 1:1 chats with real-time updates.

**Files:**
- Page: `src/pages/Messages.tsx` → `src/pages/messages/MessagesPage.tsx`
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
- Ephemeral “moment” messages with TTL and view tracking

---

## Composer

**File:** `src/pages/messages/components/MessageComposer.tsx`

- Reply bar
- Attachments
- Send button
- Moment toggle (ephemeral image)
- Voice recorder

---

## States

| State | Behavior |
|------|----------|
| Loading | Skeleton list |
| Empty | “No chats yet” placeholder |
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

## Moments (ephemeral media)

- TTL-based ephemeral images (24 hours)
- Open token flow: `POST /moments/:id/open` → signed content URL
- Viewed status tracked via `POST /moments/:id/viewed`
- Hidden if already viewed

---

## Voice messages

- Recording UI in chat composer
- Playback UI in message bubble
- Upload endpoint: `POST /messages/voice`

---

## Related documents

- [Overview](./OVERVIEW.md)
- [Style System](./STYLE_SYSTEM.md)
- [Servers UI](./SERVERS_UI.md)
