# LUME — 全功能社交网络与消息系统

中文 | [English](./README.md) | [Русский](./README.ru.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-latest-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

**LUME** 是一个基于 Node.js + React 构建的现代化社交网络，集成动态流、私信消息、用户认证、管理面板、内容审核，以及 Messages 中的 **群组/频道聊天**。

---

## 📋 目录

- [项目概览](#项目概览)
- [技术栈](#技术栈)
- [项目架构](#项目架构)
- [核心功能](#核心功能)
- [安全](#安全)
- [权限模型](#权限模型)
- [审计与日志](#审计与日志)
- [数据库结构](#数据库结构)
- [API 文档](#api-文档)
- [WebSocket 事件](#websocket-事件)
- [Troubleshooting runbook](#troubleshooting-runbook)
- [安装与启动](#安装与启动)
- [配置](#配置)
- [许可证](#许可证)

---

## 📖 项目概览

### 主要能力
- 🔄 **实时动态流**（WebSocket 推送）
- 💬 **1:1 私信聊天**
- 👥 **Groups & Channels**（聊天类型：`group`、`channel`）
- 👤 **用户资料页**（头像、横幅）
- ✅ **认证系统**（通过 TikTok 视频）
- 🛡️ **内容审核**（举报与审核流程）
- 📑 **管理后台**（用户与内容管理）
- ⚡ **实时通知**（WebSocket）
- 🔒 **安全机制**（httpOnly Cookies、限流、CSP）
- 🌐 **i18n**（俄语、英语、中文、西班牙语、葡语巴西）

---

## 🛠️ 技术栈

### Frontend
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 库 |
| TypeScript | 5.8.3 | 类型系统 |
| React Router | 6.30.1 | 路由 |
| Framer Motion | 12.34.0 | 动画 |
| Tailwind CSS | 3.4.17 | 样式 |
| Radix UI | various | UI 原语 |
| shadcn/ui | latest | UI 组件 |
| TanStack Query | 5.90.21 | 服务端状态管理 |
| Emoji Picker React | 4.18.0 | 表情选择器 |
| Sonner | 1.7.4 | Toast 通知 |
| Zod | 3.25.76 | Schema 校验 |
| React Hook Form | 7.61.1 | 表单处理 |
| Lucide React | 0.462.0 | 图标 |

### Backend
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
| **Cookie-parser** | 1.4.7 | Cookie 处理 |

---

## 🏗️ 项目架构

```text
LUME/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── contexts/
│   ├── hooks/
│   ├── i18n/
│   └── lib/
└── backend/
    ├── src/
    │   ├── routes/
    │   ├── services/
    │   ├── validators/
    │   └── middleware/
    └── database/
```

---

## ⚙️ 核心功能

### 1) Groups & Channels (Chats)
- 聊天类型：`group`、`channel`、`private`
- 创建群组与频道
- 公共频道加入申请
- 成员与角色管理
- 实时聊天消息
- 消息附件上传

### 2) Feed
- 按时间流展示
- 发布帖子（文本 ≤ 420 字）+ 图片
- “Resonance” 反应
- Emoji 评论
- 转发
- WebSocket 实时更新
- 资料页置顶帖

### 3) Messenger
- 一对一私信
- 聊天列表与最后一条消息
- 未读计数
- 送达/已读状态
- 删除消息（仅自己 / 对所有人）
- 图片、文件、语音与 media 消息

### 4) 用户资料
- 查看他人资料
- 编辑个人资料
- 头像与横幅
- 统计：粉丝、关注、帖子
- 关注系统
- 置顶帖子

### 5) 认证系统
1. 提交认证申请（注册 ≥ 7 天）
2. 管理员审核
3. 审核通过后生效 1 个月

徽章类型：Verified、Developer、CEO

### 6) Onboarding
1. 新用户进入 4 步引导
2. 选择主角色
3. 选择技能
4. 选择目标
5. 创建或加入 workspace

保存字段：`primary_role`、`skills`、`goals`、`onboarding_completed`

### 7) Workspaces & Projects
- 公共/私有 workspace
- 邀请码加入
- 角色模型：owner/admin/lead/developer/designer/member/guest
- 项目与任务协作
- 看板流转：`todo` → `in_progress` → `review` → `done`

---

## 🛡️ 安全

- **httpOnly Cookies**：令牌不可被 JS 读取
- **Rate Limiting**：防暴力破解
- **CSP Headers**：防 XSS
- **Zod Validation**：严格入参校验
- **Centralized Error Handling**：统一 API 错误格式
- **Permission Checks**：基于角色的访问控制

---

## 👥 权限模型

### 聊天角色
- **Owner (100)**：最高权限，可删除聊天、转移所有权
- **Admin (80)**：成员管理与聊天设置
- **Member (10)**：读写消息

### Workspace 角色
- **Owner**：完整控制，允许删除 workspace
- **Admin**：成员与内容管理
- **Lead**：项目与任务管理
- **Developer/Designer/Guest**：受限权限

---

## 📊 审计与日志

审计事件：
- 登录 / 退出
- 删除帖子 / 消息 / 聊天
- 成员角色变更
- Kick / Ban 操作
- 认证申请审核
- 管理员操作

---

## 🗄️ 数据库结构

核心表：
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

## 📡 API 文档

完整文档： [backend/API.md](./backend/API.md)

Base URL：
```text
http://150.241.85.189:5000/api
```

---

## 🔌 WebSocket 事件

连接：
```text
ws://150.241.85.189:5000/ws
```

---

## 🛠️ Troubleshooting runbook

Frontend：
```bash
npm install
npm run dev
```

Backend：
```bash
cd backend
npm install
npm run dev
```

---

## 🚀 安装与启动

```bash
git clone <repository-url>
cd LUME
```

---

## ⚙️ 配置

后端 `.env` 关键项：`PORT`、`JWT_SECRET`、`NODE_ENV`、`LOG_LEVEL` 等运行参数。

---

## 📄 许可证

MIT License
