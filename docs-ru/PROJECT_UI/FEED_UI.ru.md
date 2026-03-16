# UI ленты (LUME)

[English](../../docs/PROJECT_UI/FEED_UI.md) | Русский | [中文](../../docs-cn/PROJECT_UI/FEED_UI.cn.md)

**Последнее обновление:** 2026-03-16

---

## Обзор

Лента — главная страница с постами.

**Файлы:**
- `src/pages/Index.tsx`
- `src/components/feed/`
- `src/components/post/`

---

## Основные блоки

- Header (фильтр, refresh)
- Composer (создание поста)
- Лента постов

---

## Хуки

- `usePosts`
- `useCreatePost`
- `useResonance`

---

## WebSocket события

- `new_post`
- `post_resonance_updated`
- `new_comment`

---

## Deep links (уведомления)

Лента поддерживает query-параметры для переходов из уведомлений с автопрокруткой и подсветкой поста:

- `/feed?post={postId}` → скролл к посту + короткая подсветка.
- `/feed?post={postId}&comment={commentId}` → то же поведение для комментариев.

**Реализация:** `src/pages/Index.tsx` (парсинг query + scroll/highlight).

---

## Связанные документы

- [Overview](./OVERVIEW.ru.md)
- [Style System](./STYLE_SYSTEM.ru.md)
- [Profile UI](./PROFILE_UI.ru.md)
