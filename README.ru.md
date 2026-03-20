# LUME — Полнофункциональная социальная сеть с мессенджером

Русский | [English](./README.md) | [中文](./README.cn.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-latest-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

**LUME** — это современная социальная сеть с функциями мессенджера, построенная на стеке Node.js + React. Проект включает в себя ленту публикаций, систему личных сообщений, верификацию пользователей, админ-панель, систему модерации контента и **чаты-группы/каналы** в Messages.

---

## 📋 Оглавление

- [Обзор проекта](#обзор-проекта)
- [Технологический стек](#технологический-стек)
- [Архитектура проекта](#архитектура-проекта)
- [Функциональные возможности](#функциональные-возможности)
- [Структура базы данных](#структура-базы-данных)
- [API документация](#api-документация)
- [WebSocket события](#websocket-события)
- [Безопасность](#безопасность)
- [Установка и запуск](#установка-и-запуск)
- [Конфигурация](#конфигурация)
- [Лицензия](#лицензия)

---

## 📖 Обзор проекта

### Ключевые особенности:
- 🔄 **Лента публикаций** в реальном времени с WebSocket обновлениями
- 💬 **Мессенджер** для обмена личными сообщениями
- 👥 **Группы и каналы** как типы чатов (`group`, `channel`)
- 👤 **Профили пользователей** с аватарами и баннерами
- ✅ **Система верификации** через TikTok видео
- 🛡️ **Модерация контента** с системой репортов
- 👑 **Админ-панель** для управления пользователями и контентом
- ⚡ **Real-time уведомления** через WebSocket
- 🔒 **Безопасность**: httpOnly cookies, rate limiting, CSP заголовки
- 🌐 **i18n**: Русский, английский, китайский, испанский, португальский (Бразилия)

---

## 🛠️ Технологический стек

### Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18.3.1 | UI библиотека |
| TypeScript | 5.8.3 | Типизация |
| React Router | 6.30.1 | Роутинг |
| Framer Motion | 12.34.0 | Анимации |
| Tailwind CSS | 3.4.17 | Стилизация |
| Radix UI | various | Примитивы UI |
| shadcn/ui | latest | UI компоненты |
| TanStack Query | 5.90.21 | Управление состоянием сервера |
| Emoji Picker React | 4.18.0 | Выбор эмодзи |
| Sonner | 1.7.4 | Уведомления (toast) |
| Zod | 3.25.76 | Валидация схем |
| React Hook Form | 7.61.1 | Управление формами |
| Lucide React | 0.462.0 | Иконки |

### Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| Node.js | latest | Runtime |
| Express | 4.18.2 | Web фреймворк |
| PostgreSQL | 16+ | База данных |
| WebSocket (ws) | 8.19.0 | Real-time связь |
| JWT (jsonwebtoken) | 9.0.2 | Аутентификация |
| Bcryptjs | 2.4.3 | Хеширование паролей |
| Multer | 1.4.5-lts.1 | Загрузка файлов |
| Cors | 2.8.5 | CORS middleware |
| **Zod** | 4.3.6 | Валидация данных |
| **Cookie-parser** | 1.4.7 | Работа с cookies |

---

## 🏗️ Архитектура проекта

```
LUME/
├── Frontend (Vite + React + TypeScript)
│   ├── src/
│   │   ├── components/     # UI компоненты
│   │   │   ├── ui/         # shadcn/ui компоненты
  │   │   │   ├── groups/     # (legacy) Компоненты групп
│   │   │   ├── feed/       # Компоненты ленты
│   │   │   ├── post/       # Компоненты постов
│   │   │   ├── chat/       # Компоненты чатов
│   │   │   ├── media/      # Медиа компоненты
│   │   │   ├── profile/    # Компоненты профиля
│   │   │   ├── verification/ # Компоненты верификации
│   │   │   ├── help/       # Help shell
│   │   │   └── layout/     # Layout компоненты
│   │   ├── pages/          # Страницы приложения
│   │   │   ├── auth/       # Auth страницы
│   │   │   ├── messages/   # Страницы сообщений
  │   │   │   └── group/      # (legacy) Страницы групп
│   │   ├── services/       # API клиент, errorHandler, websocket
│   │   ├── contexts/       # React контексты (Auth, Language, Theme, Server)
│   │   ├── hooks/          # Кастомные хуки (React Query)
│   │   ├── i18n/           # Локализация
│   │   ├── lib/            # Утилиты (queryClient, config, utils)
│   │   ├── types/          # TypeScript типы
│   │   └── test/           # Тесты
│   └── public/             # Статические файлы
│
└── Backend (Express + PostgreSQL)
    ├── src/
    │   ├── server.js       # Точка входа, WebSocket сервер
    │   ├── api.js          # API роуты (Auth, Posts, Chats, Messages, Profile)
    │   ├── auth.js         # Аутентификация (JWT, refresh tokens, cookies)
    │   ├── profile.js      # Профиль пользователя
    │   ├── uploads.js      # Загрузка файлов (Cloudinary)
    │   ├── validation.js   # Zod схемы валидации
    │   ├── permissions.js  # Система прав доступа
    │   ├── rateLimiter.js  # Rate limiting middleware
    │   ├── errors.js       # Обработка ошибок
    │   ├── logger.js       # Логирование
    │   ├── audit.js        # Аудит событий
    │   ├── csrf.js         # CSRF защита
    │   ├── linkPreview.js  # Open Graph превью
    │   ├── serializers.js  # Сериализация данных
    │   └── db.js           # База данных PostgreSQL
    │
    ├── uploads/            # (удалено) локальная директория загрузок
    ├── migrate.js          # Основные миграции БД
    ├── migrate-rate-limit.js # Миграция rate limiting
    ├── migrate-communities.js # Миграция групп
    ├── migrate-audit.js    # Миграция audit
    └── package.json
```

---

## ⚙️ Функциональные возможности

### 1. Группы и каналы (Chats)

**Возможности:**
- Типы чатов: `group`, `channel`, `private`
- Создание групп/каналов
- Заявки на вступление (public channels)
- Управление участниками и ролями
- Real-time сообщения
- Загрузка файлов в сообщениях

**URL навигация:**
- `/messages`
- `/messages/:chatId`

### 2. Лента публикаций (Feed)

**Возможности:**
- Просмотр всех публикаций в хронологическом порядке
- Создание постов с текстом (до 420 символов) и изображениями
- Реакции "Resonance" (лайки) с подсчётом
- Комментарии к постам с эмодзи
- Репосты публикаций
- Real-time обновления через WebSocket
- Закреплённые посты в профиле

### 3. Система сообщений (Messenger)

**Возможности:**
- Личные сообщения между пользователями
- Список чатов с последними сообщениями
- Счётчик непрочитанных сообщений
- Real-time доставка сообщений через WebSocket
- Удаление сообщений (для себя / для всех)
- Вложения файлов и изображений
- Индикаторы прочтения
- Исчезающие моменты (moments)

### 4. Профили пользователей

**Возможности:**
- Просмотр профилей других пользователей
- Редактирование собственного профиля
- Аватары и баннеры
- Счётчики: подписчики, подписки, публикации
- Подписки (follow system)
- Закреплённый пост

### 5. Система верификации

**Процесс:**
1. Подача заявки (требуется регистрация ≥7 дней)
2. Рассмотрение администратором
3. Одобрение на 1 месяц с значком

**Значки:** Verified, Developer, CEO

### 6. Безопасность 🔒

- **httpOnly Cookies**: токены недоступны через JavaScript
- **Rate Limiting**: защита от brute-force
- **CSP заголовки**: защита от XSS
- **Zod валидация**: строгая проверка данных
- **Централизованная обработка ошибок**
- **Централизованная проверка прав (Permissions)**: система ролей и прав доступа в чатах

### 7. Система прав доступа (Permissions)

**Роли чатов:**
- **Owner (100)**: полный доступ, удаление чата
- **Admin (80)**: управление участниками и настройками
- **Moderator (50)**: модерация сообщений
- **Member (10)**: чтение и отправка

**Принципы:**
- Нельзя управлять пользователем с рангом >= твоего
- Owner нельзя кикнуть/понизить
- Проверка прав на каждый запрос через middleware

### 8. Аудит и логирование

**Аудит событий:**
- Все входы/выходы пользователей
- Удаление постов, сообщений, чатов
- Изменение ролей участников
- Кик/бан пользователей
- Запросы на верификацию
- Действия администраторов

**Хранение:**
- Audit логи сохраняются в БД (`audit_logs`)
- Автоматическая очистка старых записей (90 дней)
- IP адрес, User Agent, детали операции

---

## 🗄️ Структура базы данных

### Основные таблицы

#### `users`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Первичный ключ |
| email | TEXT | Email (уникальный) |
| password_hash | TEXT | Хешированный пароль |
| name | TEXT | Имя |
| username | TEXT | Username (уникальный) |
| bio | TEXT | О себе |
| avatar | TEXT | URL аватара |
| banner | TEXT | URL баннера |
| city | TEXT | Город |
| website | TEXT | Сайт |
| verified | BOOLEAN | Статус верификации |
| followers_count | INTEGER | Количество подписчиков |
| join_date | DATETIME | Дата регистрации |
| last_seen_at | DATETIME | Последний вход |

#### `posts`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Первичный ключ |
| user_id | INTEGER | Автор |
| text | TEXT | Текст (max 420) |
| image_url | TEXT | URL изображения |
| timestamp | DATETIME | Дата создания |
| replies_count | INTEGER | Количество комментариев |
| reposts_count | INTEGER | Количество репостов |
| resonance_count | INTEGER | Количество лайков |

#### `chats` / `messages`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Первичный ключ |
| sender_id | INTEGER | Отправитель |
| receiver_id | INTEGER | Получатель |
| text | TEXT | Текст |
| created_at | DATETIME | Дата |
| deleted_for_all | BOOLEAN | Удалено для всех |
| moment_id | INTEGER | ID момента (для исчезающих) |

#### `moments`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Первичный ключ |
| sender_id | INTEGER | Отправитель |
| receiver_id | INTEGER | Получатель |
| thumb_data_url | TEXT | Thumb preview |
| ttl_seconds | INTEGER | Время жизни |
| expires_at | DATETIME | Истекает |

### Таблицы чатов

#### `chats`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Первичный ключ |
| username | TEXT | Уникальный username (для public) |
| name | TEXT | Название |
| description | TEXT | Описание |
| avatar | TEXT | URL аватара |
| type | TEXT | private/group/channel |
| owner_id | INTEGER | Владелец |
| created_at | DATETIME | Дата создания |

#### `chat_members`
| Поле | Тип | Описание |
|------|-----|----------|
| chat_id | INTEGER | Чат |
| user_id | INTEGER | Участник |
| role_id | INTEGER | Роль |
| joined_at | DATETIME | Дата вступления |

#### `chat_roles`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Первичный ключ |
| chat_id | INTEGER | Чат |
| name | TEXT | Название роли |
| rank | INTEGER | Ранг (приоритет) |
| permissions_json | TEXT | Права (JSON) |
| is_system | BOOLEAN | Системная роль |

#### `messages`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Первичный ключ |
| chat_id | INTEGER | Чат |
| user_id | INTEGER | Автор |
| text | TEXT | Текст |
| created_at | DATETIME | Дата |

#### `chat_join_requests`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Первичный ключ |
| chat_id | INTEGER | Чат |
| user_id | INTEGER | Заявитель |
| status | TEXT | pending/approved/rejected |
| created_at | DATETIME | Дата заявки |

### Системные таблицы

#### `rate_limits`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Первичный ключ |
| ip | TEXT | IP адрес |
| action | TEXT | login/register/forgot_password |
| attempts | INTEGER | Количество попыток |
| blocked_until | DATETIME | Заблокирован до |

#### `audit_logs`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Первичный ключ |
| event_type | TEXT | Тип события |
| user_id | INTEGER | Кто совершил |
| target_id | INTEGER | ID объекта |
| ip_address | TEXT | IP адрес |
| user_agent | TEXT | User Agent |
| details | TEXT | JSON с деталями |
| created_at | DATETIME | Дата события |

---

## 📡 API документация

Полная документация API доступна в файле [backend/API.md](./backend/API.md).

### Базовый URL
```
http://localhost:5000/api
```

### Основные endpoints

#### Auth
- `POST /register` — Регистрация
- `POST /login` — Вход
- `POST /refresh` — Обновление токена
- `POST /logout` — Выход

#### Profile
- `GET /profile` — Мой профиль
- `GET /profile/:userId` — Профиль пользователя
- `PUT /profile` — Обновить профиль
- `POST /profile/avatar` — Загрузить аватар
- `POST /profile/banner` — Загрузить баннер
- `DELETE /profile` — Удалить аккаунт

#### Posts
- `GET /posts` — Лента
- `GET /posts/recommended` — Популярное
- `GET /posts/following` — Подписки
- `POST /posts` — Создать пост
- `DELETE /posts/:postId` — Удалить пост
- `POST /posts/:postId/resonance` — Лайк

#### Chats
- `GET /chats` — Список чатов
- `POST /chats` — Создать чат
- `PUT /chats/:chatId` — Обновить чат
- `POST /chats/:chatId/members` — Добавить участника
- `DELETE /chats/:chatId/members/:userId` — Удалить участника
- `GET /chats/public?query=...` — Публичные каналы
- `POST /chats/:chatId/subscribe` — Вступить в публичный канал
- `GET /chats/:chatId/join-requests` — Заявки на вступление
- `POST /chats/:chatId/join-requests/:requestId/review` — Approve/reject

#### Messages
- `GET /messages?chatId=...` — История чата
- `POST /messages` — Отправить сообщение
- `DELETE /messages/:messageId` — Удалить сообщение

---

## 🔌 WebSocket события

### Подключение
```
ws://localhost:5000/ws
```

### События

**Клиент → Сервер:**
- `register` — Регистрация пользователя
- `ping` — Heartbeat
- `typing:start` / `typing:stop` — Индикатор набора
- `chat:read` — Прочтение чата
- `message:delivered` — Доставка сообщения
- `chat:subscribe` / `chat:unsubscribe` — Подписка на чат

**Сервер → Клиент:**
- `new_post` — Новый пост
- `new_message` — Новое сообщение
- `typing:update` — Индикатор набора
- `chat:read_update` — Прочтение чата
- `presence:update` — Статус онлайн
- `channel:new_message` — Сообщение в канале
- `chat:read_update` — Обновление прочтения

---

## 🛡️ Безопасность

### 1. httpOnly Cookies
Токены хранятся в httpOnly cookies, недоступны через JavaScript.

### 2. Rate Limiting
- Login: 5 попыток / 15 минут
- Register: 3 попытки / 1 час

### 3. Content Security Policy
Строгие заголовки CSP для защиты от XSS.

### 4. Zod Валидация
Строгая валидация всех входящих данных.

### 5. Централизованная обработка ошибок
Единый формат ошибок API.

### 6. Централизованная проверка прав
Система ролей и прав доступа для чатов.

---

## 🚀 Установка и запуск

### 1. Клонирование
```bash
git clone <repository-url>
cd LUME
```

### 2. Backend
```bash
cd backend
npm install

# Миграции БД
node migrate.js                    # Основные таблицы
node migrate-rate-limit.js         # Rate limiting
node migrate-audit.js              # Audit логи
node migrate-communities.js        # Группы (communities)

# Запуск
npm run dev
```

### 3. Frontend
```bash
npm install
npm run dev
```

### 4. Доступ
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/health`

---

## ⚙️ Конфигурация

### Backend (.env)
```env
PORT=5000
JWT_SECRET=your-super-secret-key-change-in-production
NODE_ENV=development
LOG_LEVEL=info  # error | warn | info | debug
```

### Frontend
Не требует переменных окружения.
API URL: `http://localhost:5000/api`

---

## 📄 Лицензия

MIT License

---

## 👥 Авторы

- **zxclovly** — Owner & Admin

---

## 📚 Дополнительная документация

- [Features Inventory](./docs/FEATURES_INVENTORY.md) — Полный список функций
- [Error Handling](./docs/ERROR_HANDLING.md) — Система обработки ошибок
- [Groups Module](./docs/GROUPS_MODULE.md) — Документация по модулю групп
- [Project UI](./docs/PROJECT_UI/) — UI/UX документация
- [API Documentation](./backend/API.md) — API endpoints
