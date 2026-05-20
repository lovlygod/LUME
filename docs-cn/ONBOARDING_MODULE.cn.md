# LUME Onboarding 模块

English | [Русский](../docs-ru/ONBOARDING_MODULE.ru.md) | 中文

**最后更新:** 2026-05-18
**状态:** ✅ 已实现

---

## 概述

Onboarding 模块引导新用户完成 4 步流程，设置他们的个人资料、技能、目标和 workspace 偏好。这确保用户从第一天起就拥有完整的个人资料并连接到正确的社区。

---

## 架构

### Backend

**文件:**
- `backend/src/routes/onboardingRoutes.js` - API 路由
- `backend/src/services/onboardingService.js` - 业务逻辑
- `backend/src/validators/onboardingSchemas.js` - 验证模式

**数据库:**
- 用户个人资料字段: `primary_role`, `skills`, `goals`, `onboarding_completed`

### Frontend

**文件:**
- `src/pages/onboarding/OnboardingPage.tsx` - 主 onboarding UI
- `src/services/api.ts` - API 客户端方法

---

## Onboarding 流程

### 第 1 步: 个人资料设置
**目的:** 识别用户的主要角色

**选项:**
- 开发者 (Frontend, Backend, Fullstack)
- UI/UX 设计师
- Telegram Bot 开发者
- 游戏开发者
- 创始人
- 学生
- Open Source 贡献者
- 其他

**存储的数据:** `primary_role`

### 第 2 步: 技能选择
**目的:** 捕获技术技能

**类别:**
- **Frontend:** React, Next.js, Vue, Tailwind, TypeScript
- **Backend:** Node.js, Python, FastAPI, Django, NestJS, Express
- **Bots:** Aiogram, Telethon, Telegraf, Telegram Mini Apps
- **数据库:** PostgreSQL, SQLite, MongoDB, Redis
- **设计:** Figma, UI Design, UX Design, Branding
- **其他:** Electron, C#, WPF, Unity, Godot, Rust, Go

**存储的数据:** `skills` (数组)

### 第 3 步: 目标定义
**目的:** 了解用户意图

**选项:**
- 寻找团队
- 寻找项目
- 展示我的项目
- 寻找开发者
- 与 indie 开发者交流
- 建立我的团队
- 创建 open-source 项目
- 寻找自由职业/工作
- 只是浏览项目

**存储的数据:** `goals` (数组)

### 第 4 步: Workspace 设置
**目的:** 将用户连接到 workspace

**操作:**
- **创建新 workspace:** 用户成为所有者
- **加入现有 workspace:** 通过邀请码
- **跳过:** 继续而不使用 workspace

**存储的数据:** Workspace 成员资格（如果创建/加入）

---

## API 端点

### GET `/onboarding/status`
获取用户的 onboarding 状态。

**响应 200:**
```json
{
  "onboarding": {
    "completed": false,
    "primary_role": "Developer",
    "skills": ["React", "Node.js"],
    "goals": ["Find a team"]
  }
}
```

### POST `/onboarding/profile`
保存个人资料步骤（角色）。

**Body:**
```json
{
  "primaryRole": "Frontend Developer"
}
```

**响应 200:**
```json
{
  "user": {
    "id": "1",
    "primary_role": "Frontend Developer"
  }
}
```

### POST `/onboarding/skills`
保存技能步骤。

**Body:**
```json
{
  "skills": ["React", "TypeScript", "Node.js"]
}
```

**响应 200:**
```json
{
  "user": {
    "id": "1",
    "skills": ["React", "TypeScript", "Node.js"]
  }
}
```

### POST `/onboarding/goals`
保存目标步骤。

**Body:**
```json
{
  "goals": ["Find a team", "Show my project"]
}
```

**响应 200:**
```json
{
  "user": {
    "id": "1",
    "goals": ["Find a team", "Show my project"]
  }
}
```

### POST `/onboarding/workspace`
处理 workspace 创建或加入。

**Body (创建):**
```json
{
  "action": "create",
  "workspace": {
    "name": "My Team",
    "slug": "my-team",
    "description": "Building awesome projects",
    "type": "public",
    "focus": ["Web Development", "Open Source"]
  }
}
```

**Body (加入):**
```json
{
  "action": "join",
  "inviteCode": "ABC123"
}
```

**Body (跳过):**
```json
{
  "action": "skip"
}
```

**响应 201 (创建):**
```json
{
  "workspace": {
    "id": "1",
    "name": "My Team",
    "slug": "my-team",
    "owner_id": "1"
  }
}
```

### POST `/onboarding/complete`
标记 onboarding 为已完成。

**响应 200:**
```json
{
  "onboarding": {
    "completed": true
  }
}
```

---

## 验证规则

### 个人资料步骤
- `primaryRole`: 必填，字符串，预定义角色之一

### 技能步骤
- `skills`: 可选，字符串数组，最多 20 个技能

### 目标步骤
- `goals`: 可选，字符串数组，最多 10 个目标

### Workspace 步骤
- `action`: 必填，"create"、"join"、"skip" 之一
- `workspace.name`: 如果 action=create 则必填，3-50 字符
- `workspace.slug`: 如果 action=create 则必填，3-30 字符，字母数字 + 连字符
- `inviteCode`: 如果 action=join 则必填

---

## 用户体验

### 草稿持久化
- 表单数据保存到 localStorage (`lume_onboarding_draft_v1`)
- 页面重新加载时恢复
- 完成时清除

### 导航
- 线性流程: 步骤 1 → 2 → 3 → 4
- 返回按钮可用（步骤 1 除外）
- 仅步骤 4 有跳过按钮

### 完成
- 完成时重定向到 `/feed`
- 数据库中设置 `onboarding_completed = true`
- 清除 localStorage 草稿

---

## 相关文档

- [Workspaces 模块](./WORKSPACES_MODULE.md)
- [Projects 模块](./PROJECTS_MODULE.md)
- [功能清单](./FEATURES_INVENTORY.md)
- [Onboarding UI](../PROJECT_UI/ONBOARDING_UI.md)
- [README](../README.md)