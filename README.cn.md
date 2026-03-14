# LUME — 全功能社交网络与即时消息平台

中文 | [English](./README.md) | [Русский](./README.ru.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-latest-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

**LUME** 是一款基于 Node.js + React 技术栈构建的现代社交网络，集成了动态信息流、私信系统、用户认证、管理面板、内容审核与 **服务器（communities）** 及频道等功能。

---

## 📋 目录

- [项目概览](#项目概览)
- [技术栈](#技术栈)
- [项目架构](#项目架构)
- [功能特性](#功能特性)
- [数据库结构](#数据库结构)
- [API 文档](#api-文档)
- [WebSocket 事件](#websocket-事件)
- [安全](#安全)
- [安装与运行](#安装与运行)
- [项目结构](#项目结构)
- [配置](#配置)
- [许可证](#许可证)

---

## 📖 项目概览

### 核心亮点：
- 🔄 **实时动态信息流**（WebSocket 实时更新）
- 💬 **私信聊天**（一对一消息系统）
- 👥 **服务器（Communities）**，支持频道与角色
- 👤 **用户资料**（头像、横幅）
- ✅ **用户认证**（TikTok 视频验证）
- 🛡️ **内容审核**（举报系统）
- 👑 **管理面板**（用户与内容管理）
- ⚡ **实时通知**（WebSocket）
- 🔒 **安全机制**：httpOnly Cookies、限流、CSP
- 🌐 **i18n**：支持俄语与英语（UI）

---

## 🛠️ 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 库 |
| TypeScript | 5.8.3 | 类型系统 |
| React Router | 6.30.1 | 路由 |
| Framer Motion | 12.34.0 | 动画 |
| Tailwind CSS | 3.4.17 | 样式 |
| Radix UI | various | UI 原语 |
| shadcn/ui | latest | UI 组件 |
| TanStack Query | 5.90.21 | 服务器状态管理 |
| Emoji Picker React | 4.18.0 | 表情选择器 |
| Sonner | 1.7.4 | Toast 通知 |
| Zod | 3.25.76 | 表单校验 |
| React Hook Form | 7.61.1 | 表单管理 |
| Lucide React | 0.462.0 | 图标 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | latest | 运行时 |
| Express | 4.18.2 | Web 框架 |
| PostgreSQL | 16+ | 数据库 |
| WebSocket (ws) | 8.19.0 | 实时通信 |
| JWT (jsonwebtoken) | 9.0.2 | 认证 |
| Bcryptjs | 2.4.3 | 密码哈希 |
| Multer | 1.4.5-lts.1 | 文件上传 |
| Cors | 2.8.5 | CORS 中间件 |
| **Zod** | 4.3.6 | 数据校验 |
| **Cookie-parser** | 1.4.7 | Cookies 处理 |

---

## 🏗️ 项目架构

```
LUME/
├── Frontend (Vite + React + TypeScript)
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   │   ├── ui/         # shadcn/ui 组件
│   │   │   ├── servers/    # 服务器组件
│   │   │   ├── feed/       # 动态组件
│   │   │   ├── post/       # 帖子组件
│   │   │   ├── chat/       # 聊天组件
│   │   │   ├── media/      # 媒体组件
│   │   │   ├── profile/    # 个人资料组件
│   │   │   ├── verification/ # 认证组件
│   │   │   ├── help/       # Help shell
│   │   │   └── layout/     # Layout 组件
│   │   ├── pages/          # 页面
│   │   │   ├── auth/       # 认证页面
│   │   │   ├── messages/   # 消息页面
│   │   │   └── server/     # 服务器页面
│   │   ├── services/       # API 客户端、errorHandler、websocket
│   │   ├── contexts/       # React 上下文 (Auth, Language, Theme, Server)
│   │   ├── hooks/          # 自定义 hooks (React Query)
│   │   ├── i18n/           # 本地化
│   │   ├── lib/            # 工具库 (queryClient, config, utils)
│   │   ├── types/          # TypeScript 类型
│   │   └── test/           # 测试
│   └── public/             # 静态文件
│
└── Backend (Express + PostgreSQL)
    ├── src/
    │   ├── server.js       # 入口与 WebSocket
    │   ├── api.js          # API 路由 (Auth, Posts, Messages, Profile)
    │   ├── servers.js      # 服务器与频道
    │   ├── auth.js         # 认证 (JWT, refresh tokens, cookies)
    │   ├── profile.js      # 用户资料
    │   ├── uploads.js      # 文件上传
    │   ├── validation.js   # Zod 校验
    │   ├── permissions.js  # 权限系统
    │   ├── rateLimiter.js  # 限流中间件
    │   ├── errors.js       # 错误处理
    │   ├── logger.js       # 日志
    │   ├── audit.js        # 审计
    │   ├── csrf.js         # CSRF 保护
    │   ├── linkPreview.js  # Open Graph 预览
    │   ├── serializers.js  # 数据序列化
    │   └── db.js           # PostgreSQL
    │
    ├── uploads/            # 上传文件
    ├── migrate.js          # 主要迁移
    ├── migrate-rate-limit.js # 限流迁移
    ├── migrate-communities.js # 服务器迁移
    ├── migrate-audit.js    # 审计迁移
    └── package.json
```

---

## ⚙️ 功能特性

### 1. 服务器（Communities）

**功能：**
- 创建公开/私密服务器
- 角色体系：Owner (100)、Admin (80)、Moderator (50)、Member (10)
- 文本频道
- 私密服务器加入申请
- 成员管理（踢人、角色变更）
- 频道实时消息
- 消息附件上传

**URL 导航：**
- 公开：`/server/:username/channel/:channelName`
- 私密：`/server/:id/channel/:channelName`

### 2. 动态信息流（Feed）

**功能：**
- 按时间顺序浏览动态
- 创建帖子（文本 ≤420 字）与图片
- “Resonance” 反应（点赞）
- 表情评论
- 转发帖子
- WebSocket 实时更新
- 置顶帖子

### 3. 消息系统（Messenger）

**功能：**
- 一对一私信
- 聊天列表与最后一条消息
- 未读计数
- WebSocket 实时送达
- 删除消息（仅自己 / 双方）
- 文件与图片附件
- 已读状态
- 语音消息
- 消失的瞬间（moments）

### 4. 用户资料

**功能：**
- 查看他人资料
- 编辑自己的资料
- 头像与横幅
- 统计：关注、粉丝、帖子
- 关注系统
- 置顶帖子

### 5. 认证系统

**流程：**
1. 提交申请（注册 ≥7 天）
2. 管理员审核
3. 通过后 1 个月有效

**徽章：**Verified、Developer、CEO

### 6. 安全 🔒

- **httpOnly Cookies**：令牌不可被 JS 访问
- **Rate Limiting**：防止暴力破解
- **CSP 头**：防 XSS
- **Zod 校验**：严格验证
- **集中式错误处理**
- **权限系统**：服务器角色与权限

### 7. 权限系统（Permissions）

**服务器角色：**
- **Owner (100)**：最高权限，可删除服务器
- **Admin (80)**：管理频道与成员
- **Moderator (50)**：管理消息、踢人
- **Member (10)**：发送与阅读

**规则：**
- 不能管理同级或更高角色
- Owner 不可被踢出或降级

### 8. 审计与日志

**审计事件：**
- 用户登录/退出
- 删除帖子、消息、服务器
- 成员角色变更
- 踢人/封禁
- 认证请求
- 管理员操作

**存储：**
- Audit 日志保存在 `audit_logs`
- 自动清理（90 天）
- IP、User Agent 与操作详情

---

## 🗄️ 数据库结构

### 主要表

#### `users`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| email | TEXT | 邮箱（唯一） |
| password_hash | TEXT | 密码哈希 |
| name | TEXT | 名称 |
| username | TEXT | 用户名（唯一） |
| bio | TEXT | 简介 |
| avatar | TEXT | 头像 URL |
| banner | TEXT | 横幅 URL |
| city | TEXT | 城市 |
| website | TEXT | 站点 |
| verified | BOOLEAN | 认证状态 |
| followers_count | INTEGER | 粉丝数 |
| join_date | DATETIME | 注册时间 |
| last_seen_at | DATETIME | 最近在线 |

#### `posts`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 作者 |
| text | TEXT | 内容（max 420） |
| image_url | TEXT | 图片 URL |
| timestamp | DATETIME | 创建时间 |
| replies_count | INTEGER | 评论数 |
| reposts_count | INTEGER | 转发数 |
| resonance_count | INTEGER | 点赞数 |

#### `chats` / `messages`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| sender_id | INTEGER | 发送者 |
| receiver_id | INTEGER | 接收者 |
| text | TEXT | 文本 |
| created_at | DATETIME | 时间 |
| deleted_for_all | BOOLEAN | 双方删除标记 |
| moment_id | INTEGER | 对应 moment |

#### `moments`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| sender_id | INTEGER | 发送者 |
| receiver_id | INTEGER | 接收者 |
| thumb_data_url | TEXT | 预览缩略图 |
| ttl_seconds | INTEGER | 有效期 |
| expires_at | DATETIME | 过期时间 |

### 服务器相关表

#### `servers`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| username | TEXT | 公共 username（唯一） |
| name | TEXT | 服务器名称 |
| description | TEXT | 描述 |
| icon_url | TEXT | 图标 URL |
| type | TEXT | public/private |
| owner_id | INTEGER | 拥有者 |
| created_at | DATETIME | 创建时间 |

#### `server_members`
| 字段 | 类型 | 说明 |
|------|------|------|
| server_id | INTEGER | 服务器 |
| user_id | INTEGER | 成员 |
| role_id | INTEGER | 角色 |
| joined_at | DATETIME | 加入时间 |

#### `server_roles`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| server_id | INTEGER | 服务器 |
| name | TEXT | 角色名称 |
| rank | INTEGER | 排名（优先级） |
| permissions_json | TEXT | 权限 JSON |
| is_system | BOOLEAN | 系统角色 |

#### `server_channels`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| server_id | INTEGER | 服务器 |
| name | TEXT | 频道名称 |
| type | TEXT | text/voice |
| position | INTEGER | 排序 |

#### `server_messages`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| channel_id | INTEGER | 频道 |
| user_id | INTEGER | 作者 |
| text | TEXT | 文本 |
| created_at | DATETIME | 时间 |

#### `server_join_requests`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| server_id | INTEGER | 服务器 |
| user_id | INTEGER | 申请人 |
| status | TEXT | pending/approved/rejected |
| created_at | DATETIME | 时间 |

### 系统表

#### `rate_limits`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| ip | TEXT | IP 地址 |
| action | TEXT | login/register/forgot_password |
| attempts | INTEGER | 尝试次数 |
| blocked_until | DATETIME | 封禁到期 |

#### `audit_logs`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| event_type | TEXT | 事件类型 |
| user_id | INTEGER | 操作者 |
| target_id | INTEGER | 目标 ID |
| ip_address | TEXT | IP 地址 |
| user_agent | TEXT | UA |
| details | TEXT | 详情 JSON |
| created_at | DATETIME | 时间 |

---

## 📡 API 文档

完整 API 文档见 [backend/API.md](./backend/API.md)。

### 基础 URL
```
http://localhost:5000/api
```

### 主要 endpoints

#### Auth
- `POST /register` — 注册
- `POST /login` — 登录
- `POST /refresh` — 刷新令牌
- `POST /logout` — 登出

#### Profile
- `GET /profile` — 我的资料
- `GET /profile/:userId` — 用户资料
- `PUT /profile` — 更新资料
- `POST /profile/avatar` — 上传头像
- `POST /profile/banner` — 上传横幅
- `DELETE /profile` — 删除账号

#### Posts
- `GET /posts` — 动态
- `GET /posts/recommended` — 推荐
- `GET /posts/following` — 关注
- `POST /posts` — 创建帖子
- `DELETE /posts/:postId` — 删除帖子
- `POST /posts/:postId/resonance` — 点赞

#### Messages
- `GET /messages` — 聊天列表
- `GET /messages/:userId` — 聊天记录
- `POST /messages` — 发送消息
- `DELETE /messages/:messageId` — 删除消息

#### Servers
- `POST /servers` — 创建服务器
- `GET /servers/my` — 我的服务器
- `GET /servers/public` — 公共服务器
- `GET /servers/:identifier` — 通过 username/ID 获取
- `POST /servers/:id/join` — 加入
- `POST /servers/:id/channels` — 创建频道
- `POST /servers/:serverId/channels/:channelId/messages` — 频道消息

---

## 🔌 WebSocket 事件

### 连接
```
ws://localhost:5000/ws
```

### 事件

**客户端 → 服务器：**
- `register` — 注册用户
- `ping` — 心跳
- `typing:start` / `typing:stop` — 输入指示
- `chat:read` — 标记已读
- `message:delivered` — 消息送达
- `server:subscribe` / `server:unsubscribe` — 订阅服务器

**服务器 → 客户端：**
- `new_post` — 新帖子
- `new_message` — 新消息
- `typing:update` — 输入状态
- `chat:read_update` — 已读更新
- `presence:update` — 在线状态
- `channel:new_message` — 频道消息
- `server:created` / `server:deleted` — 服务器创建/删除

---

## 🛡️ 安全

### 1. httpOnly Cookies
令牌保存在 httpOnly cookies，无法通过 JS 读取。

### 2. Rate Limiting
- Login: 5 次 / 15 分钟
- Register: 3 次 / 1 小时

### 3. Content Security Policy
严格 CSP 头防止 XSS。

### 4. Zod 校验
所有输入均进行严格校验。

### 5. 统一错误处理
API 统一错误格式。

### 6. 权限控制
服务器权限系统与角色管理。

---

## 🚀 安装与运行

### 1. 克隆
```bash
git clone <repository-url>
cd LUME
```

### 2. 后端
```bash
cd backend
npm install

# 数据库迁移
node migrate.js                    # 主表
node migrate-rate-limit.js         # 限流
node migrate-audit.js              # 审计
node migrate-communities.js        # 服务器

# 启动
npm run dev
```

### 3. 前端
```bash
npm install
npm run dev
```

### 4. 访问
- 前端：`http://localhost:8080`
- 后端 API：`http://localhost:5000/api`
- 健康检查：`http://localhost:5000/health`

---

## ⚙️ 配置

### 后端 (.env)
```env
PORT=5000
JWT_SECRET=your-super-secret-key-change-in-production
NODE_ENV=development
LOG_LEVEL=info  # error | warn | info | debug
```

### 前端
无需环境变量。
API URL：`http://localhost:5000/api`

---

## 📄 许可证

MIT License

---

## 👥 作者

- **zxclovly** — Owner & Admin

---

## 📚 其他文档

- [Features Inventory](./docs-cn/FEATURES_INVENTORY.cn.md) — 功能清单
- [Error Handling](./docs-cn/ERROR_HANDLING.cn.md) — 错误处理
- [Servers Module](./docs-cn/SERVERS_MODULE.cn.md) — 服务器模块
- [Project UI](./docs-cn/PROJECT_UI/) — UI/UX 文档
- [API Documentation](./backend/API.md) — API endpoints
