# LUME Onboarding UI

English | [Русский](../../docs-ru/PROJECT_UI/ONBOARDING_UI.ru.md) | 中文

**最后更新:** 2026-05-18

---

## 概述

Onboarding UI 通过 4 步向导引导新用户设置个人资料、技能、目标和 workspace 偏好。

---

## 路由

**路径:** `/onboarding`

**组件:** `src/pages/onboarding/OnboardingPage.tsx`

**布局:** MainLayout (authenticated)

**访问:** 受保护路由（需要认证）

---

## 用户流程

```
步骤 1: 个人资料 → 步骤 2: 技能 → 步骤 3: 目标 → 步骤 4: Workspace → 完成 → 重定向到 /feed
```

---

## 步骤 1: 个人资料设置

### 目的
识别用户在开发者生态系统中的主要角色。

### UI 元素
- **标题:** "你的主要角色是什么？"
- **角色选择器:** 角色卡片网格
- **导航:** 下一步按钮（选择前禁用）

### 角色选项
- 开发者
- Frontend 开发者
- Backend 开发者
- 全栈开发者
- UI/UX 设计师
- Telegram Bot 开发者
- 游戏开发者
- 创始人
- 学生
- Open Source 贡献者
- 其他

### 交互
1. 用户点击角色卡片
2. 卡片以强调色高亮
3. 下一步按钮变为可用
4. 点击下一步 → 进入步骤 2

---

## 步骤 2: 技能选择

### 目的
捕获用户的技术技能和专业知识。

### UI 元素
- **标题:** "你有哪些技能？"
- **技能类别:** 可展开部分
- **技能标签:** 多选芯片
- **已选技能:** 显示所选技能的区域
- **导航:** 上一步按钮，下一步按钮

### 技能类别
- **Frontend:** React, Next.js, Vue, Tailwind, TypeScript
- **Backend:** Node.js, Python, FastAPI, Django, NestJS, Express
- **Bots:** Aiogram, Telethon, Telegraf, Telegram Mini Apps
- **数据库:** PostgreSQL, SQLite, MongoDB, Redis
- **设计:** Figma, UI Design, UX Design, Branding
- **其他:** Electron, C#, WPF, Unity, Godot, Rust, Go

### 交互
1. 用户点击技能芯片选择/取消选择
2. 所选技能出现在摘要区域
3. 可以跨类别选择多个技能
4. 点击下一步 → 进入步骤 3

---

## 步骤 3: 目标定义

### 目的
了解用户想在平台上实现什么。

### UI 元素
- **标题:** "你的目标是什么？"
- **目标卡片:** 带图标的 多选卡片
- **导航:** 上一步按钮，下一步按钮

### 目标选项
- 寻找团队
- 寻找项目
- 展示我的项目
- 寻找开发者
- 与 indie 开发者交流
- 建立我的团队
- 创建 open-source 项目
- 寻找自由职业/工作
- 只是浏览项目

### 交互
1. 用户点击目标卡片选择/取消选择
2. 所选卡片以强调色高亮
3. 可以选择多个目标
4. 点击下一步 → 进入步骤 4

---

## 步骤 4: Workspace 设置

### 目的
将用户连接到 workspace 或允许他们创建一个。

### UI 元素
- **标题:** "加入或创建 workspace"
- **三个选项:**
  1. **创建新 Workspace**
     - 名称输入
     - Slug 输入（从名称自动生成）
     - 描述 textarea
     - 类型选择器（公共/私有）
     - 焦点标签输入
  2. **加入现有 Workspace**
     - 邀请码输入
     - 加入按钮
  3. **暂时跳过**
     - 跳过按钮

### 创建 Workspace 表单
- **名称:** 必填，3-50 字符
- **Slug:** 自动生成，可编辑，3-30 字符
- **描述:** 可选，最多 500 字符
- **类型:** 公共或私有单选按钮
- **焦点标签:** 逗号分隔标签

### 加入 Workspace 表单
- **邀请码:** 必填，字母数字代码
- **验证:** 实时检查代码是否有效

### 交互
1. 用户选择三个选项之一
2. 如果创建：填写表单并点击创建
3. 如果加入：输入代码并点击加入
4. 如果跳过：点击跳过
5. 成功后 → 进入完成

---

## 完成

### 操作
1. 在数据库中标记 onboarding 为已完成
2. 清除 localStorage 草稿
3. 显示成功消息
4. 重定向到 `/feed`

### 成功消息
- Toast 通知: "欢迎来到 LUME！您的个人资料已设置完毕。"

---

## 草稿持久化

### LocalStorage 键
`lume_onboarding_draft_v1`

### 存储的数据
```json
{
  "step": 2,
  "primaryRole": "Frontend 开发者",
  "skills": ["React", "TypeScript"],
  "goals": ["寻找团队"],
  "workspace": {
    "name": "我的团队",
    "slug": "my-team",
    "description": "",
    "type": "private",
    "focusTags": ""
  }
}
```

### 行为
- 每步变更时保存
- 页面加载时恢复
- 完成或手动清除时清除

---

## 动画

### 页面过渡
- **进入:** 从右侧滑入带淡入
- **退出:** 向左滑出带淡入
- **持续时间:** 300ms
- **缓动:** ease-in-out

### 步骤指示器
- 显示当前步骤的进度条 (1/4, 2/4 等)
- 动画宽度过渡

---

## 响应式设计

### Desktop (≥1024px)
- 居中的卡片布局
- 最大宽度: 800px
- 角色/目标卡片双列网格

### Tablet (768px - 1023px)
- 全宽卡片
- 单列网格

### Mobile (<768px)
- 全屏布局
- 堆叠元素
- 更大的触摸目标

---

## 错误处理

### 验证错误
- 输入下方内联错误消息
- 无效字段红色边框
- 修复前阻止继续

### API 错误
- 带错误消息的 Toast 通知
- 重试按钮
- 表单保持填充以供重试

### 网络错误
- "连接丢失" 消息
- 重新连接时自动重试
- 为恢复保存草稿

---

## 可访问性

### 键盘导航
- Tab 遍历所有交互元素
- Enter 选择/提交
- Escape 返回

### 屏幕阅读器
- 所有输入上的 ARIA 标签
- 角色声明
- 进度声明

### 焦点管理
- 可见焦点指示器
- 模态框内焦点陷阱
- 第一个输入自动聚焦

---

## 使用的组件

### UI 组件
- `CustomSelect` - 下拉选择器
- `Textarea` - 多行文本输入
- `Button` - 主要/次要操作
- `Card` - 步骤容器
- `Badge` - 技能/标签芯片
- `Input` - 文本输入

### 工具
- `slugify()` - 将名称转换为 URL 安全的 slug
- `toast` - 通知系统
- `AnimatePresence` - Framer Motion 动画

---

## API 集成

### 使用的端点
- `GET /onboarding/status` - 检查完成状态
- `POST /onboarding/profile` - 保存角色
- `POST /onboarding/skills` - 保存技能
- `POST /onboarding/goals` - 保存目标
- `POST /onboarding/workspace` - 创建/加入 workspace
- `POST /onboarding/complete` - 标记为完成

---

## 相关文档

- [Onboarding 模块](../ONBOARDING_MODULE.md)
- [Workspaces UI](./WORKSPACES_UI.md)
- [路由](./ROUTES.md)
- [概述](./OVERVIEW.md)