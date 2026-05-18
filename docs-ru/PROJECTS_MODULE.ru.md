# Модуль Projects LUME

[English](../docs/PROJECTS_MODULE.md) | Русский | [中文](../docs-cn/PROJECTS_MODULE.cn.md)

**Последнее обновление:** 2026-05-18
**Статус:** ✅ Реализовано

---

## Обзор

Модуль Projects позволяет командам создавать, управлять и демонстрировать свои проекты. Проекты могут отслеживать задачи, управлять членами команды, отображать технологический стек, GitHub репозитории, demo URL и быть связанными с выделенным чатом для командной коммуникации.

---

## Архитектура

### Backend

**Файлы:**
- `backend/src/routes/projectRoutes.js` - API маршруты
- `backend/src/services/projectService.js` - Бизнес-логика
- `backend/src/validators/projectSchemas.js` - Валидационные схемы

**Таблицы БД:**
- `projects` - Метаданные проекта
- `project_members` - Члены команды и роли
- `project_invites` - Коды приглашений

### Frontend

**Файлы:**
- `src/pages/projects/ProjectsPage.tsx` - Список проектов и создание
- `src/pages/projects/ProjectDetailPage.tsx` - Детали проекта с вкладками (обзор, задачи, участники, чат, настройки)
- `src/components/projects/ProjectSettingsModal.tsx` - Модальное окно настроек с вкладками: общие/участники/чат/опасная зона
- `src/services/api.ts` - API методы (`projectsAPI`, `projectMembersAPI`)

---

## Возможности

### Типы Проектов

**Публичные Проекты:**
- Видны в поиске/публичных списках
- Доступны для поиска
- Могут быть помечены как "ищу участников"
- Поддерживают open source
- Доступны любому авторизованному пользователю

**Приватные Проекты:**
- Видны только участникам проекта
- Не видны в публичных списках
- Для внутренних командных проектов

### Статусы Проекта

| Статус | Описание |
|--------|----------|
| **idea** | Начальная концепция, этап планирования |
| **building** | Активно разрабатывается |
| **testing** | На этапе тестирования/QA |
| **launched** | Запущен и развёрнут |
| **paused** | Временно приостановлен |
| **archived** | Больше не поддерживается |

### Роли Проекта

| Роль | Разрешения |
|------|------------|
| **Owner** | Полный контроль, удаление проекта, управление всеми участниками, связь чата |
| **Admin** | Редактирование проекта, управление участниками, создание/управление задачами |
| **Lead** | Редактирование проекта, управление участниками, создание/управление задачами |
| **Manager** | Редактирование проекта, управление участниками, создание/управление задачами |
| **Developer** | Просмотр проекта, выполнение задач |
| **Frontend** | Просмотр проекта, выполнение frontend задач |
| **Backend** | Просмотр проекта, выполнение backend задач |
| **Bot Developer** | Просмотр проекта, выполнение bot задач |
| **Designer** | Просмотр проекта, выполнение дизайн задач |
| **Tester** | Просмотр проекта, выполнение тестовых задач |
| **Member** | Просмотр проекта, выполнение задач |

---

## API Endpoints

### POST `/projects`
Создать новый проект.

**Body:**
```json
{
  "name": "Awesome App",
  "slug": "awesome-app",
  "description": "Building the next big thing",
  "status": "building",
  "visibility": "public",
  "stack": ["React", "Node.js", "PostgreSQL"],
  "tags": ["Web", "SaaS"],
  "githubUrl": "https://github.com/user/awesome-app",
  "demoUrl": "https://awesome-app.com",
  "lookingForMembers": true,
  "isOpenSource": true
}
```

**Response 201:**
```json
{
  "project": {
    "id": "1",
    "name": "Awesome App",
    "slug": "awesome-app",
    "owner_id": "1",
    "status": "building",
    "visibility": "public",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### GET `/projects/my`
Получить проекты пользователя (созданные + участником).

**Response 200:**
```json
{
  "projects": [
    {
      "id": "1",
      "name": "Awesome App",
      "slug": "awesome-app",
      "status": "building",
      "visibility": "public",
      "owner_id": "1"
    }
  ]
}
```

---

### GET `/projects/public`
Получить публичные проекты (для explore).

**Response 200:**
```json
{
  "projects": [
    {
      "id": "2",
      "name": "Open Source Tool",
      "slug": "open-source-tool",
      "description": "Useful developer tool",
      "status": "launched",
      "visibility": "public",
      "stack": ["Python", "FastAPI"],
      "tags": ["CLI", "DevTools"],
      "looking_for_members": true,
      "is_open_source": true
    }
  ]
}
```

---

### GET `/projects/:slug`
Получить проект по slug.

**Response 200:**
```json
{
  "project": {
    "id": "1",
    "name": "Awesome App",
    "slug": "awesome-app",
    "description": "Building the next big thing",
    "status": "building",
    "visibility": "public",
    "stack": ["React", "Node.js", "PostgreSQL"],
    "tags": ["Web", "SaaS"],
    "github_url": "https://github.com/user/awesome-app",
    "demo_url": "https://awesome-app.com",
    "logo_url": "https://res.cloudinary.com/...",
    "banner_url": null,
    "looking_for_members": true,
    "is_open_source": true,
    "owner_id": "1",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-02T12:00:00.000Z"
  }
}
```

---

### PATCH `/projects/:id`
Обновить проект. **Требуется:** роль admin, lead или manager.

**Body:**
```json
{
  "name": "Updated Name",
  "description": "New description",
  "status": "launched",
  "visibility": "private",
  "stack": ["React", "TypeScript", "PostgreSQL"],
  "githubUrl": "https://github.com/user/awesome-app",
  "demoUrl": "https://awesome-app.com",
  "lookingForMembers": false,
  "isOpenSource": true
}
```

**Response 200:**
```json
{
  "project": {
    "id": "1",
    "name": "Updated Name",
    "updated_at": "2024-01-02T12:00:00.000Z"
  }
}
```

---

### POST `/projects/:id/logo`
Загрузить логотип/аватар проекта. **Требуется:** роль admin, lead или manager.

**Body:** `multipart/form-data` с полем `file`

**Response 200:**
```json
{
  "project": { ... },
  "logoUrl": "https://res.cloudinary.com/..."
}
```

---

### DELETE `/projects/:id`
Удалить проект. **Требуется:** только владелец (owner).

**Response 200:**
```json
{
  "message": "Project deleted"
}
```

---

### POST `/projects/:id/members`
Добавить или обновить участника проекта. **Требуется:** роль admin, lead или manager.

**Body:**
```json
{
  "userId": 2,
  "role": "developer"
}
```

**Response 201:**
```json
{
  "message": "Project member upserted"
}
```

---

### GET `/projects/:id/members`
Получить всех участников проекта.

**Response 200:**
```json
{
  "members": [
    {
      "id": "1",
      "project_id": "1",
      "user_id": "1",
      "role": "owner",
      "joined_at": "2024-01-01T12:00:00.000Z",
      "user": {
        "id": "1",
        "username": "johndoe",
        "name": "John Doe",
        "avatar": "https://..."
      }
    }
  ]
}
```

---

### DELETE `/projects/:id/members/:userId`
Удалить участника из проекта. **Требуется:** роль admin, lead или manager.

**Response 200:**
```json
{
  "message": "Project member removed"
}
```

---

### POST `/projects/:id/leave`
Покинуть проект (участник выходит добровольно). **Владелец не может покинуть проект.**

**Response 200:**
```json
{
  "message": "Left project"
}
```

**Ошибки:**
- `403` - Владелец не может покинуть проект

---

### POST `/projects/:id/invite`
Сгенерировать код приглашения. **Требуется:** роль admin, lead или manager.

**Body:**
```json
{
  "expiresInHours": 168,
  "maxUses": 5
}
```

**Response 201:**
```json
{
  "invite": {
    "id": "1",
    "code": "XYZ789ABC",
    "project_id": "1",
    "expires_at": "2024-01-08T12:00:00.000Z",
    "max_uses": 5
  }
}
```

---

### POST `/projects/:id/join`
Присоединиться к проекту (self-join для публичных проектов).

**Response 200:**
```json
{
  "message": "Joined project"
}
```

---

### POST `/projects/:id/chat`
Связать чат с проектом. **Требуется:** только владелец (owner).

**Body:**
```json
{
  "chatId": "6"
}
```

**Response 200:**
```json
{
  "message": "Chat linked to project"
}
```

---

### DELETE `/projects/:id/chat`
Отвязать чат от проекта. **Требуется:** только владелец (owner).

**Response 200:**
```json
{
  "message": "Chat unlinked from project"
}
```

---

### GET `/projects/:id/chat`
Получить связанный чат проекта.

**Response 200:**
```json
{
  "chat": {
    "id": "6",
    "title": "Project Chat",
    "username": "project-chat"
  }
}
```

---

### GET `/projects/:id/search-users`
Найти пользователей по username для добавления в участники. **Требуется:** роль admin, lead или manager.

**Query:** `?q=john`

**Response 200:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "johndoe",
      "name": "John Doe",
      "avatar": "https://..."
    }
  ]
}
```

---

### GET `/chats/:chatId/project`
Получить информацию о проекте из контекста чата. Возвращает проект с информацией о членстве пользователя.

**Response 200:**
```json
{
  "project": {
    "id": "2",
    "name": "Lume",
    "slug": "lume",
    "description": "...",
    "status": "launched",
    "member_role": "admin"
  }
}
```

---

## Правила Валидации

### Создание Проекта
- `name`: обязательно, 3-100 символов
- `slug`: обязательно, 3-50 символов, строчные буквы + цифры + дефисы, уникальный
- `description`: опционально, макс 1000 символов
- `status`: опционально, одно из: `"idea"`, `"building"`, `"testing"`, `"launched"`, `"paused"`, `"archived"`
- `visibility`: обязательно, одно из: `"public"`, `"private"`
- `stack`: опционально, массив строк, макс 20 элементов
- `tags`: опционально, массив строк, макс 10 элементов
- `githubUrl`: опционально, валидный URL
- `demoUrl`: опционально, валидный URL
- `lookingForMembers`: опционально, boolean
- `isOpenSource`: опционально, boolean

### Обновление Проекта
- Все поля опциональны
- Та же валидация что и при создании для предоставленных полей
- Status должен быть валидным enum значением

### Добавление Участника
- `userId`: обязательно, валидный ID пользователя (integer)
- `role`: обязательно, одна из ролей проекта

### Связь Чата
- `chatId`: обязательно, валидный ID чата (string)

---

## Разрешения

### Действия с Проектом

| Действие | Owner | Admin | Lead | Manager | Developer | Frontend | Backend | Bot Dev | Designer | Tester | Member |
|----------|-------|-------|------|---------|-----------|----------|---------|---------|----------|--------|--------|
| Просмотр проекта | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Редактирование проекта | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Удаление проекта | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Добавление участников | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Удаление участников | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Поиск пользователей | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Создание задач | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Назначение задач | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Выполнение задач | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Связь/отвязка чата | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Покинуть проект | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Загрузка логотипа | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Схема Базы Данных

### projects
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER REFERENCES workspaces(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'idea',
  visibility VARCHAR(20) DEFAULT 'public',
  stack TEXT[],
  tags TEXT[],
  github_url TEXT,
  demo_url TEXT,
  logo_url TEXT,
  banner_url TEXT,
  looking_for_members BOOLEAN DEFAULT FALSE,
  is_open_source BOOLEAN DEFAULT FALSE,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### project_members
```sql
CREATE TABLE project_members (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(30) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

### project_invites
```sql
CREATE TABLE project_invites (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Интеграция с Задачами

Проекты служат контейнерами для задач. Подробнее в [Модуль Tasks](./TASKS_MODULE.ru.md).

**Workflow задач:**
1. Создать проект
2. Добавить участников команды (admin/lead/manager)
3. Создавать задачи в рамках проекта (admin/lead/manager)
4. Назначать задачи (admin/lead/manager)
5. Отслеживать прогресс (todo → in_progress → review → done)
6. Участники выполняют задачи согласно роли

---

## Интеграция с Чатами

Проекты могут быть связаны с групповым чатом для командной коммуникации. Когда чат связан:
- Только участники проекта могут получить доступ к чату, если проект приватный
- Публичные чаты проекта доступны любому пользователю, присоединившемуся к чату
- Чат отображается на странице проекта во вкладке "Chat"

**Flow связывания чата:**
1. Владелец переходит в настройки проекта → вкладка Chat
2. Выбирает существующий групповой чат из чатов пользователя
3. Чат связывается и появляется в деталях проекта
4. Участники могут открыть чат со страницы проекта

---

## Связанные Документы

- [Модуль Tasks](./TASKS_MODULE.ru.md)
- [Модуль Workspaces](./WORKSPACES_MODULE.ru.md)
- [Модуль Groups](./GROUPS_MODULE.ru.md)
- [Инвентарь Функций](./FEATURES_INVENTORY.ru.md)
- [Projects UI](../PROJECT_UI/PROJECTS_UI.md)
- [README](../README.ru.md)