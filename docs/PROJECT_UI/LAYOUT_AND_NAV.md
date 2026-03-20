# LUME Layout and Navigation

English | [Русский](../../docs-ru/PROJECT_UI/LAYOUT_AND_NAV.ru.md) | [中文](../../docs-cn/PROJECT_UI/LAYOUT_AND_NAV.cn.md)

**Last updated:** 2026-03-19

---

## SidebarLeft

**File:** `src/components/layout/SidebarLeft.tsx`

### Structure

- Logo and branding
- Navigation list
- User popover (settings/logout)

### Navigation items

**Authenticated:**
- Home, Explore, Messages, Profile, Verified

**Guest:**
- Home, Explore, Login, Register

### Active state

- Active: `bg-white/10 text-white`
- Inactive: `text-secondary hover:text-white`
- Animated background using `layoutId="nav-active"`

---

## SidebarRight

**File:** `src/components/layout/SidebarRight.tsx`

Hidden on:
- `/messages`
- `/messages/:chatId`

Visible on:
- `/feed`, `/explore`, `/profile`

---

## Main content container

**File:** `src/layouts/MainLayout.tsx`

- Padding: `px-9`
- Width: `max-w-[640px]` with right sidebar, `max-w-none` without
- Scroll: `overflow-y-auto`

---

## AppLayout

**File:** `src/components/layout/AppLayout.tsx`

- Global container and grid setup
- WebSocket connects for authenticated users

---

## LandingLayout

**File:** `src/layouts/LandingLayout.tsx`

- Fixed header
- Public content section
- Footer with navigation links

---

## Navigation utilities

**NavLink component:** `src/components/NavLink.tsx`

**Home button behavior:**

- If already on `/feed`, scroll to top and refresh
- Otherwise navigate to `/feed` and scroll to top

---

## Related documents

- [Overview](./OVERVIEW.md)
- [Routes](./ROUTES.md)
- [Style System](./STYLE_SYSTEM.md)
