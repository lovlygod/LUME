# LUME Projects UI

English | [Русский](../../docs-ru/PROJECT_UI/PROJECTS_UI.ru.md) | [中文](../../docs-cn/PROJECT_UI/PROJECTS_UI.cn.md)

**Last updated:** 2026-05-18

---

## Overview

The Projects UI provides interfaces for creating, browsing, and managing projects. Projects can be standalone or linked to workspaces, with task management, team collaboration, and showcase features.

---

## Routes

### Projects List
**Path:** `/projects`  
**Component:** `src/pages/projects/ProjectsPage.tsx`  
**Layout:** MainLayout (authenticated)

### Project Detail
**Path:** `/projects/:slug`  
**Component:** `src/pages/projects/ProjectDetailPage.tsx`  
**Layout:** MainLayout (authenticated)

---

## Projects List Page

### Layout Structure

```
┌─────────────────────────────────────┐
│ Header: "Projects"                  │
│ [Create Project]                    │
├─────────────────────────────────────┤
│ Tabs: [My Projects] [Explore]      │
├─────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ Project │ │ Project │ │ Project ││
│ │  Card   │ │  Card   │ │  Card   ││
│ └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────┘
```

### My Projects Tab

**Purpose:** Display user's projects

**Project Card:**
- Banner/logo image
- Project name
- Description (truncated)
- Status badge (Planning, Active, Completed, etc.)
- Tech stack icons (max 5, +N more)
- Member avatars (max 3, +N more)
- Task progress bar (X/Y tasks completed)
- User's role badge
- Click → navigate to project detail

**Empty State:**
- Message: "You haven't created any projects yet"
- CTA: "Create your first project" button

### Explore Tab

**Purpose:** Browse public projects

**Filters:**
- Status dropdown (All, Active, Looking for members)
- Tech stack filter (multi-select)
- Tags filter
- Open source toggle

**Project Card:**
- Same as My Projects
- "Looking for members" badge (if applicable)
- "Open Source" badge (if applicable)
- GitHub star count (if linked)

**Empty State:**
- Message: "No public projects found"
- Adjust filters suggestion

---

## Create Project Modal

### Trigger
- Click "Create Project" button

### Form Sections

#### Basic Information

**Name** (required)
- Input type: text
- Validation: 3-100 characters
- Placeholder: "My Awesome Project"

**Slug** (required)
- Input type: text
- Auto-generated from name
- Editable
- Validation: 3-50 characters, lowercase, alphanumeric + hyphens
- Real-time availability check

**Workspace** (optional)
- Dropdown: user's workspaces
- Option: "No workspace (standalone)"

**Description** (optional)
- Textarea
- Validation: max 1000 characters
- Markdown support
- Preview toggle

#### Project Details

**Status** (required)
- Dropdown: Planning, Active, On Hold, Completed, Archived
- Default: Planning

**Visibility** (required)
- Radio: Public / Private
- Default: Private

**Tech Stack** (optional)
- Multi-select with autocomplete
- Popular options: React, Node.js, Python, etc.
- Custom input allowed
- Max 20 items

**Tags** (optional)
- Comma-separated input
- Converts to chips
- Max 10 tags

#### Links

**GitHub URL** (optional)
- Input type: url
- Validation: valid GitHub URL
- Auto-fetch repo info (stars, language)

**Demo URL** (optional)
- Input type: url
- Validation: valid URL
- Auto-prefix https:// if missing

**Logo URL** (optional)
- Input type: url
- Image upload alternative
- Preview

**Banner URL** (optional)
- Input type: url
- Image upload alternative
- Preview

#### Settings

**Looking for Members** (optional)
- Checkbox
- Shows in explore with badge

**Open Source** (optional)
- Checkbox
- Adds open source badge

### Actions
- **Create Project** - Submit form
- **Cancel** - Close modal

### Validation
- Real-time validation
- Submit disabled until valid
- Error messages inline

---

## Project Detail Page

### Layout Structure

```
┌─────────────────────────────────────────┐
│ Banner Image                            │
├─────────────────────────────────────────┤
│ Logo  Project Name      [Edit] [Delete]│
│       @slug • Status • Visibility       │
│       Description...                    │
│       Stack: [React] [Node] [Postgres] │
│       Tags: [Web] [SaaS]                │
│       [GitHub] [Demo] [Looking for Team]│
├─────────────────────────────────────────┤
│ Tabs: [Overview] [Tasks] [Team]        │
├─────────────────────────────────────────┤
│ Tab Content                             │
└─────────────────────────────────────────┘
```

### Header Section

**Banner**
- Full-width banner image
- Fallback: gradient

**Logo & Title**
- Project logo (left)
- Project name (h1)
- Slug, status, visibility
- Description (expandable if long)
- Tech stack badges
- Tags
- Action buttons

**Links**
- GitHub button (with star count)
- Demo button
- "Looking for members" badge

**Actions** (role-dependent)
- **Edit** button (owner/admin/lead/manager)
- **Delete** button (owner only)
- **Join Team** button (non-members, if looking for members)

### Overview Tab

**Purpose:** Project summary and activity

**Sections:**

1. **About**
   - Full description (Markdown rendered)
   - Created date
   - Last updated

2. **Quick Stats**
   - Total tasks
   - Completed tasks
   - Team members
   - GitHub stars (if linked)

3. **Recent Activity**
   - Task updates
   - New members
   - Status changes
   - Limit: 10 items

4. **Team Highlights**
   - Member avatars with roles
   - "View all" link to Team tab

### Tasks Tab

**Purpose:** Kanban board for task management

**Layout:**
```
┌──────────┬──────────┬──────────┬──────────┐
│   Todo   │In Progress│  Review  │   Done   │
├──────────┼──────────┼──────────┼──────────┤
│ [Task 1] │ [Task 3] │ [Task 5] │ [Task 7] │
│ [Task 2] │ [Task 4] │ [Task 6] │ [Task 8] │
│    +     │    +     │    +     │    +     │
└──────────┴──────────┴──────────┴──────────┘
```

**Task Card:**
- Title
- Priority badge (color-coded)
- Assignee avatar
- Comment count
- Created date
- Drag to move between columns

**Actions:**
- **Create Task** button (admin/lead/manager)
- **Filter** dropdown (by assignee, priority)
- **Sort** dropdown (by date, priority)

**Task Detail Modal:**
- Full description
- Status dropdown
- Priority selector
- Assignee selector
- Comment thread
- Edit/Delete buttons (if permitted)

### Team Tab

**Purpose:** Manage project team

**Member List:**
- Avatar
- Name and username
- Role badge
- Joined date
- Actions menu (admin/lead/manager):
  - Change role
  - Remove member

**Actions:**
- **Invite Members** button (admin/lead/manager)
- **Generate Invite Link** button (admin/lead/manager)

**Role Filter:**
- Dropdown: All, Owner, Admin, Lead, Developer, etc.

---

## Edit Project Modal

### Trigger
- Click "Edit" button

### Form
- Same fields as Create Project
- Pre-filled with current values
- Additional: Transfer ownership (owner only)

### Actions
- **Save Changes**
- **Cancel**

---

## Create Task Modal

### Trigger
- Click "+" in task column or "Create Task" button

### Form Fields

**Title** (required)
- Input: text
- Validation: 3-200 characters

**Description** (optional)
- Textarea
- Markdown support
- Max 2000 characters

**Status** (required)
- Dropdown: Todo, In Progress, Review, Done
- Default: based on column clicked

**Priority** (required)
- Dropdown: Low, Medium, High, Urgent
- Default: Medium
- Color-coded

**Assignee** (optional)
- Dropdown: project members
- Searchable
- Avatar preview

### Actions
- **Create Task**
- **Cancel**

---

## Invite Members Modal

### Options

**1. Generate Invite Link**
- Expiration dropdown
- Max uses input
- Generate button
- Copy link

**2. Add by Username**
- Username autocomplete
- Role selector
- Add button

---

## Responsive Design

### Desktop (≥1024px)
- Three-column grid for project cards
- Four-column Kanban board
- Side-by-side modals

### Tablet (768px - 1023px)
- Two-column grid
- Scrollable Kanban
- Full-width modals

### Mobile (<768px)
- Single-column list
- Vertical Kanban (stacked columns)
- Bottom sheet modals
- Swipe gestures for task status

---

## Loading States

### Initial Load
- Skeleton cards
- Shimmer effect

### Task Board
- Column skeletons
- Loading spinner for actions

### Drag & Drop
- Ghost card while dragging
- Drop zone highlights

---

## Error Handling

### API Errors
- Toast notifications
- Retry buttons
- Fallback to cached data

### Validation Errors
- Inline messages
- Prevent submission
- Highlight invalid fields

### Network Errors
- Offline banner
- Queue actions for retry
- Show cached data

---

## Animations

### Page Transitions
- Fade in on mount
- Slide for modals

### Card Interactions
- Hover: scale up
- Click: ripple

### Drag & Drop
- Smooth transitions
- Spring physics
- Drop animations

### Task Status Change
- Slide between columns
- Confetti on completion (optional)

---

## Components Used

### UI Components
- `Card` - Project/task cards
- `Button` - Actions
- `Input` - Form fields
- `Textarea` - Descriptions
- `Select` / `CustomSelect` - Dropdowns
- `Badge` - Status, priority, tags
- `Avatar` - User avatars
- `Tabs` - Navigation
- `Dialog` - Modals
- `DropdownMenu` - Actions
- `Progress` - Task completion

### Custom Components
- `ProjectCard` - Project display
- `TaskCard` - Task display
- `KanbanBoard` - Task board
- `MemberList` - Team management
- `TechStackBadge` - Tech icons

### Third-party
- `react-beautiful-dnd` - Drag and drop (if used)
- `react-markdown` - Markdown rendering

---

## API Integration

### Endpoints Used
- `GET /projects/my` - User's projects
- `GET /projects/public` - Public projects
- `GET /projects/:slug` - Project details
- `POST /projects` - Create project
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `GET /projects/:id/members` - Get members
- `POST /projects/:id/members` - Add member
- `DELETE /projects/:id/members/:userId` - Remove member
- `POST /projects/:id/invite` - Generate invite
- `GET /projects/:projectId/tasks` - Get tasks
- `POST /projects/:projectId/tasks` - Create task
- `PATCH /tasks/:taskId` - Update task
- `DELETE /tasks/:taskId` - Delete task
- `POST /tasks/:taskId/comments` - Add comment

---

## Related Documents

- [Projects Module](../PROJECTS_MODULE.md)
- [Tasks Module](../TASKS_MODULE.md)
- [Workspaces UI](./WORKSPACES_UI.md)
- [Routes](./ROUTES.md)
- [Overview](./OVERVIEW.md)