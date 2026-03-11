# LUME Profile UI

English | [Русский](./PROFILE_UI.ru.md)

**Last updated:** 2026-03-11

---

## Overview

Profile pages show user identity, stats, and posts.

**Files:**
- My profile: `src/pages/Profile.tsx`
- User profile: `src/pages/UserProfile.tsx`
- Components: `src/components/profile/`

---

## Page structure

```
Banner
Avatar + User info
Stats + Action buttons
Tabs (Posts / Media / Likes)
Posts feed
```

---

## Header

- Banner image with fallback gradient
- Avatar with upload control (own profile)
- Name, username, bio, meta info

---

## Action buttons

**Own profile:** Settings, Edit Profile

**Other user:** Follow/Unfollow, Message

---

## Edit profile modal

**File:** `src/pages/Profile.tsx`

- Banner, name, bio, city, website

---

## Posts feed

- Tabs: Posts / Media / Likes
- Pinned post display
- Skeletons for loading

---

## Follow modal

**File:** `src/components/profile/FollowModal.tsx`

- Followers / Following lists
- Load more pagination

---

## Hooks

- `useProfile`
- `useUpdateProfile`
- `useFollow`
- `useUserPosts`

---

## Related documents

- [Overview](./OVERVIEW.md)
- [Style System](./STYLE_SYSTEM.md)
- [Feed UI](./FEED_UI.md)
