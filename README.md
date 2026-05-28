# LUME вЂ” Full-featured social network with messenger

English | [Р СѓСЃСЃРєРёР№](./README.ru.md) | [дё­ж–‡](./README.cn.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-latest-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

**LUME** is a modern social network with messenger features built on Node.js + React. The project includes a feed, direct messaging, user verification, admin panel, content moderation, and **group/channel chats** inside Messages.

---

## рџ“‹ Table of Contents

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

## рџ“– Project overview

### Highlights:
- рџ”„ **Real-time feed** with WebSocket updates
- рџ’¬ **Messenger** for 1:1 private chats
- рџ‘Ґ **Groups & Channels** managed as chat types (`group`, `channel`)
- рџ‘¤ **User profiles** with avatars and banners
- вњ… **Verification system** via TikTok video
- рџ›ЎпёЏ **Content moderation** with reports
- рџ‘‘ **Admin panel** for user/content management
- вљЎ **Real-time notifications** via WebSocket
- рџ”’ **Security**: httpOnly cookies, rate limiting, CSP headers
- рџЊђ **i18n**: Russian, English, Chinese, Spanish, Portuguese (Brazil) UI

---

## рџ› пёЏ Tech stack

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

## рџЏ—пёЏ Project architecture

```
LUME/
в”њв”Ђв”Ђ Frontend (Vite + React + TypeScript)
в”‚   в”њв”Ђв”Ђ src/
в”‚   в”‚   в”њв”Ђв”Ђ components/     # UI components
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ ui/         # shadcn/ui components
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ groups/     # (legacy) Group components
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ feed/       # Feed components
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ post/       # Post components
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ chat/       # Chat components
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ media/      # Media components
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ profile/    # Profile components
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ verification/ # Verification components
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ help/       # Help shell
в”‚   в”‚   в”‚   в””в”Ђв”Ђ layout/     # Layout components
в”‚   в”‚   в”њв”Ђв”Ђ pages/          # App pages
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ auth/       # Auth pages
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ messages/   # Messages pages
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ group/      # (legacy) Group pages
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ onboarding/ # Onboarding flow
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ projects/   # Projects pages
в”‚   в”‚   в”‚   в”њв”Ђв”Ђ workspaces/ # Workspaces pages
в”‚   в”‚   в”‚   в””в”Ђв”Ђ stickers/   # Sticker pages
в”‚   в”‚   в”њв”Ђв”Ђ services/       # API client, errorHandler, websocket, e2ee
в”‚   в”‚   в”њв”Ђв”Ђ contexts/       # React contexts (Auth, Language, Theme, Server)
в”‚   в”‚   в”њв”Ђв”Ђ hooks/          # Custom hooks (React Query)
в”‚   в”‚   в”њв”Ђв”Ђ i18n/           # Localization
в”‚   в”‚   в”њв”Ђв”Ђ lib/            # Utilities (queryClient, config, utils)
в”‚   в”‚   в”њв”Ђв”Ђ types/          # TypeScript types
в”‚   в”‚   в””в”Ђв”Ђ test/           # Tests
в”‚   в””в”Ђв”Ђ public/             # Static assets
в”‚
в””в”Ђв”Ђ Backend (Express + PostgreSQL)
     в”њв”Ђв”Ђ src/
     в”‚   в”њв”Ђв”Ђ server.js         # Entry point + WebSocket server
     в”‚   в”њв”Ђв”Ђ api.js            # API routes (Auth, Posts, Chats, Messages, Profile)
     в”‚   в”њв”Ђв”Ђ auth.js           # Authentication (JWT, refresh tokens, cookies)
     в”‚   в”њв”Ђв”Ђ profile.js        # User profile
     в”‚   в”њв”Ђв”Ђ uploads.js        # File uploads (Cloudinary)
     в”‚   в”њв”Ђв”Ђ validation.js     # Zod validation
     в”‚   в”њв”Ђв”Ђ permissions.js    # Access control
     в”‚   в”њв”Ђв”Ђ rateLimiter.js    # Rate limiting middleware
     в”‚   в”њв”Ђв”Ђ errors.js         # Error handling
     в”‚   в”њв”Ђв”Ђ logger.js         # Logging
     в”‚   в”њв”Ђв”Ђ audit.js          # Audit logging
     в”‚   в”њв”Ђв”Ђ csrf.js           # CSRF protection
     в”‚   в”њв”Ђв”Ђ linkPreview.js    # Open Graph preview
     в”‚   в”њв”Ђв”Ђ serializers.js    # Data serialization
     в”‚   в”њв”Ђв”Ђ db.js             # PostgreSQL database
     в”‚   в”њв”Ђв”Ђ routes/
     в”‚   в”‚   в”њв”Ђв”Ђ chatRoutes.js       # Chats (groups/channels)
     в”‚   в”‚   в”њв”Ђв”Ђ socialRoutes.js     # Social (posts, comments, likes, follows, reports)
     в”‚   в”‚   в”њв”Ђв”Ђ e2eeRoutes.js       # End-to-end encryption
     в”‚   в”‚   в”њв”Ђв”Ђ stickerRoutes.js    # Stickers
     в”‚   в”‚   в”њв”Ђв”Ђ messengerRoutes.js  # Messenger (chats list, notifications, read status, reactions)
     в”‚   в”‚   в”њв”Ђв”Ђ exploreRoutes.js    # Explore (builders, projects, workspaces)
     в”‚   в”‚   в”њв”Ђв”Ђ onboardingRoutes.js # Onboarding flow
     в”‚   в”‚   в”њв”Ђв”Ђ projectRoutes.js    # Projects CRUD
     в”‚   в”‚   в”њв”Ђв”Ђ workspaceRoutes.js  # Workspaces CRUD
     в”‚   в”‚   в””в”Ђв”Ђ taskRoutes.js       # Tasks within projects
     в”‚   в”њв”Ђв”Ђ services/
     в”‚   в”‚   в”њв”Ђв”Ђ exploreService.js   # Explore search services
     в”‚   в”‚   в”њв”Ђв”Ђ onboardingService.js # Onboarding steps
     в”‚   в”‚   в”њв”Ђв”Ђ projectService.js   # Project operations
     в”‚   в”‚   в”њв”Ђв”Ђ taskService.js      # Task operations
     в”‚   в”‚   в””в”Ђв”Ђ workspaceService.js  # Workspace operations
     в”‚   в”њв”Ђв”Ђ validators/
     в”‚   в”‚   в”њв”Ђв”Ђ onboardingSchemas.js # Onboarding validation
     в”‚   в”‚   в”њв”Ђв”Ђ projectSchemas.js    # Project validation
     в”‚   в”‚   в”њв”Ђв”Ђ taskSchemas.js       # Task validation
     в”‚   в”‚   в””в”Ђв”Ђ workspaceSchemas.js  # Workspace validation
     в”‚   в”њв”Ђв”Ђ search/
     в”‚   в”‚   в””в”Ђв”Ђ messagesSearch.js    # Full-text search (Meilisearch)
     в”‚   в””в”Ђв”Ђ middleware/
     в”‚       в””в”Ђв”Ђ sanitize.js          # Input sanitization
     в”‚
     в”њв”Ђв”Ђ database/
     в”‚   в”њв”Ђв”Ђ schema.sql                            # Base schema
     в”‚   в”њв”Ђв”Ђ migrate.js                             # Core migrations
     в”‚   в”њв”Ђв”Ђ migrate-rate-limit.js                  # Rate limiting migration
     в”‚   в”њв”Ђв”Ђ migrate-communities.js                 # Groups migration
     в”‚   в”њв”Ђв”Ђ migrate-audit.js                       # Audit migration
     в”‚   в””в”Ђв”Ђ 013_workspace_builder_core.sql         # Workspaces/projects/tasks migration
     в”њв”Ђв”Ђ scripts/
     в”‚   в”њв”Ђв”Ђ db-init.js               # Database initialization
     в”‚   в””в”Ђв”Ђ stickers-sync.js         # Sticker sync helper
     в””в”Ђв”Ђ package.json
```

---

## вљ™пёЏ Key features

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
- вЂњResonanceвЂќ reactions
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
- Media

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
1. Submit request (registration в‰Ґ7 days)
2. Admin review
3. Approved for 1 month with badge

**Badges:** Verified, Developer, CEO

### 6. Security рџ”’

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
- Status workflow: todo в†’ in_progress в†’ review в†’ done
- Add comments to tasks
- Source message linking (create tasks from messages)

---

## рџ›ЎпёЏ Security

- **httpOnly Cookies**: tokens not accessible via JavaScript
- **Rate Limiting**: brute-force protection
- **CSP headers**: XSS protection
- **Zod validation**: strict data validation
- **Centralized error handling**: unified error format
- **Permission checks**: chat role and access control
- **E2E Encryption**: optional end-to-end encrypted messaging

---

## рџ‘Ґ Permissions

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

## рџ“Љ Audit and Logging

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

## рџ› пёЏ Troubleshooting runbook

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

- `VITE_API_URL` (example: `http://150.241.85.189:5000`)
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

## рџ—„пёЏ Database schema

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
| media_id | INTEGER | media ID (ephemeral) |

#### `media`
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

## рџ“Ў API documentation

Full API docs live in [backend/API.md](./backend/API.md).

### Base URL
```
http://150.241.85.189:5000/api
```

### Core endpoints

#### Auth
- `POST /register` вЂ” Register
- `POST /login` вЂ” Login
- `POST /refresh` вЂ” Refresh token
- `POST /logout` вЂ” Logout

#### Profile
- `GET /profile` вЂ” My profile
- `GET /profile/:userId` вЂ” User profile
- `PUT /profile` вЂ” Update profile
- `POST /profile/avatar` вЂ” Upload avatar
- `POST /profile/banner` вЂ” Upload banner
- `DELETE /profile` вЂ” Delete account

#### Posts
- `GET /posts` вЂ” Feed
- `GET /posts/recommended` вЂ” Recommended
- `GET /posts/following` вЂ” Following
- `POST /posts` вЂ” Create post
- `DELETE /posts/:postId` вЂ” Delete post
- `POST /posts/:postId/resonance` вЂ” Like

#### Chats
- `GET /chats` вЂ” Chat list
- `POST /chats` вЂ” Create chat
- `PUT /chats/:chatId` вЂ” Update chat
- `POST /chats/:chatId/members` вЂ” Add member
- `DELETE /chats/:chatId/members/:userId` вЂ” Remove member
- `GET /chats/public?query=...` вЂ” Public channels
- `POST /chats/:chatId/subscribe` вЂ” Join public channel
- `GET /chats/:chatId/join-requests` вЂ” Join requests
- `POST /chats/:chatId/join-requests/:requestId/review` вЂ” Approve/reject

#### Messages
- `GET /messages?chatId=...` вЂ” Chat history
- `POST /messages` вЂ” Send message
- `DELETE /messages/:messageId` вЂ” Delete message

#### Onboarding
- `GET /onboarding/status` вЂ” Get onboarding status
- `POST /onboarding/profile` вЂ” Save profile step
- `POST /onboarding/skills` вЂ” Save skills step
- `POST /onboarding/goals` вЂ” Save goals step
- `POST /onboarding/workspace` вЂ” Save workspace step
- `POST /onboarding/complete` вЂ” Complete onboarding

#### Workspaces
- `POST /workspaces` вЂ” Create workspace
- `GET /workspaces/my` вЂ” My workspaces
- `GET /workspaces/public` вЂ” Public workspaces
- `GET /workspaces/:slug` вЂ” Workspace by slug
- `PATCH /workspaces/:id` вЂ” Update workspace
- `DELETE /workspaces/:id` вЂ” Delete workspace
- `POST /workspaces/:id/members` вЂ” Add member
- `PATCH /workspaces/:id/members/:userId` вЂ” Update member role
- `DELETE /workspaces/:id/members/:userId` вЂ” Remove member
- `POST /workspaces/:id/invites` вЂ” Create invite
- `POST /workspaces/join/:inviteCode` вЂ” Join via invite
- `GET /workspaces/:id/members` вЂ” List members

#### Projects
- `POST /projects` вЂ” Create project
- `GET /projects/my` вЂ” My projects
- `GET /projects/public` вЂ” Public projects
- `GET /projects/:slug` вЂ” Project by slug
- `PATCH /projects/:id` вЂ” Update project
- `DELETE /projects/:id` вЂ” Delete project
- `POST /projects/:id/members` вЂ” Add member
- `DELETE /projects/:id/members/:userId` вЂ” Remove member
- `POST /projects/:id/invite` вЂ” Create invite
- `GET /projects/:id/members` вЂ” List members

#### Tasks
- `POST /projects/:projectId/tasks` вЂ” Create task
- `GET /projects/:projectId/tasks` вЂ” Project tasks
- `PATCH /tasks/:taskId` вЂ” Update task
- `DELETE /tasks/:taskId` вЂ” Delete task
- `POST /tasks/:taskId/comments` вЂ” Add comment

---

## рџ”Њ WebSocket events

### Connection
```
ws://150.241.85.189:5000/ws
```

### Events

**Client в†’ Server:**
- `register` вЂ” Register user
- `ping` вЂ” Heartbeat
- `typing:start` / `typing:stop` вЂ” Typing indicator
- `chat:read` вЂ” Mark chat read
- `message:delivered` вЂ” Delivery
- `chat:subscribe` / `chat:unsubscribe` вЂ” Subscribe to chat

**Server в†’ Client:**
- `new_post` вЂ” New post
- `new_message` вЂ” New message
- `typing:update` вЂ” Typing status
- `chat:read_update` вЂ” Read status
- `presence:update` вЂ” Online status
- `channel:new_message` вЂ” Channel message
- `message:deleted` вЂ” Message deleted
- `notification_new` вЂ” New notification
- `session_terminated` вЂ” Session terminated (logout all)

---

## рџ›ЎпёЏ Security

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

## рџљЂ Installation and launch

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
- Backend API: `http://150.241.85.189:5000/api`
- Health check: `http://150.241.85.189:5000/health`

---

## вљ™пёЏ Configuration

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
API URL: `http://150.241.85.189:5000/api`

---

## рџ“„ License

MIT License

---

## рџ‘Ґ Authors

- **zxclovly** вЂ” Owner & Admin

---

## рџ“љ Additional documentation

- [Features Inventory](./docs/FEATURES_INVENTORY.md) вЂ” Complete feature list
- [Error Handling](./docs/ERROR_HANDLING.md) вЂ” Error handling system
- [Groups Module](./docs/GROUPS_MODULE.md) вЂ” Groups module docs
- [Project UI](./docs/PROJECT_UI/) вЂ” UI/UX documentation
- [API Documentation](./backend/API.md) вЂ” API endpoints


