# LUME Tasks Module

English | [Русский](../docs-ru/TASKS_MODULE.ru.md) | [中文](../docs-cn/TASKS_MODULE.cn.md)

**Last updated:** 2026-05-18  
**Status:** ✅ Implemented

---

## Overview

The Tasks Module provides Kanban-style task management within projects. Teams can create, assign, track, and comment on tasks with a clear workflow from creation to completion.

---

## Architecture

### Backend

**Files:**
- `backend/src/routes/taskRoutes.js` - API routes
- `backend/src/services/taskService.js` - Business logic
- `backend/src/validators/taskSchemas.js` - Validation schemas

**Database Tables:**
- `tasks` - Task metadata
- `task_comments` - Task discussion threads

### Frontend

**Files:**
- `src/pages/projects/ProjectDetailPage.tsx` - Task board UI (integrated)
- `src/services/api.ts` - API client methods

---

## Features

### Task Status Workflow

```
todo → in_progress → review → done
```

**Status Descriptions:**
- **todo** - Backlog, not started
- **in_progress** - Currently being worked on
- **review** - Awaiting review/testing
- **done** - Completed

### Task Priority Levels

- **low** - Nice to have, not urgent
- **medium** - Standard priority
- **high** - Important, should be done soon
- **urgent** - Critical, needs immediate attention

### Task Properties

- **Title** - Short description (required)
- **Description** - Detailed information (optional)
- **Status** - Current workflow state
- **Priority** - Importance level
- **Assignee** - Team member responsible
- **Source Message** - Link to originating message (optional)
- **Created By** - Task creator
- **Created At** - Timestamp
- **Updated At** - Last modification

---

## API Endpoints

### POST `/projects/:projectId/tasks`
Create a task (admin/lead/manager only).

**Body:**
```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based auth with refresh tokens",
  "status": "todo",
  "priority": "high",
  "assigneeId": "2",
  "sourceMessageId": "123"
}
```

**Response 201:**
```json
{
  "task": {
    "id": "1",
    "project_id": "1",
    "title": "Implement user authentication",
    "description": "Add JWT-based auth with refresh tokens",
    "status": "todo",
    "priority": "high",
    "assignee_id": "2",
    "source_message_id": "123",
    "created_by": "1",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET `/projects/:projectId/tasks`
Get all tasks for a project.

**Response 200:**
```json
{
  "tasks": [
    {
      "id": "1",
      "project_id": "1",
      "title": "Implement user authentication",
      "description": "Add JWT-based auth with refresh tokens",
      "status": "in_progress",
      "priority": "high",
      "assignee_id": "2",
      "created_by": "1",
      "created_at": "2024-01-01T12:00:00.000Z",
      "updated_at": "2024-01-02T10:00:00.000Z",
      "assignee": {
        "id": "2",
        "username": "janedoe",
        "name": "Jane Doe",
        "avatar": "..."
      },
      "creator": {
        "id": "1",
        "username": "johndoe",
        "name": "John Doe"
      }
    }
  ]
}
```

### PATCH `/tasks/:taskId`
Update a task.

**Permissions:**
- Admin/Lead/Manager: can update any task
- Task creator: can update own tasks
- Assignee: can update assigned tasks

**Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "review",
  "priority": "medium",
  "assigneeId": "3"
}
```

**Response 200:**
```json
{
  "task": {
    "id": "1",
    "title": "Updated title",
    "status": "review",
    "updated_at": "2024-01-03T14:00:00.000Z"
  }
}
```

### DELETE `/tasks/:taskId`
Delete a task (admin/lead/manager only).

**Response 200:**
```json
{
  "message": "Task deleted"
}
```

### POST `/tasks/:taskId/comments`
Add a comment to a task.

**Body:**
```json
{
  "content": "I've started working on this. Should be done by Friday."
}
```

**Response 201:**
```json
{
  "comment": {
    "id": "1",
    "task_id": "1",
    "user_id": "2",
    "content": "I've started working on this. Should be done by Friday.",
    "created_at": "2024-01-02T11:00:00.000Z",
    "user": {
      "id": "2",
      "username": "janedoe",
      "name": "Jane Doe",
      "avatar": "..."
    }
  }
}
```

---

## Validation Rules

### Create Task
- `title`: required, 3-200 characters
- `description`: optional, max 2000 characters
- `status`: optional, default "todo", one of: "todo", "in_progress", "review", "done"
- `priority`: optional, default "medium", one of: "low", "medium", "high", "urgent"
- `assigneeId`: optional, valid user ID (must be project member)
- `sourceMessageId`: optional, valid message ID

### Update Task
- All fields optional
- Same validation as create for provided fields
- Cannot change `project_id` or `created_by`

### Add Comment
- `content`: required, 1-1000 characters

---

## Permissions

### Task Actions

| Action | Admin/Lead/Manager | Task Creator | Assignee | Other Members |
|--------|-------------------|--------------|----------|---------------|
| View tasks | ✅ | ✅ | ✅ | ✅ |
| Create task | ✅ | ❌ | ❌ | ❌ |
| Update any task | ✅ | ❌ | ❌ | ❌ |
| Update own task | ✅ | ✅ | ✅ | ❌ |
| Delete task | ✅ | ❌ | ❌ | ❌ |
| Add comment | ✅ | ✅ | ✅ | ✅ |
| Assign task | ✅ | ❌ | ❌ | ❌ |

---

## Database Schema

### tasks
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'todo',
  priority VARCHAR(20) DEFAULT 'medium',
  assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  source_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### task_comments
```sql
CREATE TABLE task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Workflow Examples

### Creating a Task from a Message

1. User sends message in project chat: "We need to add dark mode"
2. Admin clicks "Create Task" on message
3. Task created with `source_message_id` linking to original message
4. Task appears in project board

### Task Lifecycle

1. **Created** - Admin creates task with status "todo"
2. **Assigned** - Admin assigns to developer
3. **Started** - Developer changes status to "in_progress"
4. **Review** - Developer completes work, changes to "review"
5. **Testing** - Tester reviews and tests
6. **Done** - Tester marks as "done"

### Commenting on Tasks

1. Team members discuss implementation details
2. Assignee asks questions
3. Admin provides clarification
4. All comments timestamped and attributed

---

## UI Integration

### Kanban Board View

Tasks displayed in columns by status:
- **Todo** - Backlog items
- **In Progress** - Active work
- **Review** - Awaiting review
- **Done** - Completed tasks

### Task Card

Each task card shows:
- Title
- Priority badge (color-coded)
- Assignee avatar
- Comment count
- Created date

### Task Detail Modal

Clicking a task opens modal with:
- Full description
- Status dropdown
- Priority selector
- Assignee selector
- Comment thread
- Edit/Delete buttons (if permitted)

---

## Best Practices

### Task Creation
- Use clear, actionable titles
- Include acceptance criteria in description
- Set appropriate priority
- Assign to specific team member when possible

### Task Updates
- Update status as work progresses
- Add comments for significant changes
- Notify team of blockers

### Task Management
- Keep tasks small and focused
- Break large tasks into subtasks
- Review and update priorities regularly
- Archive completed tasks periodically

---

## Related Documents

- [Projects Module](./PROJECTS_MODULE.md)
- [Workspaces Module](./WORKSPACES_MODULE.md)
- [Features Inventory](./FEATURES_INVENTORY.md)
- [README](../README.md)