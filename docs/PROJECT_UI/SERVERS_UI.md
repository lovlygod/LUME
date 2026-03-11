# LUME Servers UI

English | [Русский](./SERVERS_UI.ru.md)

**Last updated:** 2026-03-11

---

## Overview

Servers UI provides discovery, channel chat, and admin tools.

**Files:**
- Pages: `src/pages/ServersPage.tsx`, `src/pages/ServerPage.tsx`, `src/pages/ServerSettingsPage.tsx`, `src/pages/ServerMembersPage.tsx`
- Components: `src/pages/server/components/`
- Hooks: `src/hooks/servers.ts`, `src/pages/server/hooks/`

---

## Servers page (catalog)

- Header with Create, Discover filter, search
- Tabs: Discover / My Servers
- Grid of server cards

### Server card

- Icon / fallback letter
- Name, description, members count
- Action: Join / Request Access / Open

---

## Server page

```
ServerSidebar (channels + members)
Channel Chat (header, list, composer)
```

---

## ServerSidebar

- Channel list with active state
- Members preview
- Settings button for Owner/Admin

---

## Channel chat

**Header:** channel name + members count + actions

**Message list:** avatar, name, time, content, attachments

**Composer:** attachments, reply bar, send button

---

## Server settings

- Update icon, name, username (public), description
- Delete server (owner)

---

## Server members

- Search members
- Role sections
- Role change / kick actions (permission-based)

---

## Create server dialog

- Type: public/private
- Name, username (public), description
- Optional icon upload

---

## Hooks

- `useMyServers` / `usePublicServers`
- `useServer`
- `useCreateServer`
- `useChannelMessages`
- `useSendChannelMessage`

---

## WebSocket events

**Send:** `server:subscribe`

**Receive:**
- `channel:new_message`
- `server:member_joined`

---

## Related documents

- [Overview](./OVERVIEW.md)
- [Style System](./STYLE_SYSTEM.md)
- [Messages UI](./MESSAGES_UI.md)
- [Servers Module](../SERVERS_MODULE.md)
