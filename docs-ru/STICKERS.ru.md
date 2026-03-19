# Стикеры

**Последнее обновление:** 2026-03-18

Документ описывает систему стикеров полностью: UI-компоненты, модели данных, backend-эндпоинты, хранение ассетов и поведение в рантайме.

---

## Обзор

Стикеры отправляются как отдельный тип сообщения (`sticker`). Клиент загружает наборы, позволяет выбрать стикер и отправляет его как сообщение. Ассеты лежат в репозитории фронтенда и синхронизируются с базой данных при старте сервера. Пользовательские наборы создаются через Sticker Bot и распространяются через deep link.

---

## UI-компоненты

- [`src/components/stickers/StickerPicker.tsx`](../src/components/stickers/StickerPicker.tsx:1)
  - Основной поповер в композере сообщений.
  - Вкладки **Мои** и **LUME**.
  - Селект паков; при выборе происходит ленивой загрузка и кэширование.

- [`src/components/stickers/StickerPackTabs.tsx`](../src/components/stickers/StickerPackTabs.tsx:1)
  - Переключатель вкладок.

- [`src/components/stickers/StickerGrid.tsx`](../src/components/stickers/StickerGrid.tsx:1)
  - Сетка карточек стикеров с hover/tap анимациями.

- [`src/components/stickers/StickerCanvas.tsx`](../src/components/stickers/StickerCanvas.tsx:1)
  - Рендер PNG на canvas с включённым сглаживанием.

- [`src/components/stickers/StickerMessage.tsx`](../src/components/stickers/StickerMessage.tsx:1)
  - Отображение стикера в списке сообщений; кликабельно для предпросмотра.

- [`src/components/stickers/StickerModal.tsx`](../src/components/stickers/StickerModal.tsx:1)
  - Модалка предпросмотра стикера и метаданных пака.
  - Кнопка добавления пака в коллекцию пользователя.

---

## UX-сценарий

1. Пользователь открывает пикер стикеров в композере.
2. Переключается между **Мои** и **LUME**.
3. Выбирает пак; стикеры подгружаются по API и кэшируются в `stickersByPack`.
4. Клик по стикеру отправляет сообщение типа `sticker`.
5. Клик по стикеру в сообщении открывает модалку с кнопкой добавления пака.

Пустое состояние: если вкладка **Мои** пустая — отображается заглушка с действием **Browse packs**.

---

## Модель данных

Типы определены в [`src/types/stickers.ts`](../src/types/stickers.ts:1):

```ts
export interface Sticker {
  id: string;
  name?: string | null;
  filePath?: string | null;
  url?: string | null;
  packId?: string | null;
}

export interface StickerPack {
  id: string;
  name: string;
  description?: string | null;
  author?: string | null;
  createdAt?: string | null;
  stickerCount?: number;
}
```

Сообщения со стикерами имеют:
- `type: "sticker"`
- `sticker_id` в БД (nullable для других типов сообщений)

---

## Хранение ассетов

Ассеты стикеров лежат в:

```
src/assets/stickers/<PackName>/<StickerName>.png
```

Временные загрузки Sticker Bot:

```
backend/sticker-uploads/
```

Сервер сканирует каталог и синхронизирует данные при старте.

---

## Backend: схема и синхронизация

Схема и синк определены в [`backend/src/api.js`](../backend/src/api.js:89):

- `sticker_packs` — метаданные паков
- `stickers` — записи стикеров с `file_path`
- `user_sticker_packs` — связь пользователь ⇄ пак
- `messages.sticker_id` — внешний ключ на `stickers`
- `sticker_bot_sessions` — состояние сценария Sticker Bot

Процесс синхронизации:
1. Скан ассетов
2. Создание отсутствующих паков
3. Добавление отсутствующих стикеров

---

## Backend API

Эндпоинты реализованы в [`backend/src/api.js`](../backend/src/api.js:783):

### Список всех паков
`GET /api/stickers/packs`

### Пак и его стикеры
`GET /api/stickers/packs/:id`

### Пак по slug (public)
`GET /api/stickers/public/slug/:slug`

Используется для deep link без авторизации.

### Пак по slug (auth)
`GET /api/stickers/slug/:slug`

### Пакеты пользователя
`GET /api/stickers/mine`

### Добавить пак пользователю
`POST /api/stickers/add-pack`

Body:
```json
{ "packId": "123" }
```

### PNG стикера
`GET /api/stickers/:id`

Возвращает PNG; включает кэширование и CSP-заголовки.

### Sticker Bot session
`GET /api/stickers/bot/session`

### Sticker Bot start
`POST /api/stickers/bot/start`

### Sticker Bot upload
`POST /api/stickers/bot/upload`

Multipart поле: `stickers` (PNG/WEBP/GIF, max 512KB, max 60 файлов).

---

## Интеграция во фронтенде

- Композер сообщений: [`src/pages/messages/components/MessageComposer.tsx`](../src/pages/messages/components/MessageComposer.tsx:1)
- Список сообщений: [`src/pages/messages/components/MessageList.tsx`](../src/pages/messages/components/MessageList.tsx:1)
- Загрузка данных/стейт: [`src/pages/messages/MessagesPage.tsx`](../src/pages/messages/MessagesPage.tsx:1)
- Deep link страница: [`src/pages/stickers/AddStickerPackPage.tsx`](../src/pages/stickers/AddStickerPackPage.tsx:1)
- Sticker Bot панель (preview + upload): [`src/pages/stickers/StickerBotPanel.tsx`](../src/pages/stickers/StickerBotPanel.tsx:1)

Ключевые поведения:
- Пакеты загружаются при открытии пикера.
- Списки стикеров подгружаются лениво и кэшируются.
- Добавление пака обновляет список `My`.

Deep link UX:
- URL: `/addstickers/:packSlug`
- Экран показывает имя, описание, превью стикеров и кнопку добавления.
- После добавления переход в `/messages?addStickerPack=<id>` для открытия модалки.

Sticker Bot UX:
- Чат с пользователем `@stickers` (ID `999`).
- `/newpack` → задать имя
- `/upload` → получить endpoint для загрузки
- Загрузить PNG/WEBP/GIF
- `/publish` → создать набор и получить deep link

---

## Связанные файлы

- [`backend/scripts/stickers-sync.js`](../backend/scripts/stickers-sync.js:1) — ручная синхронизация.
- [`src/assets/stickers/`](../src/assets/stickers/:1) — ассеты стикеров.
