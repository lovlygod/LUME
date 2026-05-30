# LUME — Полнофункциональная социальная сеть с мессенджером

Русский | [English](./README.md) | [中文](./README.cn.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-latest-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

**LUME** — современная социальная сеть с функциями мессенджера, построенная на Node.js + React. Проект включает ленту, личные сообщения, верификацию пользователей, админ-панель, модерацию контента и **группы/каналы** внутри раздела Messages.

---

## 📋 Оглавление

- [Обзор проекта](#обзор-проекта)
- [Технологический стек](#технологический-стек)
- [Архитектура проекта](#архитектура-проекта)
- [Ключевые возможности](#ключевые-возможности)
- [Безопасность](#безопасность)
- [Права доступа](#права-доступа)
- [Аудит и логирование](#аудит-и-логирование)
- [Схема базы данных](#схема-базы-данных)
- [API-документация](#api-документация)
- [WebSocket-события](#websocket-события)
- [Troubleshooting runbook](#troubleshooting-runbook)
- [Установка и запуск](#установка-и-запуск)
- [Конфигурация](#конфигурация)
- [Лицензия](#лицензия)

---

## 📖 Обзор проекта

### Ключевые особенности
- 🔄 **Лента в реальном времени** с WebSocket-обновлениями
- 💬 **Мессенджер** для личных 1:1 чатов
- 👥 **Groups & Channels** как типы чатов (`group`, `channel`)
- 👤 **Профили пользователей** с аватарами и баннерами
- ✅ **Система верификации** через TikTok-видео
- 🛡️ **Модерация контента** через репорты
- 📑 **Админ-панель** для управления пользователями и контентом
- ⚡ **Realtime-уведомления** через WebSocket
- 🔒 **Безопасность**: httpOnly cookies, rate limiting, CSP-заголовки
- 🌐 **i18n**: русский, английский, китайский, испанский, португальский (Бразилия)

---

## 🛠️ Технологический стек

### Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18.3.1 | UI-библиотека |
| TypeScript | 5.8.3 | Типизация |
| React Router | 6.30.1 | Роутинг |
| Framer Motion | 12.34.0 | Анимации |
| Tailwind CSS | 3.4.17 | Стилизация |
| Radix UI | various | UI-примитивы |
| shadcn/ui | latest | UI-компоненты |
| TanStack Query | 5.90.21 | Состояние серверных данных |
| Emoji Picker React | 4.18.0 | Выбор эмодзи |
| Sonner | 1.7.4 | Toast-уведомления |
| Zod | 3.25.76 | Валидация схем |
| React Hook Form | 7.61.1 | Работа с формами |
| Lucide React | 0.462.0 | Иконки |

### Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| Node.js | latest | Runtime |
| Express | 4.18.2 | Web-фреймворк |
| PostgreSQL | 16+ | База данных |
| WebSocket (ws) | 8.19.0 | Realtime-связь |
| JWT (jsonwebtoken) | 9.0.2 | Аутентификация |
| Bcryptjs | 2.4.3 | Хеширование паролей |
| Multer | 1.4.5-lts.1 | Загрузка файлов |
| Cors | 2.8.5 | CORS middleware |
| **Zod** | 4.3.6 | Валидация данных |
| **Cookie-parser** | 1.4.7 | Работа с cookies |

---

## 🏗️ Архитектура проекта

```text
LUME/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── contexts/
│   ├── hooks/
│   ├── i18n/
│   └── lib/
└── backend/
    ├── src/
    │   ├── routes/
    │   ├── services/
    │   ├── validators/
    │   └── middleware/
    └── database/
```

---

## ⚙️ Ключевые возможности

### 1. Groups & Channels (Chats)
- Типы чатов: `group`, `channel`, `private`
- Создание групп/каналов
- Заявки на вступление (для публичных каналов)
- Управление участниками и ролями
- Realtime-доставка сообщений
- Вложения файлов и изображений

### 2. Feed
- Хронологическая лента
- Создание постов (до 420 символов) с изображениями
- Реакции “Resonance”
- Эмодзи-комментарии
- Репосты
- Realtime-обновления через WebSocket
- Закреплённые посты в профиле

### 3. Messenger
- Личные 1:1 сообщения
- Список чатов с последним сообщением
- Счётчики непрочитанного
- Статусы доставки/прочтения
- Удаление сообщений (для себя / для всех)
- Вложения, голосовые и media-сообщения

### 4. Профили пользователей
- Просмотр чужих профилей
- Редактирование своего профиля
- Аватары и баннеры
- Счётчики: подписчики, подписки, посты
- Подписки (follow)
- Закреплённый пост

### 5. Система верификации
1. Подача заявки (регистрация ≥ 7 дней)
2. Проверка администратором
3. Одобрение на 1 месяц с бейджем

Бейджи: Verified, Developer, CEO

### 6. Onboarding
1. Новый пользователь проходит 4 шага
2. Выбор основной роли
3. Выбор навыков
4. Выбор целей
5. Создание/вступление в workspace

Сохраняемые поля: `primary_role`, `skills`, `goals`, `onboarding_completed`

### 7. Workspaces & Projects
- Публичные/приватные workspaces
- Инвайты по кодам
- Ролевая модель: owner/admin/lead/developer/designer/member/guest
- Проекты и задачи внутри команд
- Канбан-статусы: `todo` → `in_progress` → `review` → `done`

---

## 🛡️ Безопасность

- **httpOnly Cookies**: токены недоступны из JavaScript
- **Rate Limiting**: защита от brute-force
- **CSP Headers**: защита от XSS
- **Zod Validation**: строгая проверка входных данных
- **Centralized Error Handling**: единый формат API-ошибок
- **Permission Checks**: контроль доступа по ролям

---

## 👥 Права доступа

### Роли в чатах
- **Owner (100)**: полный контроль, удаление чата, передача владения
- **Admin (80)**: управление участниками и настройками
- **Member (10)**: чтение/отправка сообщений

### Роли в workspace
- **Owner**: полный контроль, удаление workspace
- **Admin**: управление участниками/контентом
- **Lead**: управление проектами и задачами
- **Developer/Designer/Guest**: ограниченные права

Базовые правила:
- Нельзя управлять участником с равным или более высоким рангом
- Владельца нельзя кикнуть или понизить

---

## 📊 Аудит и логирование

Аудируемые события:
- Входы/выходы пользователей
- Удаление постов/сообщений/чатов
- Изменение ролей участников
- Kick/Ban действия
- Запросы верификации
- Действия администраторов

Хранение:
- Таблица `audit_logs`
- Автоочистка старых записей
- IP, User-Agent и детали операции

---

## 🗄️ Схема базы данных

Ключевые таблицы:
- `users`
- `posts`
- `chats`
- `messages`
- `media`
- `chat_members`
- `chat_roles`
- `chat_join_requests`
- `rate_limits`
- `audit_logs`

---

## 📡 API-документация

Полная документация: [backend/API.md](./backend/API.md)

Базовый URL:
```text
http://150.241.85.189:5000/api
```

### Основные endpoint'ы

#### Auth
- `POST /register` — регистрация
- `POST /login` — вход
- `POST /refresh` — обновление токена
- `POST /logout` — выход

#### Profile
- `GET /profile`
- `GET /profile/:userId`
- `PUT /profile`
- `POST /profile/avatar`
- `POST /profile/banner`
- `DELETE /profile`

#### Posts
- `GET /posts`
- `GET /posts/recommended`
- `GET /posts/following`
- `POST /posts`
- `DELETE /posts/:postId`
- `POST /posts/:postId/resonance`

#### Chats
- `GET /chats`
- `POST /chats`
- `PUT /chats/:chatId`
- `POST /chats/:chatId/members`
- `DELETE /chats/:chatId/members/:userId`
- `GET /chats/public?query=...`
- `POST /chats/:chatId/subscribe`
- `GET /chats/:chatId/join-requests`
- `POST /chats/:chatId/join-requests/:requestId/review`

#### Messages
- `GET /messages?chatId=...`
- `POST /messages`
- `DELETE /messages/:messageId`

#### Onboarding
- `GET /onboarding/status`
- `POST /onboarding/profile`
- `POST /onboarding/skills`
- `POST /onboarding/goals`
- `POST /onboarding/workspace`
- `POST /onboarding/complete`

#### Workspaces
- `POST /workspaces`
- `GET /workspaces/my`
- `GET /workspaces/public`
- `GET /workspaces/:slug`
- `PATCH /workspaces/:id`
- `DELETE /workspaces/:id`
- `POST /workspaces/:id/members`
- `PATCH /workspaces/:id/members/:userId`
- `DELETE /workspaces/:id/members/:userId`
- `POST /workspaces/:id/invites`
- `POST /workspaces/join/:inviteCode`
- `GET /workspaces/:id/members`

#### Projects
- `POST /projects`
- `GET /projects/my`
- `GET /projects/public`
- `GET /projects/:slug`
- `PATCH /projects/:id`
- `DELETE /projects/:id`
- `POST /projects/:id/members`
- `DELETE /projects/:id/members/:userId`
- `POST /projects/:id/invite`
- `GET /projects/:id/members`

#### Tasks
- `POST /projects/:projectId/tasks`
- `GET /projects/:projectId/tasks`
- `PATCH /tasks/:taskId`
- `DELETE /tasks/:taskId`
- `POST /tasks/:taskId/comments`

---

## 🔌 WebSocket-события

Подключение:
```text
ws://150.241.85.189:5000/ws
```

**Client → Server**
- `register`
- `ping`
- `typing:start` / `typing:stop`
- `chat:read`
- `message:delivered`
- `chat:subscribe` / `chat:unsubscribe`

**Server → Client**
- `new_post`
- `new_message`
- `typing:update`
- `chat:read_update`
- `presence:update`
- `channel:new_message`
- `message:deleted`
- `notification_new`
- `session_terminated`

---

## 🛠️ Troubleshooting runbook

Frontend:
```bash
npm install
npm run dev
```

Backend:
```bash
cd backend
npm install
npm run dev
```

Health-check endpoints:
- `GET /health`
- `GET /api/status`

---

## 🚀 Установка и запуск

```bash
git clone <repository-url>
cd LUME
```

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
npm install
npm run dev
```

---

## ⚙️ Конфигурация

Параметры backend `.env`: `PORT`, `JWT_SECRET`, `NODE_ENV`, `LOG_LEVEL` и runtime-настройки.

---

## 📄 Лицензия

MIT License

---

## 👥 Авторы

- **zxclovly** — Owner & Admin

---

## 📚 Дополнительная документация

- [Features Inventory](./docs/FEATURES_INVENTORY.md)
- [Error Handling](./docs/ERROR_HANDLING.md)
- [Groups Module](./docs/GROUPS_MODULE.md)
- [Project UI](./docs/PROJECT_UI/)
- [API Documentation](./backend/API.md)
- [Wallet E2EE Envelopes](./docs/WALLET_E2EE_ENVELOPES.md)
- [Economy Wallet Stack](./docs/ECONOMY_WALLET_STACK.md)

