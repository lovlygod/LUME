# LUME Project UI Overview

English | [Русский](./OVERVIEW.ru.md)

**Last updated:** 2026-03-11

---

## App map

```
LUME
├── Landing (public)
│   ├── /                 — LandingPage
│   ├── /faq              — FAQ
│   ├── /rules            — Rules
│   ├── /support          — Support
│   ├── /status           — Status
│   └── /contacts         — Contacts
├── App (authenticated)
│   ├── /feed             — Feed
│   ├── /explore          — Explore
│   ├── /messages         — Messenger
│   │   └── /messages/:chatId
│   ├── /messages?userId=... — Open chat via query param
│   ├── /servers          — Servers catalog
│   ├── /server/:identifier
│   │   ├── /channel/:channelName
│   │   ├── /settings
│   │   └── /members
│   ├── /profile          — My profile
│   ├── /profile/:userId  — User profile
│   ├── /verified         — Verification
│   ├── /settings         — Account settings
│   ├── /admin            — Admin panel
│   └── /settings/sessions
│   └── /verified          — Verification flow
└── System
    └── *                 — 404 Not Found
```

---

## Layouts

### LandingLayout

- Used for public pages.
- Header + content + footer, no sidebars.

### AppLayout

- Primary authenticated layout.
- Left navigation + main content + right sidebar.

---

## Navigation flow

```
Landing → Login → Feed
Feed → Explore / Messages / Servers / Profile / Settings / Admin
Servers → Server → Channel / Members / Settings
```

---

## Page list

| Page | File | Layout |
|------|------|--------|
| Feed | `src/pages/Index.tsx` | AppLayout |
| Explore | `src/pages/Explore.tsx` | AppLayout |
| Messages | `src/pages/Messages.tsx` | AppLayout |
| Servers | `src/pages/ServersPage.tsx` | AppLayout |
| Server | `src/pages/ServerPage.tsx` | AppLayout |
| Server Settings | `src/pages/ServerSettingsPage.tsx` | AppLayout |
| Server Members | `src/pages/ServerMembersPage.tsx` | AppLayout |
| Profile | `src/pages/Profile.tsx` | AppLayout |
| User Profile | `src/pages/UserProfile.tsx` | AppLayout |
| Verified | `src/pages/Verified.tsx` | AppLayout |
| Settings | `src/pages/Settings.tsx` | AppLayout |
| Sessions | `src/pages/settings/SessionsPage.tsx` | AppLayout |
| Admin | `src/pages/AdminPanel.tsx` | AppLayout |
| Login | `src/pages/auth/Login.tsx` | AppLayout |
| Register | `src/pages/auth/Register.tsx` | AppLayout |
| Privacy Policy | `src/pages/PrivacyPolicy.tsx` | AppLayout |
| Terms of Service | `src/pages/TermsOfService.tsx` | AppLayout |
| Cookie Policy | `src/pages/CookiePolicy.tsx` | AppLayout |
| Landing | `src/pages/LandingPage.tsx` | LandingLayout |
| FAQ | `src/pages/FAQPage.tsx` | LandingLayout |
| Rules | `src/pages/RulesPage.tsx` | LandingLayout |
| Support | `src/pages/SupportPage.tsx` | LandingLayout |
| Status | `src/pages/StatusPage.tsx` | LandingLayout |
| Contacts | `src/pages/ContactsPage.tsx` | LandingLayout |
| 404 | `src/pages/NotFound.tsx` | AppLayout |

---

## Related documents

- [Routes](./ROUTES.md)
- [Layout and Navigation](./LAYOUT_AND_NAV.md)
- [Style System](./STYLE_SYSTEM.md)
- [Features Inventory](../FEATURES_INVENTORY.md)
