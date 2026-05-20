# Архитектура WebSocket (LUME)

[English](../docs/WEBSOCKET_ARCHITECTURE.md) | Русский | [中文](../docs-cn/WEBSOCKET_ARCHITECTURE.cn.md)

**Последнее обновление:** 2026-03-19
**Статус:** реализовано и используется

---

## Обзор

LUME использует WebSocket + Redis Pub/Sub для синхронизации событий между несколькими нодами.

---

## Компоненты

| Компонент | Файл | Назначение |
|-----------|------|------------|
| WebSocket сервер | `backend/src/server.js` | WS сервер на `ws` |
| Redis клиент | `backend/src/redis.js` | Pub/Sub |
| WS адаптер | `backend/src/wsRedisAdapter.js` | Синхронизация событий |

---

## Redis интеграция

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

Каналы: `ws:new_message`, `ws:post_created`, `ws:notification`, `ws:chat_message`.

---

## WebSocket события

**Клиент → Сервер:** `register`, `ping`, `typing:start`, `typing:stop`, `message:delivered`, `chat:read`, `chat:subscribe`, `chat:unsubscribe`

**Сервер → Клиент:** `welcome`, `pong`, `typing:update`, `message:delivered`, `chat:read_update`, `presence:update`, `new_message`, `post_created`, `notification`, `notification_new`, `channel:new_message`, `channel:message_deleted`, `channel:edited`, `session_terminated`

---

## Масштабирование

1. Ноды подключаются к одному Redis.
2. События публикуются в Redis.
3. Все ноды получают событие.
4. Каждая нода отправляет его локальным клиентам.

---

## Связанные документы

- [Groups Module](./GROUPS_MODULE.ru.md)
- [Error Handling](./ERROR_HANDLING.ru.md)
- [Features Inventory](./FEATURES_INVENTORY.ru.md)
