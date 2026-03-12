# Layout и навигация LUME

[English](../../docs/PROJECT_UI/LAYOUT_AND_NAV.md) | Русский | [中文](../../docs-cn/PROJECT_UI/LAYOUT_AND_NAV.cn.md)

**Последнее обновление:** 2026-03-11

---

## SidebarLeft

**Файл:** `src/components/layout/SidebarLeft.tsx`

- Логотип
- Навигация
- Popover пользователя

---

## SidebarRight

**Файл:** `src/components/layout/SidebarRight.tsx`

Скрывается на `/messages` и `/messages/:chatId`.

---

## Main container

**Файл:** `src/layouts/MainLayout.tsx`

- `px-9`
- `max-w-[640px]` c правым сайдбаром
- `max-w-none` без сайдбара

---

## AppLayout / LandingLayout

- `src/components/layout/AppLayout.tsx`
- `src/layouts/LandingLayout.tsx`

---

## Связанные документы

- [Overview](./OVERVIEW.ru.md)
- [Routes](./ROUTES.ru.md)
- [Style System](./STYLE_SYSTEM.ru.md)
