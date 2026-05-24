# UI сообщений (LUME)

[English](../../docs/PROJECT_UI/MESSAGES_UI.md) | Русский | [中文](../../docs-cn/PROJECT_UI/MESSAGES_UI.cn.md)

**Последнее обновление:** 2026-05-20

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

## Множественный выбор сообщений

**Файлы:**
- State: `src/pages/messages/MessagesPage.tsx` (состояние `selectedMessages`)
- UI: Панель инструментов над списком сообщений при выделении
- Контекстное меню: `src/components/chat/MessageContextMenu.tsx`

### Функции

- **Активация выделения:** Клик по сообщению выделяет только если уже в режиме множественного выделения (после первого действия "Выбрать")
- **Визуальная индикация:** Галочка на выбранных сообщениях (белый фон white/20 с белой рамкой)
- **Панель инструментов:** Появляется вверху области сообщений: количество выбранных + кнопки удаления + кнопка отмены
- **Очистка выделения:** Автоматически при переключении чата (useEffect)

### Права доступа

| Тип чата | Роль | Доступные действия |
|----------|------|-------------------|
| Личный | - | Выбрать, Копировать, Удалить для меня, Удалить для всех |
| Группа | - | Выбрать, Копировать, Удалить для меня, Удалить для всех (только свои сообщения) |
| Канал | участник | Только Копировать |
| Канал | админ | Ответить, Копировать |
| Канал | владелец | Ответить, Выбрать, Копировать, Удалить для всех |

### Массовое удаление

- **Endpoint:** `POST /api/chats/:chatId/messages/bulk-delete`
- **Body:** `{ messageIds: string[], scope: "me" | "all" }`
- **Лимит:** Максимум 100 сообщений за операцию
- **PostgreSQL:** Использует синтаксис `ANY($1::bigint[])` для IN clause

### Переводы

Новые ключи добавлены в `src/i18n/locales/`:
- `messages.select` — "Выбрать"
- `messages.selected` — "Выбрано"
- `messages.deleteSelected` — "Удалить выбранные"
- `messages.deleteSelectedForMe` — "Удалить для меня"
- `messages.deleteSelectedForAll` — "Удалить для всех"
- `messages.cancelSelection` — "Отменить выбор"
- `messages.maxSelectionError` — "Максимум 100 сообщений можно выбрать"

---

## Связанные документы

- [Overview](./OVERVIEW.ru.md)
- [Style System](./STYLE_SYSTEM.ru.md)
- [Groups UI](./GROUPS_UI.ru.md)
