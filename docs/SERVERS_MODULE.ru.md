# Модуль серверов (LUME)

[English](./SERVERS_MODULE.md) | Русский

**Последнее обновление:** 2026-03-11
**Статус:** реализовано и используется

---

## Обзор

Серверы (communities) — это групповые пространства с каналами, ролями и управлением участниками.

---

## Архитектура

### Backend

**Файлы:**
- `backend/src/servers.js` — REST API
- `backend/src/server.js` — WebSocket события
- `backend/src/permissions.js` — права доступа
- `backend/src/validation.js` — Zod схемы

**Таблицы БД:**
- `servers`, `server_members`, `server_roles`, `server_channels`, `server_messages`, `server_message_attachments`, `server_join_requests`, `server_bans`

### Frontend

**Страницы:**
- `src/pages/ServersPage.tsx`, `src/pages/ServerPage.tsx`, `src/pages/ServerSettingsPage.tsx`, `src/pages/ServerMembersPage.tsx`

**Компоненты и хуки:**
- `src/pages/server/components/`
- `src/hooks/servers.ts`
- `src/pages/server/hooks/`

---

## Типы серверов

| Тип | Идентификатор | Доступ |
|-----|--------------|--------|
| Public | `username` | свободный вход |
| Private | `id` | через заявку |

---

## Роли и права

| Роль | Ранг | Права |
|------|------|-------|
| Owner | 100 | полный доступ |
| Admin | 80 | управление каналами и ролями |
| Moderator | 50 | модерация сообщений |
| Member | 10 | чтение/отправка |

---

## WebSocket события

**Клиент → Сервер:** `server:subscribe`, `server:unsubscribe`, `server:message_read`

**Сервер → Клиент:** `server:created`, `server:deleted`, `server:member_joined`, `server:member_left`, `server:join_request`, `server:join_request_updated`, `server:channel_created`, `channel:new_message`

---

## Дополнительные API endpoints

- `POST /api/servers/uploads` — загрузка вложений
- `DELETE /api/servers/:serverId/channels/:channelId/messages/:messageId` — удаление сообщения
- `DELETE /api/servers/:serverId/channels/:channelId` — удаление канала
- `POST /api/servers/:serverId/icon` — загрузка иконки
- `DELETE /api/servers/:serverId/icon` — удаление иконки
- `GET /api/servers/:id/roles` — роли сервера

---

## Безопасность

- Все endpoints защищены `authenticateToken`.
- Проверки прав: `requireMinRank`, `requireCanManageMember`.
- Zod валидация всех входящих данных.

---

## Связанные документы

- [WebSocket Architecture](./WEBSOCKET_ARCHITECTURE.ru.md)
- [Error Handling](./ERROR_HANDLING.ru.md)
- [Features Inventory](./FEATURES_INVENTORY.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.md)
