# Реестр функций LUME

[English](../docs/FEATURES_INVENTORY.md) | Русский | [中文](../docs-cn/FEATURES_INVENTORY.cn.md)

**Последнее обновление:** 19 марта 2026 г.
**Статус:** ✅ Актуально

Ниже перечислены **реально реализованные** функции проекта LUME.

---

## 🏠 Landing & Public Pages

### Landing Page
- **Маршрут:** `/`
- **Файлы:** `src/pages/LandingPage.tsx`, `src/layouts/LandingLayout.tsx`
- **Статус:** ✅ Реализовано
- **Описание:** Публичная главная страница с описанием возможностей
- **Компоненты:**
  - Hero секция с CTA кнопками
  - Feature cards (6 карточек)
  - Footer с ссылками

### Статические страницы
- **Маршруты:** `/faq`, `/rules`, `/support`, `/status`, `/contacts`
- **Файлы:** `src/pages/FAQPage.tsx`, `RulesPage.tsx`, `SupportPage.tsx`, `StatusPage.tsx`, `ContactsPage.tsx`
- **Статус:** ✅ Реализовано
- **Описание:** Информационные страницы

---

## 📜 Legal & Compliance

### Legal Pages
- **Маршруты:** `/privacy-policy`, `/terms-of-service`, `/cookie-policy`
- **Файлы:** `src/pages/PrivacyPolicy.tsx`, `src/pages/TermsOfService.tsx`, `src/pages/CookiePolicy.tsx`, `src/pages/LegalPageLayout.tsx`
- **Статус:** ✅ Реализовано
- **Описание:** Публичные юридические страницы (политики и условия)

### Cookie Consent Banner
- **Файл:** `src/components/ui/CookieBanner.tsx`
- **Статус:** ✅ Реализовано
- **Функции:** Accept/Decline, ссылка на Cookie Policy, хранение выбора (`src/lib/cookieConsent.ts`)

---

## 📰 Feed & Posts

### Лента публикаций (Feed)
- **Маршрут:** `/feed`
- **Файлы:** `src/pages/Index.tsx`, `src/components/feed/PostComposer.tsx`, `src/components/feed/FeedHeader.tsx`, `src/components/post/Post.tsx`
- **Статус:** ✅ Реализовано
- **Функции:**
  - Две вкладки: "Для вас" (recommended) и "Подписки" (following)
  - Посты до 420 символов с изображениями
  - Реакции "Resonance" (лайки)
  - Комментарии с эмодзи
  - Репосты
  - Закреплённые посты
  - Real-time обновления через WebSocket
  - Автообновление каждые 30 секунд
  - Уведомление о новых постах

### Компонент поста
- **Файл:** `src/components/post/Post.tsx`
- **Статус:** ✅ Реализовано
- **Функции:**
  - Отображение текста и изображений
  - Счётчик резонанса (лайков)
  - Счётчик комментариев
  - Кнопка ответа (reply)
  - Emoji picker для реакций
  - Контекстное меню (удалить, репорт, закрепить)
  - Image viewer с зумом
  - Link preview (Open Graph)

---

## 💬 Messages & Chat

### Мессенджер
- **Маршруты:** `/messages`, `/messages/:chatId`
- **Файлы:** `src/pages/Messages.tsx`, `src/pages/messages/MessagesPage.tsx`, `src/pages/messages/components/ChatList.tsx`, `src/pages/messages/components/ChatPanel.tsx`, `src/pages/messages/components/MessageList.tsx`, `src/pages/messages/components/MessageComposer.tsx`
- **Статус:** ✅ Реализовано
- **Функции:**
  - Список чатов с последними сообщениями
  - Счётчик непрочитанных
  - Личные сообщения между пользователями
  - Вложения файлов и изображений
  - Ответы на сообщения (reply)
  - Удаление сообщений (для себя / для всех)
  - Индикаторы: онлайн, был(а), печатает
  - Read receipts (статус прочтения)
  - Контекстное меню для удаления
  - Image viewer с зумом

### Моменты (исчезающие фото)
- **Файл:** `src/pages/messages/MessagesPage.tsx` (встроено)
- **Статус:** ⚠️ Частично реализовано
- **Функции:**
  - Исчезающие фото с TTL (24 часа)
  - Просмотр по клику
  - Запрет на скачивание
  - Thumb preview
  - Отметка о просмотре
  - Автоматическое закрытие при переключении вкладки

### Reply Bar
- **Файл:** `src/components/chat/ReplyBar.tsx`
- **Статус:** ✅ Реализовано
- **Описание:** Компонент для ответа на сообщения

---

## 👥 Groups & Channels (Chats)

### Чаты (группы и каналы)
- **Маршруты:** `/messages`, `/messages/:chatId`
- **Файлы:** `src/pages/Messages.tsx`, `src/pages/messages/MessagesPage.tsx`, `src/pages/messages/components/ChatList.tsx`, `src/pages/messages/components/ChatPanel.tsx`, `src/pages/messages/components/ChatSettingsModal.tsx`, `src/pages/messages/components/CreateChatModal.tsx`
- **Статус:** ✅ Реализовано
- **Функции:**
  - Типы чатов: `group`, `channel`, `private`
  - Создание группы/канала
  - Публичные каналы (поиск и join)
  - Заявки на вступление (approve/reject)
  - Управление участниками и ролями

---

## 👤 Profile & Users

### Профиль (мой)
- **Маршрут:** `/profile`
- **Файлы:** `src/pages/Profile.tsx`
- **Статус:** ✅ Реализовано
- **Функции:**
  - Аватары и баннеры
  - Счётчики: подписчики, подписки, публикации
  - Редактирование профиля (bio, city, website)
  - Закреплённый пост
  - История постов
  - Кнопка подписки (для других)

### Профиль пользователя
- **Маршрут:** `/profile/:userId`
- **Файлы:** `src/pages/UserProfile.tsx`
- **Статус:** ✅ Реализовано
- **Функции:**
  - Просмотр чужого профиля
  - Кнопки: подписаться, написать
  - Статус верификации

### Follow Modal
- **Файл:** `src/components/profile/FollowModal.tsx`
- **Статус:** ✅ Реализовано
- **Описание:** Модальное окно со списком подписчиков/подписок

---

## ✅ Verification

### Страница верификации
- **Маршрут:** `/verified`
- **Файлы:** `src/pages/Verified.tsx`, `src/components/verification/VerificationHero.tsx`
- **Статус:** ✅ Реализовано
- **Функции:**
  - Подача заявки через TikTok видео
  - Требования: регистрация ≥7 дней, видео ≥2000 просмотров
  - Рассмотрение администратором
  - Одобрение на 1 месяц
  - Значки: Verified, Developer, CEO

---

## ⚙️ Settings

### Настройки аккаунта
- **Маршрут:** `/settings`
- **Файлы:** `src/pages/Settings.tsx`
- **Статус:** ✅ Реализовано
- **Функции:**
  - Тема (тёмная/светлая)
  - Язык (ru/en)
  - Эффект снега (вкл/выкл)
  - Приватность постов
  - Приватность сообщений
  - Удаление аккаунта

### Управление сессиями
- **Маршрут:** `/settings/sessions`
- **Файл:** `src/pages/settings/SessionsPage.tsx`
- **Статус:** ✅ Реализовано
- **Функции:** текущая сессия, список активных сессий, выход из устройства, logout all

---

## 🛡️ Admin Panel

### Панель администратора
- **Маршрут:** `/admin`
- **Файлы:** `src/pages/AdminPanel.tsx`, `src/components/AdminPanelModal.tsx`
- **Статус:** ✅ Реализовано (доступ зависит от прав)
- **Функции:**
  - Запросы на верификацию
  - Список пользователей
  - Жалобы на посты
  - Одобрение/отклонение верификации
  - Удаление постов
  - Отклонение жалоб

---

## 🔐 Authentication

### Вход / Регистрация
- **Маршруты:** `/login`, `/register`
- **Файлы:** `src/pages/auth/Login.tsx`, `src/pages/auth/Register.tsx`
- **Статус:** ✅ Реализовано
- **Функции:**
  - Email + пароль
  - Валидация username (мин. 5 символов, латиница + цифры)
  - httpOnly cookies для токенов
  - CSRF защита
  - Rate limiting

---

## 🔍 Explore

### Поиск и обзор
- **Маршрут:** `/explore`
- **Файлы:** `src/pages/Explore.tsx`
- **Статус:** ✅ Реализовано
- **Функции:**
  - Поиск пользователей
  - Поиск чатов/каналов (public)
  - Тренды (популярные хэштеги)
  - Рекомендуемые пользователи

---

## 🔧 System Pages

### 404 Not Found
- **Маршрут:** `*`
- **Файлы:** `src/pages/NotFound.tsx`
- **Статус:** ✅ Реализовано

### Error Boundary
- **Файлы:** `src/components/ErrorBoundary.tsx`
- **Статус:** ✅ Реализовано
- **Описание:** Перехват ошибок рендеринга

---

## 🌐 Internationalization (i18n)

### Переводы
- **Файлы:** `src/i18n/translations.ts`, `src/i18n/locales/ru.json`, `en.json`
- **Статус:** ✅ Реализовано
- **Языки:** Русский, English
- **Объём:** 1000+ строк переводов

---

## 🎨 UI Components

### shadcn/ui компоненты (50+)
- **Файлы:** `src/components/ui/*.tsx`
- **Статус:** ✅ Реализовано
- **Примеры:** button, input, dialog, dropdown-menu, toast, skeleton, avatar, badge, card, tabs, switch, slider, progress, table, tooltip, popover, etc.

### Кастомные компоненты
- **Файлы:** `src/components/*.tsx`
- **Статус:** ✅ Реализовано
- **Примеры:**
  - `Avatar.tsx` — аватар с инициалами
  - `Presence.tsx` — индикатор онлайн/оффлайн
  - `LinkPreview.tsx` — Open Graph превью
  - `NavLink.tsx` — анимированная навигация
  - `ImageViewer.tsx` — полноэкранный просмотр
  - `SnowEffect.tsx` — эффект снега
  - `LogoutModal.tsx` — модальное окно выхода
  - `CookieBanner.tsx` — баннер согласия на cookies

### Layout компоненты
- **Файлы:** `src/components/layout/*.tsx`
- **Статус:** ✅ Реализовано
- **Примеры:**
  - `AppLayout.tsx` — основной layout
  - `SidebarLeft.tsx` — левый сайдбар (260px)
  - `SidebarRight.tsx` — правый сайдбар (340px)

---

## 🔌 WebSocket Features

### Real-time события
- **Файл:** `src/services/websocket.ts`
- **Статус:** ✅ Реализовано
- **События:**
  - `new_post` — новый пост
  - `post_resonance_updated` — обновлён резонанс
  - `new_comment` — новый комментарий
  - `new_message` — новое сообщение
  - `typing:update` — индикатор набора
  - `chat:read_update` — прочтение чата
  - `message:deleted` — сообщение удалено
  - `presence:update` — статус онлайн/оффлайн
  - `chat:read_update`
  - `channel:new_message` — сообщение в канале

---

## 📊 Summary

| Категория | Реализовано | Частично | Placeholder | Всего |
|-----------|-------------|----------|-------------|-------|
| Страницы | 26 | 0 | 0 | 26 |
| Компоненты | 60+ | 0 | 0 | 60+ |
| API endpoints | 40+ | 0 | 0 | 40+ |
| WebSocket события | 12+ | 0 | 0 | 12+ |
| i18n языки | 5 | 0 | 0 | 5 |

**Общий статус:** ✅ Production-ready

---

## Последние изменения

### Удалено (5 марта 2026 г.)
- ❌ Страница `/lume` (LumeAI) — удалена
- ❌ Страница `/music` — удалена
- ❌ API endpoint `/api/lume/chat` — удалён
- ❌ Модуль `backend/src/lume/` — удалён
- ❌ Rate limiter `lumeChatLimiter` — удалён

### Изменено
- ✅ Обновлены переводы (удалены упоминания LUME/Music)
- ✅ Обновлён SidebarLeft (удалены кнопки LUME AI, Music)
- ✅ Обновлён App.tsx (удалены роуты)

---

## Связанные документы

- [Error Handling](./ERROR_HANDLING.ru.md)
- [Groups Module](./GROUPS_MODULE.ru.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.md)
