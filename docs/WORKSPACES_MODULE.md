# LUME Workspaces Module

English | [Русский](../docs-ru/WORKSPACES_MODULE.ru.md) | [中文](../docs-cn/WORKSPACES_MODULE.cn.md)

**Last updated:** 2026-05-18  
**Status:** ✅ Implemented

---

## Overview

The Workspaces Module provides collaborative spaces where teams can organize projects, manage members, and coordinate work. Workspaces serve as containers for projects and provide role-based access control.

---

## Architecture

### Backend

**Files:**
- `backend/src/routes/workspaceRoutes.js` - API routes
- `backend/src/services/workspaceService.js` - Business logic
- `backend/src/validators/workspaceSchemas.js` - Validation schemas

**Database Tables:**
- `workspaces` - Workspace metadata
- `workspace_members` - Member roles and permissions
- `workspace_invites` - Invite codes

### Frontend

**Files:**
- `src/pages/workspaces/WorkspacesPage.tsx` - Workspace list and creation
- `src/pages/workspaces/WorkspaceDetailPage.tsx` - Workspace details
- `src/services/api.ts` - API client methods

---

## Features

### Workspace Types

**Public Workspaces:**
- Visible in explore
- Anyone can request to join
- Searchable

**Private Workspaces:**
- Invite-only
- Not visible in public listings
- Members-only access

### Workspace Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full control, delete workspace, transfer ownership, manage all members |
| **Admin** | Manage members, projects, and settings (cannot remove owner) |
| **Lead** | Create and manage projects, assign tasks |
| **Developer** | Contribute to projects, create tasks |
| **Designer** | Contribute to projects, create tasks |
| **Member** | View projects, participate in discussions |
| **Guest** | Read-only access |

### Role Hierarchy
- Owner (highest) > Admin > Lead > Developer/Designer > Member > Guest (lowest)
- Users cannot manage members with equal or higher roles
- Owner cannot be removed without ownership transfer

---

## API Endpoints

### POST `/workspaces`
Create a new workspace.

**Body:**
```json
{
  "name": "My Workspace",
  "slug": "my-workspace",
  "description": "Building awesome projects together",
  "type": "public",
  "focusTags": ["Web Development", "Open Source"]
}
```

**Response 201:**
```json
{
  "workspace": {
    "id": "1",
    "name": "My Workspace",
    "slug": "my-workspace",
    "description": "Building awesome projects together",
    "type": "public",
    "focus_tags": ["Web Development", "Open Source"],
    "owner_id": "1",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET `/workspaces/my`
Get user's workspaces.

**Response 200:**
```json
{
  "workspaces": [
    {
      "id": "1",
      "name": "My Workspace",
      "slug": "my-workspace",
      "type": "public",
      "role": "owner",
      "member_count": 5
    }
  ]
}
```

### GET `/workspaces/public`
Get public workspaces.

**Response 200:**
```json
{
  "workspaces": [
    {
      "id": "2",
      "name": "Open Source Hub",
      "slug": "open-source-hub",
      "description": "Community for open source developers",
      "type": "public",
      "member_count": 42,
      "focus_tags": ["Open Source"]
    }
  ]
}
```

### GET `/workspaces/:slug`
Get workspace by slug.

**Response 200:**
```json
{
  "workspace": {
    "id": "1",
    "name": "My Workspace",
    "slug": "my-workspace",
    "description": "Building awesome projects together",
    "type": "public",
    "focus_tags": ["Web Development"],
    "owner_id": "1",
    "created_at": "2024-01-01T12:00:00.000Z",
    "member_count": 5,
    "project_count": 3
  }
}
```

### PATCH `/workspaces/:id`
Update workspace (owner/admin only).

**Body:**
```json
{
  "name": "Updated Name",
  "description": "New description",
  "type": "private",
  "focusTags": ["AI", "Machine Learning"]
}
```

**Response 200:**
```json
{
  "workspace": {
    "id": "1",
    "name": "Updated Name",
    "updated_at": "2024-01-02T12:00:00.000Z"
  }
}
```

### DELETE `/workspaces/:id`
Delete workspace (owner only).

**Response 200:**
```json
{
  "message": "Workspace deleted"
}
```

### POST `/workspaces/:id/members`
Add member to workspace (owner/admin only).

**Body:**
```json
{
  "userId": "2",
  "role": "developer",
  "title": "Senior Developer"
}
```

**Response 201:**
```json
{
  "message": "Member added"
}
```

### PATCH `/workspaces/:id/members/:userId`
Update member role (owner/admin only).

**Body:**
```json
{
  "role": "lead",
  "title": "Team Lead"
}
```

**Response 200:**
```json
{
  "message": "Member updated"
}
```

### DELETE `/workspaces/:id/members/:userId`
Remove member (owner/admin only).

**Response 200:**
```json
{
  "message": "Member removed"
}
```

**Errors:**
- `403` - Cannot remove owner without ownership transfer

### GET `/workspaces/:id/members`
Get workspace members.

**Response 200:**
```json
{
  "members": [
    {
      "id": "1",
      "workspace_id": "1",
      "user_id": "1",
      "role": "owner",
      "title": "Founder",
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

### POST `/workspaces/:id/invites`
Generate invite code (owner/admin only).

**Body:**
```json
{
  "expiresInHours": 168,
  "maxUses": 10
}
```

**Response 201:**
```json
{
  "invite": {
    "id": "1",
    "code": "ABC123XYZ",
    "workspace_id": "1",
    "created_by": "1",
    "expires_at": "2024-01-08T12:00:00.000Z",
    "max_uses": 10,
    "uses_count": 0
  }
}
```

### POST `/workspaces/join/:inviteCode`
Join workspace via invite code.

**Response 200:**
```json
{
  "message": "Joined workspace",
  "workspaceId": "1"
}
```

**Errors:**
- `404` - Invite not found or expired
- `400` - Invite exhausted (max uses reached)

---

## Validation Rules

### Create Workspace
- `name`: required, 3-50 characters
- `slug`: required, 3-30 characters, lowercase alphanumeric + hyphens, unique
- `description`: optional, max 500 characters
- `type`: required, one of: "public", "private"
- `focusTags`: optional, array of strings, max 10 tags

### Update Workspace
- All fields optional
- Same validation as create for provided fields

### Add Member
- `userId`: required, valid user ID
- `role`: required, one of: "admin", "lead", "developer", "designer", "member", "guest"
- `title`: optional, max 50 characters

### Create Invite
- `expiresInHours`: optional, default 168 (7 days), max 720 (30 days)
- `maxUses`: optional, default null (unlimited), max 1000

---

## Permissions

### Workspace Actions

| Action | Owner | Admin | Lead | Developer | Member | Guest |
|--------|-------|-------|------|-----------|--------|-------|
| View workspace | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit workspace | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Add members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create invites | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Database Schema

### workspaces
```sql
CREATE TABLE workspaces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'private',
  focus_tags TEXT[],
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### workspace_members
```sql
CREATE TABLE workspace_members (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  title VARCHAR(100),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);
```

### workspace_invites
```sql
CREATE TABLE workspace_invites (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Related Documents

- [Projects Module](./PROJECTS_MODULE.md)
- [Tasks Module](./TASKS_MODULE.md)
- [Onboarding Module](./ONBOARDING_MODULE.md)
- [Features Inventory](./FEATURES_INVENTORY.md)
- [Workspaces UI](./PROJECT_UI/WORKSPACES_UI.md)
- [README](../README.md)