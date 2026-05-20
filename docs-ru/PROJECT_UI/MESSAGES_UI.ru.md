# UI сообщений (LUME)

[English](../../docs/PROJECT_UI/MESSAGES_UI.md) | Русский | [中文](../../docs-cn/PROJECT_UI/MESSAGES_UI.cn.md)

**Последнее обновление:** 2026-05-19

---

## Обзор

Раздел личных сообщений с real-time обновлениями.

**Файлы:**
- Page: `src/pages/Messages.tsx` → `src/pages/messages/MessagesPage.tsx`
- Components: `src/pages/messages/components/`
- Hooks: `src/pages/messages/hooks/`

---

## Структура страницы

```
Список чатов (слева)
Панель чата (справа)
```

---

## Список чатов

**Файл:** `src/pages/messages/components/ChatList.tsx`

- Поиск
- Элементы чатов с счётчиком непрочитанных

---

## Панель чата

**Файл:** `src/pages/messages/components/ChatPanel.tsx`

- Хедер: аватар, имя, присутствие
- Список сообщений
- Композер

---

## Список сообщений и пузыри

**Файл:** `src/pages/messages/components/MessageList.tsx`

- Поддержка ответов и вложений
- Статус прочтения для своих сообщений
- Индикатор печати
- Голосовые сообщения (запись + воспроизведение)
- Исчезающие "моменты" с TTL и отслеживанием просмотра
- **NPM Package Preview** — автоматическое определение команд `npm <package>`

---

## NPM Package Preview

**Детекция:** `src/utils/npmDetector.ts`

- Паттерн: `npm <package>` (например, `npm react`, `npm express`, `npm @types/node`)
- Регулярное выражение: `/^npm\s+([@a-z0-9-/]+)/i`

**Компонент:** `src/components/npm/NpmPackageCard.tsx`

- Glass panel UI с hover эффектами
- Отображает: имя, версию, описание, ссылку на npmjs.com
- Loading skeleton при загрузке
- Fallback если пакет не найден

**Бэкенд:** `backend/src/npm.js`

- Endpoint: `GET /api/npm/:packageName`
- Запрос к `https://registry.npmjs.org/:packageName`
- Возвращает: `{ name, version, description, url }`
- Кеш в памяти (15 мин TTL)

---

## Композер

**Файл:** `src/pages/messages/components/MessageComposer.tsx`

- Панель ответа
- Вложения
- Кнопка отправки
- Переключатель моментов (эфемерное фото)
- Голосовой рекордер

---

## Состояния

| Состояние | Поведение |
|-----------|-----------|
| Загрузка | Skeleton список |
| Пусто | "Нет чатов" плейсхолдер |
| Ошибка | Кнопка повтора |

---

## WebSocket события

**Отправка:** `typing:start`, `chat:read`

**Получение:** `new_message`, `typing:update`, `chat:read_update`

---

## Поведение при скролле

- Автоскролл к новому сообщению
- Сохранение позиции при загрузке истории

---

## Моменты (эпемерные медиа)

- TTL-based эфемерные изображения (24 часа)
- Открытие: `POST /moments/:id/open` → подписанный URL контента
- Статус просмотра: `POST /moments/:id/viewed`
- Скрытие если уже просмотрено

---

## Голосовые сообщения

- Запись в композере
- Воспроизведение в пузыре сообщения
- Endpoint: `POST /messages/voice`

---

## Хуки

- `useChats`
- `useChatMessages`
- `useSendMessage`
- `useChatWs`

---

## Связанные документы

- [Overview](./OVERVIEW.ru.md)
- [Style System](./STYLE_SYSTEM.ru.md)
- [Groups UI](./GROUPS_UI.ru.md)
