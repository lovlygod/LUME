# LUME 项目 UI 概览

中文 | [Русский](../../docs-ru/PROJECT_UI/OVERVIEW.ru.md) | [English](../../docs/PROJECT_UI/OVERVIEW.md)

**最后更新：** 2026-03-11

---

## 应用地图

```
LUME
├── Landing（公开）
│   ├── /                 — LandingPage
│   ├── /faq              — FAQ
│   ├── /rules            — Rules
│   ├── /support          — Support
│   ├── /status           — Status
│   └── /contacts         — Contacts
├── App（登录后）
│   ├── /feed             — Feed
│   ├── /explore          — Explore
│   ├── /messages         — Messenger
│   │   └── /messages/:chatId
│   ├── /messages?userId=... — 通过 query 参数打开聊天
│   ├── /servers          — 服务器目录
│   ├── /server/:identifier
│   │   ├── /channel/:channelName
│   │   ├── /settings
│   │   └── /members
│   ├── /profile          — 我的资料
│   ├── /profile/:userId  — 用户资料
│   ├── /verified         — 认证
│   ├── /settings         — 账号设置
│   ├── /admin            — 管理面板
│   ├── /settings/sessions
│   └── /verified          — 认证流程
└── System
    └── *                 — 404 Not Found
```

---

## 布局

### LandingLayout

- 用于公开页面。
- Header + 内容 + Footer，无侧边栏。

### AppLayout

- 登录后的主布局。
- 左侧导航 + 主内容 + 右侧栏。

---

## 导航流程

```
Landing → Login → Feed
Feed → Explore / Messages / Servers / Profile / Settings / Admin
Servers → Server → Channel / Members / Settings
```

---

## 页面列表

| 页面 | 文件 | 布局 |
|------|------|------|
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

## 相关文档

- [Routes](./ROUTES.cn.md)
- [Layout and Navigation](./LAYOUT_AND_NAV.cn.md)
- [Style System](./STYLE_SYSTEM.cn.md)
- [Features Inventory](../FEATURES_INVENTORY.cn.md)
