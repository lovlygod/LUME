# LUME Feed UI

English | [Русский](../../docs-ru/PROJECT_UI/FEED_UI.ru.md) | [中文](../../docs-cn/PROJECT_UI/FEED_UI.cn.md)

**Last updated:** 2026-03-11

---

## Overview

The Feed is the main timeline where users read and create posts.

**Files:**
- Page: `src/pages/Index.tsx`
- Components: `src/components/feed/`, `src/components/post/`
- Hooks: `src/hooks/`

---

## Page structure

```
Feed Header
Post Composer
Posts Feed
```

---

## Feed header

**File:** `src/components/feed/FeedHeader.tsx`

- Tab selector: For You / Following
- Refresh button
- New posts indicator

---

## Post composer

**File:** `src/components/feed/PostComposer.tsx`

- Text input
- Image upload with preview
- Actions: image, emoji, poll
- Post button with character count

---

## Post component

**File:** `src/components/post/Post.tsx`

- Header: author, username, time, menu
- Content: text, image, link preview
- Actions: reply, repost, resonance, share

---

## States

| State | Behavior |
|------|----------|
| Loading | Skeleton cards |
| Empty | “No posts yet” placeholder |
| Error | Retry button |

---

## Hooks

- `usePosts` (recommended/following)
- `useCreatePost`
- `useResonance`

---

## WebSocket events

- `new_post` → increment `newPostsCount`
- `post_resonance_updated` → update counts in cache
- `new_comment` → update comments cache

---

## Image viewer

**File:** `src/components/media/ImageViewer.tsx`

Used for full-screen preview of post images.

---

## Related documents

- [Overview](./OVERVIEW.md)
- [Style System](./STYLE_SYSTEM.md)
- [Profile UI](./PROFILE_UI.md)
