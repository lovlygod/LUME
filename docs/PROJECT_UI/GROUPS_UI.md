# LUME Groups UI

English | [Русский](../../docs-ru/PROJECT_UI/GROUPS_UI.ru.md) | [中文](../../docs-cn/PROJECT_UI/GROUPS_UI.cn.md)

**Last updated:** 2026-03-11

---

## Overview

Groups and channels are surfaced inside the messenger UI as chat types. Public channels are discoverable and support subscribe/unsubscribe; groups support join requests and member management.

**Files:**
- Pages: `src/pages/Messages.tsx`, `src/pages/messages/MessagesPage.tsx`
- Components: `src/pages/messages/components/`
- Hooks: `src/pages/messages/hooks/`

---

## Discovery (public channels)

- Search mode for public channels
- Channel cards open `/messages/:chatId`

### Channel card

- Icon / fallback letter
- Name, description, members count
- Action: Subscribe / Open

---

## Chat view

```
Chat header + members count
Message list + composer
```

---

## Roles & access

- `channel` is read-only for non-owner/admin
- `group` supports join requests and role-based actions

---

## Channel chat

**Header:** channel name + members count + actions

**Message list:** avatar, name, time, content, attachments

**Composer:** attachments, reply bar, send button

---

## Group settings

- Update title, username (public), avatar
- Delete group (owner)

---

## Group members

- Members list
- Role change / kick actions (owner/admin)

---

## Create chat dialog

- Type: group / channel
- Title, username (public), avatar

---

## Hooks

- `useChats`, `useChatMessages`, `useSendMessage`

---

## WebSocket events

**Send:** `chat:subscribe`

**Receive:**
- `channel:new_message`
- `chat:read_update`

---

## Related documents

- [Overview](./OVERVIEW.md)
- [Style System](./STYLE_SYSTEM.md)
- [Messages UI](./MESSAGES_UI.md)
- [Groups Module](../GROUPS_MODULE.md)
