# Обзор UI LUME

[English](./OVERVIEW.md) | Русский

**Последнее обновление:** 2026-03-11

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
│   ├── /servers
│   ├── /server/:identifier
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

## Связанные документы

- [Routes](./ROUTES.ru.md)
- [Layout and Navigation](./LAYOUT_AND_NAV.ru.md)
- [Style System](./STYLE_SYSTEM.ru.md)
