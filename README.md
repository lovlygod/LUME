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
- [Database schema](#database-schema)
- [API documentation](#api-documentation)
- [WebSocket events](#websocket-events)
- [Security](#security)
- [Installation and launch](#installation-and-launch)
- [Configuration](#configuration)
- [Stabilized architecture map](#stabilized-architecture-map)
- [Troubleshooting runbook](#troubleshooting-runbook)
- [License](#license)

---

## 📖 Project overview

### Highlights:
- 🔄 **Real-time feed** with WebSocket updates
- 💬 **Messenger** for 1:1 private chats
- 👥 **Groups & Channels** managed as chat types (`group`, `channel`)
- 👤 **User profiles** with avatars and banners
- ✅ **Verification system** via TikTok video
- 🛡️ **Content moderation** with reports
- 👑 **Admin panel** for user/content management
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
     │   ├── api.js            # API routes (Auth, Posts, Chats, Messages, Profile)
     │   ├── auth.js           # Authentication (JWT, refresh tokens, cookies)
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
     │   │   ├── chatRoutes.js       # Chats (groups/channels)
     │   │   ├── socialRoutes.js     # Social (posts, comments, likes, follows, reports)
     │   │   ├── e2eeRoutes.js       # End-to-end encryption
     │   │   ├── stickerRoutes.js    # Stickers
     │   │   ├── messengerRoutes.js  # Messenger (chats list, notifications, read status, reactions)
     │   │   ├── exploreRoutes.js    # Explore (builders, projects, workspaces)
     │   │   ├── onboardingRoutes.js # Onboarding flow
     │   │   ├── projectRoutes.js    # Projects CRUD
     │   │   ├── workspaceRoutes.js  # Workspaces CRUD
     │   │   └── taskRoutes.js       # Tasks within projects
     │   ├── services/
     │   │   ├── exploreService.js   # Explore search services
     │   │   ├── onboardingService.js # Onboarding steps
     │   │   ├── projectService.js   # Project operations
     │   │   ├── taskService.js      # Task operations
     │   │   └── workspaceService.js  # Workspace operations
     │   ├── validators/
     │   │   ├── onboardingSchemas.js # Onboarding validation
     │   │   ├── projectSchemas.js    # Project validation
     │   │   ├── taskSchemas.js       # Task validation
     │   │   └── workspaceSchemas.js  # Workspace validation
     │   ├── search/
     │   │   └── messagesSearch.js    # Full-text search (Meilisearch)
     │   └── middleware/
     │       └── sanitize.js          # Input sanitization
     │
     ├── database/
     │   ├── schema.sql                            # Base schema
     │   ├── migrate.js                             # Core migrations
     │   ├── migrate-rate-limit.js                  # Rate limiting migration
     │   ├── migrate-communities.js                 # Groups migration
     │   ├── migrate-audit.js                       # Audit migration
     │   └── 013_workspace_builder_core.sql         # Workspaces/projects/tasks migration
     ├── scripts/
     │   ├── db-init.js               # Database initialization
     │   └── stickers-sync.js         # Sticker sync helper
     └── package.json
```

---

## ⚙️ Key features

### 1. Groups & Channels (Chats)

**Features:**
- Chat types: `group`, `channel`, `private`
- Create group/channel chats
- Join requests (public channels)
- Member management with roles
- Real-time chat messages
- File uploads in chat messages

**URL navigation:**
- `/messages`
- `/messages/:chatId`

### 2. Feed

**Features:**
- Chronological feed
- Post creation (up to 420 chars) with images
- “Resonance” reactions
- Emoji comments
- Reposts
- WebSocket real-time updates
- Pinned posts in profile

### 3. Messenger

**Features:**
- 1:1 private messages
- Chat list with last message
- Unread counters
- Real-time delivery via WebSocket
- Delete messages (for me / for all)
- File and image attachments
- Read receipts
- Voice messages
- Ephemeral moments

### 4. User profiles

**Features:**
- View other profiles
- Edit own profile
- Avatars and banners
- Counters: followers, following, posts
- Follow system
- Pinned post

### 5. Verification system

**Process:**
1. Submit request (registration ≥7 days)
2. Admin review
3. Approved for 1 month with badge

**Badges:** Verified, Developer, CEO

### 6. Security 🔒

- **httpOnly Cookies**: tokens not accessible via JavaScript
- **Rate Limiting**: brute-force protection
- **CSP headers**: XSS protection
- **Zod validation**: strict data validation
- **Centralized error handling**
- **Permission checks**: chat role and access control

### 7. Onboarding

**Process:**
1. New users are guided through a 4-step onboarding flow
2. Step 1: Choose primary role (Developer, Designer, etc.)
3. Step 2: Select skills (React, Node.js, PostgreSQL, etc.)
4. Step 3: Set goals (Find a team, Show my project, etc.)
5. Step 4: Create or join a workspace

**Data stored:** `primary_role`, `skills`, `goals`, `onboarding_completed`

### 8. Workspaces & Projects

**Workspaces:**
- Create public/private workspaces
- Invite members via codes
- Manage roles: owner, admin, lead, developer, designer, member, guest

**Projects:**
- Create projects within workspaces
- Track tasks with Kanban-style boards (todo, in_progress, review, done)
- Invite collaborators with role-based permissions
- Link GitHub repos and demo URLs

### 9. Tasks

**Features:**
- Create tasks within projects
- Assign to team members
- Set priority: low, medium, high, urgent
- Status workflow: todo → in_progress → review → done
- Add comments to tasks
- Source message linking (create tasks from messages)

---

## 🛡️ Security

- **httpOnly Cookies**: tokens not accessible via JavaScript
- **Rate Limiting**: brute-force protection
- **CSP headers**: XSS protection
- **Zod validation**: strict data validation
- **Centralized error handling**: unified error format
- **Permission checks**: chat role and access control
- **E2E Encryption**: optional end-to-end encrypted messaging

---

## 👥 Permissions

**Chat roles:**
- **Owner (100)**: full access, delete chat, transfer ownership
- **Admin (80)**: manage members and settings
- **Member (10)**: read and send

**Workspace roles:**
- **Owner**: full control, delete workspace, manage invites
- **Admin**: manage members and content
- **Lead**: manage projects and tasks
- **Developer/Designer/Guest**: limited access

**Rules:**
- Cannot manage users with equal or higher rank
- Owner cannot be kicked/demoted
- Each request checks permissions via middleware

---

## 📊 Audit and Logging

**Audited events:**
- User logins/logouts
- Delete posts/messages/chats
- Member role changes
- Kick/ban actions
- Verification requests
- Admin actions

**Storage:**
- Audit logs stored in `audit_logs`
- Auto-cleanup after 90 days
- IP address, User Agent, and details

---

Recent stabilization refactor split oversized route domains from [`backend/src/api.js`](backend/src/api.js) into dedicated modules:

- Sticker domain routes: [`registerStickerRoutes()`](backend/src/routes/stickerRoutes.js:1)
- Messenger/read-status/notification reactions domain routes: [`registerMessengerRoutes()`](backend/src/routes/messengerRoutes.js:1)
- E2EE domain routes remain isolated in [`registerE2EERoutes()`](backend/src/routes/e2eeRoutes.js:1)

Current backend route registration root is still [`backend/src/api.js`](backend/src/api.js), but domain ownership is now modularized for safer maintenance.

---

## 🛠️ Troubleshooting runbook

### Start commands

Frontend (workspace root):

```bash
npm install
npm run dev
```

Backend (separate terminal):

```bash
cd backend
npm install
npm run dev
```

### Required environment variables

Frontend:

- `VITE_API_URL` (example: `http://localhost:5000`)
- `VITE_WS_URL` (optional, defaults from `VITE_API_URL`)
- `VITE_E2EE_ENABLED`
- `VITE_E2EE_STRICT_MODE`

Backend (see [`backend/.env.example`](backend/.env.example)):

- `PORT`
- `JWT_SECRET`
- `DATABASE_URL`
- `FRONTEND_URL` / `FRONTEND_URLS`

### Health checks

- API health: `GET /health` from [`backend/src/server.js`](backend/src/server.js)
- Runtime status: `GET /api/status` from [`backend/src/server.js`](backend/src/server.js)

### Port conflict / stale process recovery (Windows)

Find process on backend port:

```bash
netstat -ano | findstr :5000
```

Terminate stale PID:

```bash
taskkill /PID <PID> /F
```

### WebSocket/API mismatch checks

- Frontend WS URL composition is defined in [`WS_URL`](src/lib/config.ts:5)
- Backend WS endpoint path is `/ws` in [`backend/src/server.js`](backend/src/server.js)
- Ensure both point to the same host/port and protocol (`ws://` vs `wss://`)

### Message persistence validation

Message cache persistence and contract behavior are covered by [`src/test/messages.contract-and-persistence.test.tsx`](src/test/messages.contract-and-persistence.test.tsx).

**Audit events:**
- User logins/logouts
- Delete posts/messages/chats
- Member role changes
- Kick/ban actions
- Verification requests
- Admin actions

**Storage:**
- Audit logs stored in `audit_logs`
- Auto-cleanup after 90 days
- IP address, User Agent, and details

---

## 🗄️ Database schema

### Core tables

#### `users`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| email | TEXT | Email (unique) |
| password_hash | TEXT | Hashed password |
| name | TEXT | Name |
| username | TEXT | Username (unique) |
| bio | TEXT | About |
| avatar | TEXT | Avatar URL |
| banner | TEXT | Banner URL |
| city | TEXT | City |
| website | TEXT | Website |
| verified | BOOLEAN | Verification status |
| followers_count | INTEGER | Followers count |
| join_date | DATETIME | Registration date |
| last_seen_at | DATETIME | Last seen |

#### `posts`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Author |
| text | TEXT | Text (max 420) |
| image_url | TEXT | Image URL |
| timestamp | DATETIME | Created at |
| replies_count | INTEGER | Comment count |
| reposts_count | INTEGER | Repost count |
| resonance_count | INTEGER | Like count |

#### `chats` / `messages`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| sender_id | INTEGER | Sender |
| receiver_id | INTEGER | Receiver |
| text | TEXT | Text |
| created_at | DATETIME | Timestamp |
| deleted_for_all | BOOLEAN | Deleted for all flag |
| moment_id | INTEGER | Moment ID (ephemeral) |

#### `moments`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| sender_id | INTEGER | Sender |
| receiver_id | INTEGER | Receiver |
| thumb_data_url | TEXT | Thumbnail preview |
| ttl_seconds | INTEGER | TTL seconds |
| expires_at | DATETIME | Expiration time |

### Chat tables

#### `chats`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| username | TEXT | Public username (unique) |
| name | TEXT | Chat title |
| description | TEXT | Description |
| avatar | TEXT | Chat avatar |
| type | TEXT | private/group/channel |
| owner_id | INTEGER | Owner |
| created_at | DATETIME | Created at |

#### `chat_members`
| Field | Type | Description |
|-------|------|-------------|
| chat_id | INTEGER | Chat |
| user_id | INTEGER | Member |
| role_id | INTEGER | Role |
| joined_at | DATETIME | Joined at |

#### `chat_roles`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| chat_id | INTEGER | Chat |
| name | TEXT | Role name |
| rank | INTEGER | Rank (priority) |
| permissions_json | TEXT | Permissions (JSON) |
| is_system | BOOLEAN | System role |

#### `messages`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| chat_id | INTEGER | Chat |
| user_id | INTEGER | Author |
| text | TEXT | Text |
| created_at | DATETIME | Timestamp |

#### `chat_join_requests`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| chat_id | INTEGER | Chat |
| user_id | INTEGER | Requestor |
| status | TEXT | pending/approved/rejected |
| created_at | DATETIME | Requested at |

### System tables

#### `rate_limits`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| ip | TEXT | IP address |
| action | TEXT | login/register/forgot_password |
| attempts | INTEGER | Attempts count |
| blocked_until | DATETIME | Blocked until |

#### `audit_logs`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| event_type | TEXT | Event type |
| user_id | INTEGER | Actor |
| target_id | INTEGER | Target ID |
| ip_address | TEXT | IP address |
| user_agent | TEXT | User Agent |
| details | TEXT | JSON details |
| created_at | DATETIME | Timestamp |

---

## 📡 API documentation

Full API docs live in [backend/API.md](./backend/API.md).

### Base URL
```
http://localhost:5000/api
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

### Connection
```
ws://localhost:5000/ws
```

### Events

**Client → Server:**
- `register` — Register user
- `ping` — Heartbeat
- `typing:start` / `typing:stop` — Typing indicator
- `chat:read` — Mark chat read
- `message:delivered` — Delivery
- `chat:subscribe` / `chat:unsubscribe` — Subscribe to chat

**Server → Client:**
- `new_post` — New post
- `new_message` — New message
- `typing:update` — Typing status
- `chat:read_update` — Read status
- `presence:update` — Online status
- `channel:new_message` — Channel message
- `message:deleted` — Message deleted
- `notification_new` — New notification
- `session_terminated` — Session terminated (logout all)

---

## 🛡️ Security

### 1. httpOnly Cookies
Tokens are stored in httpOnly cookies and inaccessible via JavaScript.

### 2. Rate Limiting
- Login: 5 attempts / 15 minutes
- Register: 3 attempts / 1 hour

### 3. Content Security Policy
Strict CSP headers protect against XSS.

### 4. Zod validation
All inputs are strictly validated.

### 5. Centralized error handling
Unified API error format.

### 6. Permission checks
Role-based access control for chats.

---

## 🚀 Installation and launch

### 1. Clone
```bash
git clone <repository-url>
cd LUME
```

### 2. Backend
```bash
cd backend
npm install

# Database migrations
node migrate.js                    # Core tables
node migrate-rate-limit.js         # Rate limiting
node migrate-audit.js              # Audit logs
node migrate-communities.js        # Groups (communities)
node database/migrations/013_workspace_builder_core.sql  # Workspaces, projects, tasks

# Start
npm run dev
```

### 3. Frontend
```bash
npm install
npm run dev
```

### 4. Access
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/health`

---

## ⚙️ Configuration

### Backend (.env)
```env
PORT=5000
JWT_SECRET=your-super-secret-key-change-in-production
NODE_ENV=development
LOG_LEVEL=info  # error | warn | info | debug
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
E2EE_ENFORCE=false  # Enable E2EE strict mode (true/false)
```

### Frontend
No environment variables required.
API URL: `http://localhost:5000/api`

---

## 📄 License

MIT License

---

## 👥 Authors

- **zxclovly** — Owner & Admin

---

## 📚 Additional documentation

- [Features Inventory](./docs/FEATURES_INVENTORY.md) — Complete feature list
- [Error Handling](./docs/ERROR_HANDLING.md) — Error handling system
- [Groups Module](./docs/GROUPS_MODULE.md) — Groups module docs
- [Project UI](./docs/PROJECT_UI/) — UI/UX documentation
- [API Documentation](./backend/API.md) — API endpoints
