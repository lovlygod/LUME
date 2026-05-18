# LUME Workspaces UI

English | [Русский](../../docs-ru/PROJECT_UI/WORKSPACES_UI.ru.md) | [中文](../../docs-cn/PROJECT_UI/WORKSPACES_UI.cn.md)

**Last updated:** 2026-05-18

---

## Overview

The Workspaces UI provides interfaces for creating, browsing, and managing collaborative workspaces where teams organize their projects.

---

## Routes

### Workspaces List
**Path:** `/workspaces`  
**Component:** `src/pages/workspaces/WorkspacesPage.tsx`  
**Layout:** MainLayout (authenticated)

### Workspace Detail
**Path:** `/workspaces/:slug`  
**Component:** `src/pages/workspaces/WorkspaceDetailPage.tsx`  
**Layout:** MainLayout (authenticated)

---

## Workspaces List Page

### Layout Structure

```
┌─────────────────────────────────────┐
│ Header: "Workspaces"                │
│ [Create Workspace] [Join via Code]  │
├─────────────────────────────────────┤
│ Tabs: [My Workspaces] [Explore]    │
├─────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │Workspace│ │Workspace│ │Workspace││
│ │  Card   │ │  Card   │ │  Card   ││
│ └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────┘
```

### My Workspaces Tab

**Purpose:** Display workspaces where user is a member

**Workspace Card:**
- Workspace name
- Description (truncated)
- Member count
- User's role badge
- Focus tags
- Click → navigate to workspace detail

**Empty State:**
- Message: "You haven't joined any workspaces yet"
- CTA: "Create your first workspace" button

### Explore Tab

**Purpose:** Browse public workspaces

**Workspace Card:**
- Workspace name
- Description (truncated)
- Member count
- Focus tags
- "Join" button (if not a member)
- Click → navigate to workspace detail

**Empty State:**
- Message: "No public workspaces available"

---

## Create Workspace Modal

### Trigger
- Click "Create Workspace" button

### Form Fields

**Name** (required)
- Input type: text
- Validation: 3-50 characters
- Placeholder: "My Awesome Team"

**Slug** (required)
- Input type: text
- Auto-generated from name
- Editable
- Validation: 3-30 characters, lowercase, alphanumeric + hyphens
- Placeholder: "my-awesome-team"
- Real-time availability check

**Description** (optional)
- Input type: textarea
- Validation: max 500 characters
- Placeholder: "What is your workspace about?"

**Type** (required)
- Radio buttons: Public / Private
- Default: Private
- Help text:
  - Public: "Visible in explore, anyone can request to join"
  - Private: "Invite-only, not visible in public listings"

**Focus Tags** (optional)
- Input type: text (comma-separated)
- Placeholder: "Web Development, Open Source, AI"
- Converts to array on submit

### Actions
- **Create** - Submit form
- **Cancel** - Close modal

### Validation
- Real-time validation on blur
- Submit button disabled until valid
- Error messages below fields

---

## Join Workspace Modal

### Trigger
- Click "Join via Code" button

### Form Fields

**Invite Code** (required)
- Input type: text
- Placeholder: "Enter invite code"
- Uppercase transformation
- Validation: alphanumeric, 6-20 characters

### Actions
- **Join** - Submit code
- **Cancel** - Close modal

### Success
- Toast: "Successfully joined workspace"
- Refresh workspace list
- Close modal

### Errors
- "Invalid or expired invite code"
- "Invite has reached maximum uses"

---

## Workspace Detail Page

### Layout Structure

```
┌─────────────────────────────────────────┐
│ Banner Image                            │
├─────────────────────────────────────────┤
│ Workspace Name          [Edit] [Leave] │
│ @slug • Public • 12 members             │
│ Description text...                     │
│ Tags: [Web] [Open Source]               │
├─────────────────────────────────────────┤
│ Tabs: [Projects] [Members] [Settings]  │
├─────────────────────────────────────────┤
│ Tab Content                             │
└─────────────────────────────────────────┘
```

### Header Section

**Banner**
- Optional banner image
- Fallback: gradient background

**Title Area**
- Workspace name (h1)
- Slug, type, member count
- Description
- Focus tags as badges

**Actions** (role-dependent)
- **Edit** button (owner/admin)
- **Leave** button (all members except owner)
- **Join** button (non-members, public workspaces)

### Projects Tab

**Purpose:** List all projects in workspace

**Project Card:**
- Project name
- Description
- Status badge (Planning, Active, etc.)
- Tech stack icons
- Member avatars
- Click → navigate to project detail

**Actions:**
- **Create Project** button (owner/admin/lead)

**Empty State:**
- "No projects yet"
- "Create your first project" button

### Members Tab

**Purpose:** Display and manage workspace members

**Member List:**
- Avatar
- Name and username
- Role badge
- Title (if set)
- Joined date
- Actions menu (owner/admin):
  - Change role
  - Remove member

**Actions:**
- **Invite Members** button (owner/admin)
- **Generate Invite Link** button (owner/admin)

**Role Filter:**
- Dropdown to filter by role
- Options: All, Owner, Admin, Lead, Developer, etc.

### Settings Tab

**Purpose:** Workspace configuration (owner/admin only)

**Sections:**

1. **General Settings**
   - Edit name
   - Edit description
   - Change type (public/private)
   - Update focus tags

2. **Invite Management**
   - Active invites list
   - Generate new invite
   - Revoke invite

3. **Danger Zone** (owner only)
   - Transfer ownership
   - Delete workspace

---

## Edit Workspace Modal

### Trigger
- Click "Edit" button (owner/admin)

### Form Fields
- Same as Create Workspace
- Pre-filled with current values

### Actions
- **Save Changes** - Update workspace
- **Cancel** - Discard changes

---

## Invite Members Modal

### Trigger
- Click "Invite Members" button

### Options

**1. Generate Invite Link**
- Expiration: dropdown (24h, 7 days, 30 days, Never)
- Max uses: input (optional, default unlimited)
- Generate button
- Copy link button
- Share via: Email, Telegram, etc.

**2. Add by Username**
- Username input with autocomplete
- Role selector
- Title input (optional)
- Add button

---

## Member Management

### Change Role Modal

**Trigger:** Click role badge → Change role

**Form:**
- Role dropdown
- Title input
- Save button

**Validation:**
- Cannot promote to equal/higher role than self
- Cannot change owner role

### Remove Member Confirmation

**Trigger:** Click Remove in actions menu

**Modal:**
- Warning message
- Member name and role
- Confirm button (destructive)
- Cancel button

**Restrictions:**
- Cannot remove owner
- Cannot remove users with equal/higher role

---

## Responsive Design

### Desktop (≥1024px)
- Three-column grid for workspace cards
- Side-by-side tabs and content
- Full-width modals (max 600px)

### Tablet (768px - 1023px)
- Two-column grid
- Stacked tabs
- Full-width modals

### Mobile (<768px)
- Single-column list
- Bottom sheet modals
- Hamburger menu for actions

---

## Loading States

### Initial Load
- Skeleton cards for workspaces
- Shimmer effect

### Action Loading
- Button spinner
- Disabled state
- Loading overlay for modals

---

## Error Handling

### API Errors
- Toast notifications
- Inline error messages
- Retry buttons

### Validation Errors
- Real-time validation
- Error messages below fields
- Prevent submission

### Network Errors
- "Connection lost" banner
- Auto-retry on reconnection
- Cached data display

---

## Animations

### Page Transitions
- Fade in on mount
- Slide up for modals

### Card Interactions
- Hover: slight scale up
- Click: ripple effect

### Tab Switching
- Slide transition between tabs

---

## Components Used

### UI Components
- `Card` - Workspace/project cards
- `Button` - Actions
- `Input` - Form fields
- `Textarea` - Descriptions
- `Select` / `CustomSelect` - Dropdowns
- `Badge` - Tags, roles, status
- `Avatar` - User avatars
- `Tabs` - Navigation
- `Dialog` - Modals
- `DropdownMenu` - Action menus

### Custom Components
- `WorkspaceCard` - Workspace display
- `MemberList` - Member management
- `InviteGenerator` - Invite creation

---

## API Integration

### Endpoints Used
- `GET /workspaces/my` - User's workspaces
- `GET /workspaces/public` - Public workspaces
- `GET /workspaces/:slug` - Workspace details
- `POST /workspaces` - Create workspace
- `PATCH /workspaces/:id` - Update workspace
- `DELETE /workspaces/:id` - Delete workspace
- `GET /workspaces/:id/members` - Get members
- `POST /workspaces/:id/members` - Add member
- `PATCH /workspaces/:id/members/:userId` - Update member
- `DELETE /workspaces/:id/members/:userId` - Remove member
- `POST /workspaces/:id/invites` - Generate invite
- `POST /workspaces/join/:inviteCode` - Join via code

---

## Related Documents

- [Workspaces Module](../WORKSPACES_MODULE.md)
- [Projects UI](./PROJECTS_UI.md)
- [Routes](./ROUTES.md)
- [Overview](./OVERVIEW.md)