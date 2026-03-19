# LUME — Full-featured social network with messenger

English | [Русский](./README.ru.md) | [中文](./README.cn.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-latest-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

**LUME** is a modern social network with messenger features built on Node.js + React. The project includes a feed, direct messaging, user verification, admin panel, content moderation, and **servers (communities)** with channels.

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
- [License](#license)

---

## 📖 Project overview

### Highlights:
- 🔄 **Real-time feed** with WebSocket updates
- 💬 **Messenger** for 1:1 private chats
- 👥 **Servers (Communities)** with channels and roles
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
│   │   │   ├── servers/    # Server components
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
│   │   │   └── server/     # Server pages
│   │   ├── services/       # API client, errorHandler, websocket
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
    │   ├── server.js       # Entry point + WebSocket server
    │   ├── api.js          # API routes (Auth, Posts, Messages, Profile)
    │   ├── servers.js      # Servers and channels
    │   ├── auth.js         # Authentication (JWT, refresh tokens, cookies)
    │   ├── profile.js      # User profile
    │   ├── uploads.js      # File uploads
    │   ├── validation.js   # Zod validation
    │   ├── permissions.js  # Access control
    │   ├── rateLimiter.js  # Rate limiting middleware
    │   ├── errors.js       # Error handling
    │   ├── logger.js       # Logging
    │   ├── audit.js        # Audit logging
    │   ├── csrf.js         # CSRF protection
    │   ├── linkPreview.js  # Open Graph preview
    │   ├── serializers.js  # Data serialization
    │   └── db.js           # PostgreSQL database
    │
    ├── uploads/            # Uploaded files
    ├── migrate.js          # Core migrations
    ├── migrate-rate-limit.js # Rate limiting migration
    ├── migrate-communities.js # Servers migration
    ├── migrate-audit.js    # Audit migration
    └── package.json
```

---

## ⚙️ Key features

### 1. Servers (Communities)

**Features:**
- Create public/private servers
- Role system: Owner (100), Admin (80), Moderator (50), Member (10)
- Text channels
- Join requests for private servers
- Member management (kick, change role)
- Real-time channel messaging
- File uploads in messages

**URL navigation:**
- Public: `/server/:username/channel/:channelName`
- Private: `/server/:id/channel/:channelName`

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
- **Permission checks**: server role and access control

### 7. Permissions

**Server roles:**
- **Owner (100)**: full access, delete server
- **Admin (80)**: manage channels and members
- **Moderator (50)**: moderate messages, kick, timeouts
- **Member (10)**: read and send

**Rules:**
- Cannot manage users with equal or higher rank
- Owner cannot be kicked/demoted
- Each request checks permissions via middleware

### 8. Audit and logging

**Audit events:**
- User logins/logouts
- Delete posts/messages/servers
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

### Server tables

#### `servers`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| username | TEXT | Public username (unique) |
| name | TEXT | Server name |
| description | TEXT | Description |
| icon_url | TEXT | Icon URL |
| type | TEXT | public/private |
| owner_id | INTEGER | Owner |
| created_at | DATETIME | Created at |

#### `server_members`
| Field | Type | Description |
|-------|------|-------------|
| server_id | INTEGER | Server |
| user_id | INTEGER | Member |
| role_id | INTEGER | Role |
| joined_at | DATETIME | Joined at |

#### `server_roles`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| server_id | INTEGER | Server |
| name | TEXT | Role name |
| rank | INTEGER | Rank (priority) |
| permissions_json | TEXT | Permissions (JSON) |
| is_system | BOOLEAN | System role |

#### `server_channels`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| server_id | INTEGER | Server |
| name | TEXT | Channel name |
| type | TEXT | text/voice |
| position | INTEGER | Position |

#### `server_messages`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| channel_id | INTEGER | Channel |
| user_id | INTEGER | Author |
| text | TEXT | Text |
| created_at | DATETIME | Timestamp |

#### `server_join_requests`
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| server_id | INTEGER | Server |
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

#### Messages
- `GET /messages` — Chat list
- `GET /messages/:userId` — Message history
- `POST /messages` — Send message
- `DELETE /messages/:messageId` — Delete message

#### Servers
- `POST /servers` — Create server
- `GET /servers/my` — My servers
- `GET /servers/public` — Public servers
- `GET /servers/:identifier` — Server by username/ID
- `POST /servers/:id/join` — Join
- `POST /servers/:id/channels` — Create channel
- `POST /servers/:serverId/channels/:channelId/messages` — Channel message

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
- `server:subscribe` / `server:unsubscribe` — Subscribe to server

**Server → Client:**
- `new_post` — New post
- `new_message` — New message
- `typing:update` — Typing status
- `chat:read_update` — Read status
- `presence:update` — Online status
- `channel:new_message` — Channel message
- `server:created` / `server:deleted` — Server created/deleted

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
Role-based access control for servers.

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
node migrate-communities.js        # Servers (communities)

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
- [Servers Module](./docs/SERVERS_MODULE.md) — Servers module docs
- [Project UI](./docs/PROJECT_UI/) — UI/UX documentation
- [API Documentation](./backend/API.md) — API endpoints

