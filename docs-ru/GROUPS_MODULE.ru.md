# Модуль групп (LUME)

[English](../docs/GROUPS_MODULE.md) | Русский | [中文](../docs-cn/GROUPS_MODULE.cn.md)

**Последнее обновление:** 2026-03-11
**Статус:** реализовано и используется

---

## Обзор

Группы и каналы реализованы как **типы чатов** (`group` и `channel`) в общей системе чатов. Публичные каналы поддерживают поиск и подписку; группы поддерживают заявки на вступление и управление участниками.

---

## Архитектура

### Backend

**Файлы:**
- `backend/src/api.js` — REST API чатов (группы/каналы)
- `backend/src/server.js` — WebSocket события
- `backend/src/permissions.js` — права доступа
- `backend/src/validation.js` — Zod схемы

**Таблицы БД:**
- `chats`, `chat_members`, `messages`, `chat_join_requests`, `chat_reads`

### Frontend

**Страницы:**
- `src/pages/Messages.tsx`
- `src/pages/messages/MessagesPage.tsx` — группы/каналы внутри мессенджера

**Компоненты и хуки:**
- `src/pages/messages/components/`
- `src/pages/messages/hooks/`
- `src/services/api.ts` (messagesAPI)

---

## Типы чатов

| Тип | Идентификатор | Доступ |
|-----|--------------|--------|
| `group` | `id` / `username` | приватные по умолчанию, заявки на вступление |
| `channel` | `id` / `username` | публичный поиск + подписка/отписка |

---

## Роли и права

| Роль | Ранг | Права |
|------|------|-------|
| Owner | 100 | полный доступ |
| Admin | 80 | управление участниками, редактирование чата |
| Member | 10 | чтение/отправка (канал — только owner/admin) |

---

## WebSocket события

**Клиент → Сервер:** `chat:subscribe`, `chat:unsubscribe`, `chat:read`

**Сервер → Клиент:** `new_message`, `chat:read_update`, `channel:new_message`

---

## Дополнительные API endpoints

- `POST /api/messages` — отправка сообщений в чат
- `GET /api/chats/:chatId/messages` — сообщения чата
- `GET /api/chats/public` — поиск публичных каналов
- `GET /api/chats/:id/public` — публичный канал (мета)
- `POST /api/chats/:id/subscribe` — подписка
- `DELETE /api/chats/:id/subscribe` — отписка
- `POST /api/chats/:id/join-requests` — заявка на вступление
- `GET /api/chats/:id/join-requests` — список заявок
- `POST /api/chats/:id/join-requests/:requestId` — approve/reject

---

## Безопасность

- Все endpoints защищены `authenticateToken`.
- Проверки прав: `requireMinRank`, `requireCanManageMember`.
- Zod валидация всех входящих данных.

---

## Связанные документы

- [WebSocket Architecture](./WEBSOCKET_ARCHITECTURE.ru.md)
- [Error Handling](./ERROR_HANDLING.ru.md)
- [Features Inventory](./FEATURES_INVENTORY.ru.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.md)
