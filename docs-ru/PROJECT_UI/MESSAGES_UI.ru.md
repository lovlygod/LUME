# UI сообщений (LUME)

[English](../../docs/PROJECT_UI/MESSAGES_UI.md) | Русский | [中文](../../docs-cn/PROJECT_UI/MESSAGES_UI.cn.md)

**Последнее обновление:** 2026-03-11

---

## Обзор

Раздел личных сообщений с real-time обновлениями.

**Файлы:**
- `src/pages/messages/MessagesPage.tsx`
- `src/pages/messages/components/`
- `src/pages/messages/hooks/`

---

## Структура

- Список чатов
- Панель чата
- Композер сообщений
- Голосовые сообщения
- Исчезающие моменты (TTL)

---

## WebSocket события

- `typing:start`, `chat:read` (отправка)
- `new_message`, `typing:update`, `chat:read_update` (получение)

---

## Моменты (эпемерные медиа)

- Изображения с TTL (24 часа)
- Открытие: `POST /moments/:id/open` → ссылка на контент
- Просмотр: `POST /moments/:id/viewed`

---

## Голосовые сообщения

- Запись в композере
- Воспроизведение в сообщении
- Endpoint: `POST /messages/voice`

---

## Связанные документы

- [Overview](./OVERVIEW.ru.md)
- [Style System](./STYLE_SYSTEM.ru.md)
- [Servers UI](./SERVERS_UI.ru.md)
