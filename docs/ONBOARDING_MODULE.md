# LUME Onboarding Module

English | [Русский](../docs-ru/ONBOARDING_MODULE.ru.md) | [中文](../docs-cn/ONBOARDING_MODULE.cn.md)

**Last updated:** 2026-05-18  
**Status:** ✅ Implemented

---

## Overview

The Onboarding Module guides new users through a 4-step process to set up their profile, skills, goals, and workspace preferences. This ensures users have a complete profile and are connected to the right communities from day one.

---

## Architecture

### Backend

**Files:**
- `backend/src/routes/onboardingRoutes.js` - API routes
- `backend/src/services/onboardingService.js` - Business logic
- `backend/src/validators/onboardingSchemas.js` - Validation schemas

**Database:**
- User profile fields: `primary_role`, `skills`, `goals`, `onboarding_completed`

### Frontend

**Files:**
- `src/pages/onboarding/OnboardingPage.tsx` - Main onboarding UI
- `src/services/api.ts` - API client methods

---

## Onboarding Flow

### Step 1: Profile Setup
**Purpose:** Identify user's primary role

**Options:**
- Developer (Frontend, Backend, Fullstack)
- UI/UX Designer
- Telegram Bot Developer
- Game Developer
- Founder
- Student
- Open Source Contributor
- Other

**Data stored:** `primary_role`

### Step 2: Skills Selection
**Purpose:** Capture technical skills

**Categories:**
- **Frontend:** React, Next.js, Vue, Tailwind, TypeScript
- **Backend:** Node.js, Python, FastAPI, Django, NestJS, Express
- **Bots:** Aiogram, Telethon, Telegraf, Telegram Mini Apps
- **Database:** PostgreSQL, SQLite, MongoDB, Redis
- **Design:** Figma, UI Design, UX Design, Branding
- **Other:** Electron, C#, WPF, Unity, Godot, Rust, Go

**Data stored:** `skills` (array)

### Step 3: Goals Definition
**Purpose:** Understand user intentions

**Options:**
- Find a team
- Find a project
- Show my project
- Find a developer
- Talk with indie developers
- Build my team
- Create open-source project
- Find freelance/work
- Just browse projects

**Data stored:** `goals` (array)

### Step 4: Workspace Setup
**Purpose:** Connect user to a workspace

**Actions:**
- **Create new workspace:** User becomes owner
- **Join existing workspace:** Via invite code
- **Skip:** Continue without workspace

**Data stored:** Workspace membership (if created/joined)

---

## API Endpoints

### GET `/onboarding/status`
Get user's onboarding status.

**Response 200:**
```json
{
  "onboarding": {
    "completed": false,
    "primary_role": "Developer",
    "skills": ["React", "Node.js"],
    "goals": ["Find a team"]
  }
}
```

### POST `/onboarding/profile`
Save profile step (role).

**Body:**
```json
{
  "primaryRole": "Frontend Developer"
}
```

**Response 200:**
```json
{
  "user": {
    "id": "1",
    "primary_role": "Frontend Developer"
  }
}
```

### POST `/onboarding/skills`
Save skills step.

**Body:**
```json
{
  "skills": ["React", "TypeScript", "Node.js"]
}
```

**Response 200:**
```json
{
  "user": {
    "id": "1",
    "skills": ["React", "TypeScript", "Node.js"]
  }
}
```

### POST `/onboarding/goals`
Save goals step.

**Body:**
```json
{
  "goals": ["Find a team", "Show my project"]
}
```

**Response 200:**
```json
{
  "user": {
    "id": "1",
    "goals": ["Find a team", "Show my project"]
  }
}
```

### POST `/onboarding/workspace`
Handle workspace creation or joining.

**Body (Create):**
```json
{
  "action": "create",
  "workspace": {
    "name": "My Team",
    "slug": "my-team",
    "description": "Building awesome projects",
    "type": "public",
    "focus": ["Web Development", "Open Source"]
  }
}
```

**Body (Join):**
```json
{
  "action": "join",
  "inviteCode": "ABC123"
}
```

**Body (Skip):**
```json
{
  "action": "skip"
}
```

**Response 201 (Create):**
```json
{
  "workspace": {
    "id": "1",
    "name": "My Team",
    "slug": "my-team",
    "owner_id": "1"
  }
}
```

### POST `/onboarding/complete`
Mark onboarding as completed.

**Response 200:**
```json
{
  "onboarding": {
    "completed": true
  }
}
```

---

## Validation Rules

### Profile Step
- `primaryRole`: required, string, one of predefined roles

### Skills Step
- `skills`: optional, array of strings, max 20 skills

### Goals Step
- `goals`: optional, array of strings, max 10 goals

### Workspace Step
- `action`: required, one of: "create", "join", "skip"
- `workspace.name`: required if action=create, 3-50 chars
- `workspace.slug`: required if action=create, 3-30 chars, alphanumeric + hyphens
- `inviteCode`: required if action=join

---

## User Experience

### Draft Persistence
- Form data saved to localStorage (`lume_onboarding_draft_v1`)
- Restored on page reload
- Cleared on completion

### Navigation
- Linear flow: Step 1 → 2 → 3 → 4
- Back button available (except Step 1)
- Skip button on Step 4 only

### Completion
- Redirects to `/feed` on completion
- Sets `onboarding_completed = true` in database
- Clears localStorage draft

---

## Related Documents

- [Workspaces Module](./WORKSPACES_MODULE.md)
- [Projects Module](./PROJECTS_MODULE.md)
- [Features Inventory](./FEATURES_INVENTORY.md)
- [Onboarding UI](./PROJECT_UI/ONBOARDING_UI.md)
- [README](../README.md)