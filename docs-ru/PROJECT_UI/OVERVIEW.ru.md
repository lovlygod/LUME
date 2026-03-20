# Обзор UI LUME

[English](../../docs/PROJECT_UI/OVERVIEW.md) | Русский | [中文](../../docs-cn/PROJECT_UI/OVERVIEW.cn.md)

**Последнее обновление:** 2026-03-19

---

## Карта приложения

```
LUME
├── Landing (public)
│   ├── /
│   ├── /faq
│   ├── /rules
│   ├── /support
│   ├── /status
│   └── /contacts
├── App (auth)
│   ├── /feed
│   ├── /explore
│   ├── /messages
│   ├── /messages?userId=... — открытие чата по query param
│   ├── /profile
│   ├── /verified
│   ├── /settings
│   └── /settings/sessions
└── System
    └── * (404)
```

---

## Layouts

- **LandingLayout** — публичные страницы
- **AppLayout** — основное приложение

---

## Навигация

```
Landing → Login → Feed
Feed → Explore / Messages / Profile / Settings / Admin
Messages → Chat list → Chat panel
```

---

## Связанные документы

- [Routes](./ROUTES.ru.md)
- [Layout and Navigation](./LAYOUT_AND_NAV.ru.md)
- [Style System](./STYLE_SYSTEM.ru.md)
