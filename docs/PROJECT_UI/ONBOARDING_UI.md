# LUME Onboarding UI

English | [Русский](../../docs-ru/PROJECT_UI/ONBOARDING_UI.ru.md) | [中文](../../docs-cn/PROJECT_UI/ONBOARDING_UI.cn.md)

**Last updated:** 2026-05-18

---

## Overview

The Onboarding UI guides new users through a 4-step wizard to set up their profile, skills, goals, and workspace preferences.

---

## Route

**Path:** `/onboarding`

**Component:** `src/pages/onboarding/OnboardingPage.tsx`

**Layout:** MainLayout (authenticated)

**Access:** Protected route (requires authentication)

---

## User Flow

```
Step 1: Profile → Step 2: Skills → Step 3: Goals → Step 4: Workspace → Complete → Redirect to /feed
```

---

## Step 1: Profile Setup

### Purpose
Identify user's primary role in the developer ecosystem.

### UI Elements
- **Title:** "What's your primary role?"
- **Role selector:** Grid of role cards
- **Navigation:** Next button (disabled until selection)

### Role Options
- Developer
- Frontend Developer
- Backend Developer
- Fullstack Developer
- UI/UX Designer
- Telegram Bot Developer
- Game Developer
- Founder
- Student
- Open Source Contributor
- Other

### Interaction
1. User clicks a role card
2. Card highlights with accent color
3. Next button becomes enabled
4. Click Next → proceeds to Step 2

---

## Step 2: Skills Selection

### Purpose
Capture user's technical skills and expertise.

### UI Elements
- **Title:** "What are your skills?"
- **Skill categories:** Expandable sections
- **Skill tags:** Multi-select chips
- **Selected skills:** Display area showing chosen skills
- **Navigation:** Back button, Next button

### Skill Categories
- **Frontend:** React, Next.js, Vue, Tailwind, TypeScript
- **Backend:** Node.js, Python, FastAPI, Django, NestJS, Express
- **Bots:** Aiogram, Telethon, Telegraf, Telegram Mini Apps
- **Database:** PostgreSQL, SQLite, MongoDB, Redis
- **Design:** Figma, UI Design, UX Design, Branding
- **Other:** Electron, C#, WPF, Unity, Godot, Rust, Go

### Interaction
1. User clicks skill chips to select/deselect
2. Selected skills appear in summary area
3. Can select multiple skills across categories
4. Click Next → proceeds to Step 3

---

## Step 3: Goals Definition

### Purpose
Understand what the user wants to achieve on the platform.

### UI Elements
- **Title:** "What are your goals?"
- **Goal cards:** Multi-select cards with icons
- **Navigation:** Back button, Next button

### Goal Options
- Find a team
- Find a project
- Show my project
- Find a developer
- Talk with indie developers
- Build my team
- Create open-source project
- Find freelance/work
- Just browse projects

### Interaction
1. User clicks goal cards to select/deselect
2. Selected cards highlight with accent color
3. Can select multiple goals
4. Click Next → proceeds to Step 4

---

## Step 4: Workspace Setup

### Purpose
Connect user to a workspace or allow them to create one.

### UI Elements
- **Title:** "Join or create a workspace"
- **Three options:**
  1. **Create New Workspace**
     - Name input
     - Slug input (auto-generated from name)
     - Description textarea
     - Type selector (Public/Private)
     - Focus tags input
  2. **Join Existing Workspace**
     - Invite code input
     - Join button
  3. **Skip for Now**
     - Skip button

### Create Workspace Form
- **Name:** Required, 3-50 characters
- **Slug:** Auto-generated, editable, 3-30 characters
- **Description:** Optional, max 500 characters
- **Type:** Public or Private radio buttons
- **Focus Tags:** Comma-separated tags

### Join Workspace Form
- **Invite Code:** Required, alphanumeric code
- **Validation:** Real-time check if code is valid

### Interaction
1. User chooses one of three options
2. If Create: fills form and clicks Create
3. If Join: enters code and clicks Join
4. If Skip: clicks Skip
5. On success → proceeds to completion

---

## Completion

### Actions
1. Mark onboarding as completed in database
2. Clear localStorage draft
3. Show success message
4. Redirect to `/feed`

### Success Message
- Toast notification: "Welcome to LUME! Your profile is set up."

---

## Draft Persistence

### LocalStorage Key
`lume_onboarding_draft_v1`

### Stored Data
```json
{
  "step": 2,
  "primaryRole": "Frontend Developer",
  "skills": ["React", "TypeScript"],
  "goals": ["Find a team"],
  "workspace": {
    "name": "My Team",
    "slug": "my-team",
    "description": "",
    "type": "private",
    "focusTags": ""
  }
}
```

### Behavior
- Saved on every step change
- Restored on page load
- Cleared on completion or manual clear

---

## Animations

### Page Transitions
- **Enter:** Slide in from right with fade
- **Exit:** Slide out to left with fade
- **Duration:** 300ms
- **Easing:** ease-in-out

### Step Indicator
- Progress bar showing current step (1/4, 2/4, etc.)
- Animated width transition

---

## Responsive Design

### Desktop (≥1024px)
- Centered card layout
- Max width: 800px
- Two-column grid for role/goal cards

### Tablet (768px - 1023px)
- Full-width card
- Single-column grid

### Mobile (<768px)
- Full-screen layout
- Stacked elements
- Larger touch targets

---

## Error Handling

### Validation Errors
- Inline error messages below inputs
- Red border on invalid fields
- Prevent progression until fixed

### API Errors
- Toast notification with error message
- Retry button
- Form remains filled for retry

### Network Errors
- "Connection lost" message
- Auto-retry on reconnection
- Draft saved for recovery

---

## Accessibility

### Keyboard Navigation
- Tab through all interactive elements
- Enter to select/submit
- Escape to go back

### Screen Readers
- ARIA labels on all inputs
- Role announcements
- Progress announcements

### Focus Management
- Visible focus indicators
- Focus trap within modal
- Auto-focus on first input

---

## Components Used

### UI Components
- `CustomSelect` - Dropdown selectors
- `Textarea` - Multi-line text input
- `Button` - Primary/secondary actions
- `Card` - Container for steps
- `Badge` - Skill/tag chips
- `Input` - Text inputs

### Utilities
- `slugify()` - Convert name to URL-safe slug
- `toast` - Notification system
- `AnimatePresence` - Framer Motion animations

---

## API Integration

### Endpoints Used
- `GET /onboarding/status` - Check completion status
- `POST /onboarding/profile` - Save role
- `POST /onboarding/skills` - Save skills
- `POST /onboarding/goals` - Save goals
- `POST /onboarding/workspace` - Create/join workspace
- `POST /onboarding/complete` - Mark as completed

---

## Related Documents

- [Onboarding Module](../ONBOARDING_MODULE.md)
- [Workspaces UI](./WORKSPACES_UI.md)
- [Routes](./ROUTES.md)
- [Overview](./OVERVIEW.md)