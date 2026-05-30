# LUME — Full-featured social network with messenger

English | [Русский](./README.ru.md) | [中文](./README.cn.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-latest-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

**LUME** is a modern social network with messenger features built on Node.js + React. The project includes a feed, direct messaging, user verification, admin panel, content moderation, and **group/channel chats** inside Messages.

---

## 📋 Table of Contents

- [Project overview](#project-overview)
- [Tech stack](#tech-stack)
- [Project architecture](#project-architecture)
- [Key features](#key-features)
- [Security](#security)
- [Permissions](#permissions)
- [Audit and Logging](#audit-and-logging)
- [Database schema](#database-schema)
- [API documentation](#api-documentation)
- [WebSocket events](#websocket-events)
- [Troubleshooting runbook](#troubleshooting-runbook)
- [Installation and launch](#installation-and-launch)
- [Configuration](#configuration)
- [License](#license)

---

## 📖 Project overview

### Highlights
- 🔄 **Real-time feed** with WebSocket updates
- 💬 **Messenger** for 1:1 private chats
- 👥 **Groups & Channels** managed as chat types (`group`, `channel`)
- 👤 **User profiles** with avatars and banners
- ✅ **Verification system** via TikTok video
- 🛡️ **Content moderation** with reports
- 📑 **Admin panel** for user/content management
- ⚡ **Real-time notifications** via WebSocket
- 🔒 **Security**: httpOnly cookies, rate limiting, CSP headers
- 🌐 **i18n**: Russian, English, Chinese, Spanish, Portuguese (Brazil) UI

---

## 🛠️ Tech stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI library |
| TypeScript | 5.8.3 | Type safety |
| React Router | 6.30.1 | Routing |
| Framer Motion | 12.34.0 | Animations |
| Tailwind CSS | 3.4.17 | Styling |
| Radix UI | various | UI primitives |
| shadcn/ui | latest | UI components |
| TanStack Query | 5.90.21 | Server state management |
| Emoji Picker React | 4.18.0 | Emoji picker |
| Sonner | 1.7.4 | Toast notifications |
| Zod | 3.25.76 | Schema validation |
| React Hook Form | 7.61.1 | Form handling |
| Lucide React | 0.462.0 | Icons |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | latest | Runtime |
| Express | 4.18.2 | Web framework |
| PostgreSQL | 16+ | Database |
| WebSocket (ws) | 8.19.0 | Real-time communication |
| JWT (jsonwebtoken) | 9.0.2 | Authentication |
| Bcryptjs | 2.4.3 | Password hashing |
| Multer | 1.4.5-lts.1 | File uploads |
| Cors | 2.8.5 | CORS middleware |
| **Zod** | 4.3.6 | Data validation |
| **Cookie-parser** | 1.4.7 | Cookie handling |

---

## 🏗️ Project architecture

```
LUME/
├── Frontend (Vite + React + TypeScript)
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── groups/     # (legacy) Group components
│   │   │   ├── feed/       # Feed components
│   │   │   ├── post/       # Post components
│   │   │   ├── chat/       # Chat components
│   │   │   ├── media/      # Media components
│   │   │   ├── profile/    # Profile components
│   │   │   ├── verification/ # Verification components
│   │   │   ├── help/       # Help shell
│   │   │   └── layout/     # Layout components
│   │   ├── pages/          # App pages
│   │   │   ├── auth/       # Auth pages
│   │   │   ├── messages/   # Messages pages
│   │   │   ├── group/      # (legacy) Group pages
│   │   │   ├── onboarding/ # Onboarding flow
│   │   │   ├── projects/   # Projects pages
│   │   │   ├── workspaces/ # Workspaces pages
│   │   │   └── stickers/   # Sticker pages
│   │   ├── services/       # API client, errorHandler, websocket, e2ee
│   │   ├── contexts/       # React contexts (Auth, Language, Theme, Server)
│   │   ├── hooks/          # Custom hooks (React Query)
│   │   ├── i18n/           # Localization
│   │   ├── lib/            # Utilities (queryClient, config, utils)
│   │   ├── types/          # TypeScript types
│   │   └── test/           # Tests
│   └── public/             # Static assets
│
└── Backend (Express + PostgreSQL)
    ├── src/
    │   ├── server.js         # Entry point + WebSocket server
    │   ├── api.js            # API routes
    │   ├── auth.js           # Authentication
    │   ├── profile.js        # User profile
    │   ├── uploads.js        # File uploads (Cloudinary)
    │   ├── validation.js     # Zod validation
    │   ├── permissions.js    # Access control
    │   ├── rateLimiter.js    # Rate limiting middleware
    │   ├── errors.js         # Error handling
    │   ├── logger.js         # Logging
    │   ├── audit.js          # Audit logging
    │   ├── csrf.js           # CSRF protection
    │   ├── linkPreview.js    # Open Graph preview
    │   ├── serializers.js    # Data serialization
    │   ├── db.js             # PostgreSQL database
    │   ├── routes/
    │   ├── services/
    │   ├── validators/
    │   ├── search/
    │   └── middleware/
    ├── database/
    │   ├── schema.sql
    │   └── migrations/
    └── package.json
```

---

## ⚙️ Key features

### 1. Groups & Channels (Chats)
- Chat types: `group`, `channel`, `private`
- Create group/channel chats
- Join requests (public channels)
- Member management with roles
- Real-time chat messages
- File uploads in chat messages

### 2. Feed
- Chronological feed
- Post creation (up to 420 chars) with images
- “Resonance” reactions
- Emoji comments
- Reposts
- WebSocket real-time updates
- Pinned posts in profile

### 3. Messenger
- 1:1 private messages
- Chat list with last message
- Unread counters
- Real-time delivery via WebSocket
- Delete messages (for me / for all)
- File and image attachments
- Read receipts
- Voice messages
- Media

### 4. User profiles
- View other profiles
- Edit own profile
- Avatars and banners
- Counters: followers, following, posts
- Follow system
- Pinned post

### 5. Verification system
1. Submit request (registration ≥7 days)
2. Admin review
3. Approved for 1 month with badge

Badges: Verified, Developer, CEO

### 6. Onboarding
1. New users are guided through a 4-step onboarding flow
2. Choose primary role (Developer, Designer, etc.)
3. Select skills (React, Node.js, PostgreSQL, etc.)
4. Set goals (Find a team, Show my project, etc.)
5. Create or join a workspace

Stored fields: `primary_role`, `skills`, `goals`, `onboarding_completed`

### 7. Workspaces & Projects
- Public/private workspaces
- Invite members via codes
- Roles: owner, admin, lead, developer, designer, member, guest
- Projects inside workspaces
- Kanban-style tasks (`todo`, `in_progress`, `review`, `done`)
- Role-based permissions and collaboration

---

## 🛡️ Security

- **httpOnly Cookies**: tokens are not accessible via JavaScript
- **Rate Limiting**: brute-force protection
- **CSP headers**: XSS protection
- **Zod validation**: strict data validation
- **Centralized error handling**: unified API error format
- **Permission checks**: role-based access control
- **E2E Encryption**: optional end-to-end encrypted messaging

---

## 👥 Permissions

### Chat roles
- **Owner (100)**: full access, delete chat, transfer ownership
- **Admin (80)**: manage members and settings
- **Member (10)**: read and send

### Workspace roles
- **Owner**: full control, delete workspace, manage invites
- **Admin**: manage members and content
- **Lead**: manage projects and tasks
- **Developer/Designer/Guest**: limited access

Rules:
- Cannot manage users with equal or higher rank
- Owner cannot be kicked/demoted

---

## 📊 Audit and Logging

Audited events:
- Logins/logouts
- Deleting posts/messages/chats
- Member role changes
- Kick/ban actions
- Verification requests
- Admin actions

Storage:
- `audit_logs` table
- Auto-cleanup after 90 days
- IP, User Agent, details payload

---

## 🗄️ Database schema

### Core tables
- `users`
- `posts`
- `chats`
- `messages`
- `media`
- `chat_members`
- `chat_roles`
- `chat_join_requests`
- `rate_limits`
- `audit_logs`

---

## 📡 API documentation

Full API docs: [backend/API.md](./backend/API.md)

Base URL:
```
http://150.241.85.189:5000/api
```

### Core endpoints

#### Auth
- `POST /register` — Register
- `POST /login` — Login
- `POST /refresh` — Refresh token
- `POST /logout` — Logout

#### Profile
- `GET /profile` — My profile
- `GET /profile/:userId` — User profile
- `PUT /profile` — Update profile
- `POST /profile/avatar` — Upload avatar
- `POST /profile/banner` — Upload banner
- `DELETE /profile` — Delete account

#### Posts
- `GET /posts` — Feed
- `GET /posts/recommended` — Recommended
- `GET /posts/following` — Following
- `POST /posts` — Create post
- `DELETE /posts/:postId` — Delete post
- `POST /posts/:postId/resonance` — Like

#### Chats
- `GET /chats` — Chat list
- `POST /chats` — Create chat
- `PUT /chats/:chatId` — Update chat
- `POST /chats/:chatId/members` — Add member
- `DELETE /chats/:chatId/members/:userId` — Remove member
- `GET /chats/public?query=...` — Public channels
- `POST /chats/:chatId/subscribe` — Join public channel
- `GET /chats/:chatId/join-requests` — Join requests
- `POST /chats/:chatId/join-requests/:requestId/review` — Approve/reject

#### Messages
- `GET /messages?chatId=...` — Chat history
- `POST /messages` — Send message
- `DELETE /messages/:messageId` — Delete message

#### Onboarding
- `GET /onboarding/status` — Get onboarding status
- `POST /onboarding/profile` — Save profile step
- `POST /onboarding/skills` — Save skills step
- `POST /onboarding/goals` — Save goals step
- `POST /onboarding/workspace` — Save workspace step
- `POST /onboarding/complete` — Complete onboarding

#### Workspaces
- `POST /workspaces` — Create workspace
- `GET /workspaces/my` — My workspaces
- `GET /workspaces/public` — Public workspaces
- `GET /workspaces/:slug` — Workspace by slug
- `PATCH /workspaces/:id` — Update workspace
- `DELETE /workspaces/:id` — Delete workspace
- `POST /workspaces/:id/members` — Add member
- `PATCH /workspaces/:id/members/:userId` — Update member role
- `DELETE /workspaces/:id/members/:userId` — Remove member
- `POST /workspaces/:id/invites` — Create invite
- `POST /workspaces/join/:inviteCode` — Join via invite
- `GET /workspaces/:id/members` — List members

#### Projects
- `POST /projects` — Create project
- `GET /projects/my` — My projects
- `GET /projects/public` — Public projects
- `GET /projects/:slug` — Project by slug
- `PATCH /projects/:id` — Update project
- `DELETE /projects/:id` — Delete project
- `POST /projects/:id/members` — Add member
- `DELETE /projects/:id/members/:userId` — Remove member
- `POST /projects/:id/invite` — Create invite
- `GET /projects/:id/members` — List members

#### Tasks
- `POST /projects/:projectId/tasks` — Create task
- `GET /projects/:projectId/tasks` — Project tasks
- `PATCH /tasks/:taskId` — Update task
- `DELETE /tasks/:taskId` — Delete task
- `POST /tasks/:taskId/comments` — Add comment

---

## 🔌 WebSocket events

Connection:
```
ws://150.241.85.189:5000/ws
```

**Client → Server**
- `register`
- `ping`
- `typing:start` / `typing:stop`
- `chat:read`
- `message:delivered`
- `chat:subscribe` / `chat:unsubscribe`

**Server → Client**
- `new_post`
- `new_message`
- `typing:update`
- `chat:read_update`
- `presence:update`
- `channel:new_message`
- `message:deleted`
- `notification_new`
- `session_terminated`

---

## 🛠️ Troubleshooting runbook

### Start commands
Frontend:
```bash
npm install
npm run dev
```

Backend:
```bash
cd backend
npm install
npm run dev
```

### Required environment variables
- Frontend: `VITE_API_URL`, `VITE_WS_URL`, `VITE_E2EE_ENABLED`, `VITE_E2EE_STRICT_MODE`
- Backend: `PORT`, `JWT_SECRET`, `DATABASE_URL`, `FRONTEND_URL`, `FRONTEND_URLS`

### Health checks
- `GET /health`
- `GET /api/status`

### WebSocket/API consistency
- Ensure frontend WS path is `/ws`
- Ensure same host/port and protocol (`ws://` / `wss://`)

---

## 🚀 Installation and launch

```bash
git clone <repository-url>
cd LUME
```

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
npm install
npm run dev
```

Access:
- Frontend: `http://localhost:8080`
- Backend API: `http://150.241.85.189:5000/api`

---

## ⚙️ Configuration

### Backend (`.env`)
```env
PORT=5000
JWT_SECRET=your-super-secret-key-change-in-production
NODE_ENV=development
LOG_LEVEL=info
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
E2EE_ENFORCE=false
```

---

## 📄 License

MIT License

---

## 👥 Authors

- **zxclovly** — Owner & Admin

---

## 📚 Additional documentation

- [Features Inventory](./docs/FEATURES_INVENTORY.md)
- [Error Handling](./docs/ERROR_HANDLING.md)
- [Groups Module](./docs/GROUPS_MODULE.md)
- [Project UI](./docs/PROJECT_UI/)
- [API Documentation](./backend/API.md)
- [Wallet E2EE Envelopes](./docs/WALLET_E2EE_ENVELOPES.md)
- [Economy Wallet Stack](./docs/ECONOMY_WALLET_STACK.md)

