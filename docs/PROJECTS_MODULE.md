# LUME Projects Module

English | [Русский](../docs-ru/PROJECTS_MODULE.ru.md) | [中文](../docs-cn/PROJECTS_MODULE.cn.md)

**Last updated:** 2026-05-18
**Status:** ✅ Implemented

---

## Overview

The Projects Module enables teams to create, manage, and showcase their projects. Projects can track tasks, manage team members, display tech stack, GitHub repos, demo URLs, and be linked to a dedicated chat for team communication.

---

## Architecture

### Backend

**Files:**
- `backend/src/routes/projectRoutes.js` - API routes
- `backend/src/services/projectService.js` - Business logic
- `backend/src/validators/projectSchemas.js` - Validation schemas

**Database Tables:**
- `projects` - Project metadata
- `project_members` - Team members and roles
- `project_invites` - Invite codes

### Frontend

**Files:**
- `src/pages/projects/ProjectsPage.tsx` - Project list and creation
- `src/pages/projects/ProjectDetailPage.tsx` - Project details with tabs (overview, tasks, members, chat, settings)
- `src/components/projects/ProjectSettingsModal.tsx` - Settings modal with general/members/chat/danger tabs
- `src/services/api.ts` - API client methods (`projectsAPI`, `projectMembersAPI`)

---

## Features

### Project Types

**Public Projects:**
- Visible in explore/public listings
- Searchable
- Can be marked as "looking for members"
- Open source friendly
- Any authenticated user can view

**Private Projects:**
- Visible only to project members
- Not visible in public listings
- Internal team projects

### Project Status

| Status | Description |
|--------|-------------|
| **idea** | Initial concept, planning stage |
| **building** | Actively being developed |
| **testing** | In testing/QA phase |
| **launched** | Live and deployed |
| **paused** | Temporarily paused |
| **archived** | No longer maintained |

### Project Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full control, delete project, manage all members, link/unlink chat |
| **Admin** | Edit project, manage members, create/manage tasks |
| **Lead** | Edit project, manage members, create/manage tasks |
| **Manager** | Edit project, manage members, create/manage tasks |
| **Developer** | View project, complete tasks |
| **Frontend** | View project, complete frontend tasks |
| **Backend** | View project, complete backend tasks |
| **Bot Developer** | View project, complete bot tasks |
| **Designer** | View project, complete design tasks |
| **Tester** | View project, complete testing tasks |
| **Member** | View project, complete tasks |

---

## API Endpoints

### POST `/projects`
Create a new project.

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
Get user's projects (owned + member of).

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
Get public projects (for explore).

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
Get project by slug.

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
Update project. **Requires:** admin, lead, or manager role.

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
Upload project logo/avatar. **Requires:** admin, lead, or manager role.

**Body:** `multipart/form-data` with `file` field

**Response 200:**
```json
{
  "project": { ... },
  "logoUrl": "https://res.cloudinary.com/..."
}
```

---

### DELETE `/projects/:id`
Delete project. **Requires:** owner only.

**Response 200:**
```json
{
  "message": "Project deleted"
}
```

---

### POST `/projects/:id/members`
Add or update project member. **Requires:** admin, lead, or manager role.

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
Get all project members.

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
Remove member from project. **Requires:** admin, lead, or manager role.

**Response 200:**
```json
{
  "message": "Project member removed"
}
```

---

### POST `/projects/:id/leave`
Leave project (member exits voluntarily). **Owner cannot leave.**

**Response 200:**
```json
{
  "message": "Left project"
}
```

**Errors:**
- `403` - Owner cannot leave project

---

### POST `/projects/:id/invite`
Generate project invite code. **Requires:** admin, lead, or manager role.

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
Join project (self-join for public projects).

**Response 200:**
```json
{
  "message": "Joined project"
}
```

---

### POST `/projects/:id/chat`
Link a chat to the project. **Requires:** owner only.

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
Unlink chat from project. **Requires:** owner only.

**Response 200:**
```json
{
  "message": "Chat unlinked from project"
}
```

---

### GET `/projects/:id/chat`
Get linked chat for project.

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
Search users by username to add as members. **Requires:** admin, lead, or manager role.

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
Get project info from chat context. Returns project with user membership info.

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

## Validation Rules

### Create Project
- `name`: required, 3-100 characters
- `slug`: required, 3-50 characters, lowercase alphanumeric + hyphens, unique
- `description`: optional, max 1000 characters
- `status`: optional, one of: `"idea"`, `"building"`, `"testing"`, `"launched"`, `"paused"`, `"archived"`
- `visibility`: required, one of: `"public"`, `"private"`
- `stack`: optional, array of strings, max 20 items
- `tags`: optional, array of strings, max 10 items
- `githubUrl`: optional, valid URL
- `demoUrl`: optional, valid URL
- `lookingForMembers`: optional, boolean
- `isOpenSource`: optional, boolean

### Update Project
- All fields optional
- Same validation as create for provided fields
- Status must be valid enum value

### Add Member
- `userId`: required, valid user ID (integer)
- `role`: required, one of project roles

### Chat Link
- `chatId`: required, valid chat ID (string)

---

## Permissions

### Project Actions

| Action | Owner | Admin | Lead | Manager | Developer | Frontend | Backend | Bot Dev | Designer | Tester | Member |
|--------|-------|-------|------|---------|-----------|----------|---------|---------|----------|--------|--------|
| View project | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit project | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Add members | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Search users | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign tasks | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Complete tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Link/unlink chat | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Leave project | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload logo | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Database Schema

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

## Integration with Tasks

Projects serve as containers for tasks. See [Tasks Module](./TASKS_MODULE.md) for task management details.

**Task Workflow:**
1. Create project
2. Add team members (admin/lead/manager)
3. Create tasks within project (admin/lead/manager)
4. Assign tasks (admin/lead/manager)
5. Track progress (todo → in_progress → review → done)
6. Members complete tasks based on role

---

## Chat Integration

Projects can be linked to a group chat for team communication. When a chat is linked:
- Only project members can access the chat if the project is private
- Public project chats are accessible by any user who joins the chat
- The chat appears in the project detail page under the "Chat" tab

**Chat Link Flow:**
1. Owner navigates to project settings → Chat tab
2. Selects an existing group chat from user's chats
3. Chat is linked and appears in project detail
4. Members can open the chat from project page

---

## Related Documents

- [Tasks Module](./TASKS_MODULE.md)
- [Workspaces Module](./WORKSPACES_MODULE.md)
- [Groups Module](./GROUPS_MODULE.md)
- [Features Inventory](./FEATURES_INVENTORY.md)
- [Projects UI](../PROJECT_UI/PROJECTS_UI.md)
- [README](../README.md)