# LUME Projects Module

English | [Русский](../docs-ru/PROJECTS_MODULE.ru.md) | [中文](../docs-cn/PROJECTS_MODULE.cn.md)

**Last updated:** 2026-05-18  
**Status:** ✅ Implemented

---

## Overview

The Projects Module enables teams to create, manage, and showcase their projects. Projects can be linked to workspaces, track tasks, manage team members, and display project information including tech stack, GitHub repos, and demo URLs.

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
- `src/pages/projects/ProjectDetailPage.tsx` - Project details
- `src/services/api.ts` - API client methods

---

## Features

### Project Types

**Public Projects:**
- Visible in explore
- Searchable
- Can be marked as "looking for members"
- Open source friendly

**Private Projects:**
- Workspace members only
- Not visible in public listings
- Internal team projects

### Project Status

- **Planning** - Initial phase, gathering requirements
- **Active** - Currently in development
- **On Hold** - Temporarily paused
- **Completed** - Finished and deployed
- **Archived** - No longer maintained

### Project Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full control, delete project, manage all members |
| **Admin** | Manage members, tasks, and settings |
| **Lead** | Assign tasks, manage development |
| **Manager** | Coordinate team, manage tasks |
| **Developer** | Write code, complete tasks |
| **Frontend** | Frontend development |
| **Backend** | Backend development |
| **Bot Developer** | Bot development |
| **Designer** | UI/UX design |
| **Tester** | Quality assurance |
| **Member** | General contributor |

---

## API Endpoints

### POST `/projects`
Create a new project.

**Body:**
```json
{
  "workspaceId": "1",
  "name": "Awesome App",
  "slug": "awesome-app",
  "description": "Building the next big thing",
  "status": "active",
  "visibility": "public",
  "stack": ["React", "Node.js", "PostgreSQL"],
  "tags": ["Web", "SaaS"],
  "githubUrl": "https://github.com/user/awesome-app",
  "demoUrl": "https://awesome-app.com",
  "logoUrl": "https://example.com/logo.png",
  "bannerUrl": "https://example.com/banner.png",
  "lookingForMembers": true,
  "isOpenSource": true
}
```

**Response 201:**
```json
{
  "project": {
    "id": "1",
    "workspace_id": "1",
    "name": "Awesome App",
    "slug": "awesome-app",
    "owner_id": "1",
    "status": "active",
    "visibility": "public",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET `/projects/my`
Get user's projects.

**Response 200:**
```json
{
  "projects": [
    {
      "id": "1",
      "name": "Awesome App",
      "slug": "awesome-app",
      "status": "active",
      "visibility": "public",
      "role": "owner",
      "member_count": 3,
      "task_count": 12
    }
  ]
}
```

### GET `/projects/public`
Get public projects.

**Response 200:**
```json
{
  "projects": [
    {
      "id": "2",
      "name": "Open Source Tool",
      "slug": "open-source-tool",
      "description": "Useful developer tool",
      "status": "active",
      "visibility": "public",
      "stack": ["Python", "FastAPI"],
      "tags": ["CLI", "DevTools"],
      "looking_for_members": true,
      "is_open_source": true,
      "member_count": 5
    }
  ]
}
```

### GET `/projects/:slug`
Get project by slug.

**Response 200:**
```json
{
  "project": {
    "id": "1",
    "workspace_id": "1",
    "name": "Awesome App",
    "slug": "awesome-app",
    "description": "Building the next big thing",
    "status": "active",
    "visibility": "public",
    "stack": ["React", "Node.js", "PostgreSQL"],
    "tags": ["Web", "SaaS"],
    "github_url": "https://github.com/user/awesome-app",
    "demo_url": "https://awesome-app.com",
    "logo_url": "https://example.com/logo.png",
    "banner_url": "https://example.com/banner.png",
    "looking_for_members": true,
    "is_open_source": true,
    "owner_id": "1",
    "created_at": "2024-01-01T12:00:00.000Z",
    "member_count": 3,
    "task_count": 12
  }
}
```

### PATCH `/projects/:id`
Update project (admin/lead/manager only).

**Body:**
```json
{
  "name": "Updated Name",
  "description": "New description",
  "status": "completed",
  "visibility": "private",
  "stack": ["React", "TypeScript", "PostgreSQL"],
  "lookingForMembers": false
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

### DELETE `/projects/:id`
Delete project (owner only).

**Response 200:**
```json
{
  "message": "Project deleted"
}
```

### POST `/projects/:id/members`
Add member to project (admin/lead/manager only).

**Body:**
```json
{
  "userId": "2",
  "role": "developer"
}
```

**Response 201:**
```json
{
  "message": "Project member upserted"
}
```

### GET `/projects/:id/members`
Get project members.

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
        "avatar": "..."
      }
    }
  ]
}
```

### DELETE `/projects/:id/members/:userId`
Remove member (admin/lead/manager only).

**Response 200:**
```json
{
  "message": "Project member removed"
}
```

### POST `/projects/:id/invite`
Generate invite code (admin/lead/manager only).

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

## Validation Rules

### Create Project
- `workspaceId`: optional, valid workspace ID
- `name`: required, 3-100 characters
- `slug`: required, 3-50 characters, lowercase alphanumeric + hyphens, unique
- `description`: optional, max 1000 characters
- `status`: optional, one of: "planning", "active", "on_hold", "completed", "archived"
- `visibility`: required, one of: "public", "private"
- `stack`: optional, array of strings, max 20 items
- `tags`: optional, array of strings, max 10 items
- `githubUrl`: optional, valid URL
- `demoUrl`: optional, valid URL
- `logoUrl`: optional, valid URL
- `bannerUrl`: optional, valid URL
- `lookingForMembers`: optional, boolean
- `isOpenSource`: optional, boolean

### Update Project
- All fields optional
- Same validation as create for provided fields

### Add Member
- `userId`: required, valid user ID
- `role`: required, one of project roles

---

## Permissions

### Project Actions

| Action | Owner | Admin | Lead | Manager | Developer | Designer | Tester | Member |
|--------|-------|-------|------|---------|-----------|----------|--------|--------|
| View project | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit project | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Add members | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Assign tasks | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Complete tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

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
  status VARCHAR(20) DEFAULT 'planning',
  visibility VARCHAR(20) DEFAULT 'private',
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
2. Add team members
3. Create tasks within project
4. Assign tasks to members
5. Track progress (todo → in_progress → review → done)

---

## Related Documents

- [Tasks Module](./TASKS_MODULE.md)
- [Workspaces Module](./WORKSPACES_MODULE.md)
- [Features Inventory](./FEATURES_INVENTORY.md)
- [Projects UI](./PROJECT_UI/PROJECTS_UI.md)
- [README](../README.md)