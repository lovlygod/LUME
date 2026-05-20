# LUME Projects UI

English | [Русский](../../docs-ru/PROJECT_UI/PROJECTS_UI.ru.md) | 中文

**最后更新:** 2026-05-18

---

## 概述

Projects UI 提供创建、浏览和管理项目的界面。项目可以是独立的或链接到 workspaces，具有任务管理、团队协作和展示功能。

---

## 路由

### Projects 列表
**路径:** `/projects`
**组件:** `src/pages/projects/ProjectsPage.tsx`
**布局:** MainLayout (authenticated)

### Project 详情
**路径:** `/projects/:slug`
**组件:** `src/pages/projects/ProjectDetailPage.tsx`
**布局:** MainLayout (authenticated)

---

## Projects 列表页面

### 布局结构

```
┌─────────────────────────────────────┐
│ Header: "Projects"                  │
│ [创建项目]                           │
├─────────────────────────────────────┤
│ 标签页: [我的项目] [探索]            │
├─────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ Project │ │ Project │ │ Project ││
│ │  Card   │ │  Card   │ │  Card   ││
│ └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────┘
```

### 我的项目标签页

**用途:** 显示用户的项目

**项目卡片:**
- Banner/logo 图片
- 项目名称
- 描述（截断）
- 状态徽章 (Idea, Building, Testing, Launched, Paused, Archived)
- Tech stack 图标 (最多 5 个, +N 更多)
- 成员头像 (最多 3 个, +N 更多)
- 任务进度条 (X/Y 已完成)
- 用户角色徽章
- 点击 → 导航到项目详情

**空状态:**
- 消息: "您还没有创建任何项目"
- CTA: "创建您的第一个项目" 按钮

### 探索标签页

**用途:** 浏览公共项目

**过滤:**
- 状态下拉菜单 (全部, Idea, Building, Testing, Launched, Paused, Archived)
- Tech stack 过滤 (多选)
- 标签过滤
- Open source 切换

**项目卡片:**
- 与我的项目相同
- "招募成员" 徽章 (如果适用)
- "Open Source" 徽章 (如果适用)
- GitHub 星数 (如果链接)

**空状态:**
- 消息: "未找到公共项目"
- 调整过滤建议

---

## 创建项目模态框

### 触发
- 点击 "创建项目" 按钮

### 表单部分

#### 基本信息

**名称** (必填)
- 输入类型: text
- 验证: 3-100 字符
- 占位符: "我的项目"

**Slug** (必填)
- 输入类型: text
- 从名称自动生成
- 可编辑
- 验证: 3-50 字符，小写，字母数字 + 连字符
- 实时可用性检查

**描述** (可选)
- Textarea
- 验证: 最多 1000 字符
- Markdown 支持
- 预览切换

#### 项目详情

**状态** (必填)
- 下拉菜单: Idea, Building, Testing, Launched, Paused, Archived
- 默认: Idea

**可见性** (必填)
- 单选: 公共 / 私有
- 默认: 私有

**Tech Stack** (可选)
- 带自动完成的多选
- 流行选项: React, Node.js, Python 等
- 允许自定义输入
- 最多 20 项

**标签** (可选)
- 逗号分隔输入
- 转换为标签芯片
- 最多 10 个标签

#### 链接

**GitHub URL** (可选)
- 输入类型: url
- 验证: 有效 GitHub URL
- 自动获取 repo 信息 (stars, 语言)

**Demo URL** (可选)
- 输入类型: url
- 验证: 有效 URL
- 缺少时自动添加 https:// 前缀

#### 设置

**招募成员** (可选)
- 复选框
- 在探索中显示徽章

**Open Source** (可选)
- 复选框
- 添加 open source 徽章

### 操作
- **创建项目** - 提交表单
- **取消** - 关闭模态框

### 验证
- 实时验证
- 有效前提交禁用
- 内联错误消息

---

## 项目详情页面

### 布局结构

```
┌─────────────────────────────────────────┐
│ Banner 图片                             │
├─────────────────────────────────────────┤
│ Logo 项目名称           [设置]          │
│ @slug • 状态 • 可见性                    │
│ 描述...                                 │
│ Stack: [React] [Node] [Postgres]       │
│ 标签: [Web] [SaaS]                     │
│ [GitHub] [Demo] [招募团队]              │
├─────────────────────────────────────────┤
│ 标签页: [概述] [任务] [团队] [聊天]      │
├─────────────────────────────────────────┤
│ 标签页内容                               │
└─────────────────────────────────────────┘
```

### Header 部分

**Banner**
- 全宽 banner 图片
- 回退: 渐变

**Logo 和标题**
- 项目 logo (左侧)
- 项目名称 (h1)
- Slug，状态，可见性
- 描述（长的话可展开）
- Tech stack 徽章
- 标签
- 操作按钮

**链接**
- GitHub 按钮 (带星数)
- Demo 按钮
- "招募成员" 徽章

**操作** (角色相关)
- **设置** 按钮 (admin/lead/manager)
- **离开** 按钮 (成员)
- **加入团队** 按钮 (非成员，如果招募中)

### 概述标签页

**用途:** 项目摘要和活动

**部分:**

1. **关于**
   - 完整描述 (Markdown 渲染)
   - 创建日期
   - 最后更新

2. **快速统计**
   - 总任务数
   - 已完成任务
   - 团队成员
   - GitHub 星数 (如果链接)

3. **最近活动**
   - 任务更新
   - 新成员
   - 状态变更
   - 限制: 10 项

4. **团队亮点**
   - 带角色的成员头像
   - "查看全部" 链接到团队标签页

### 任务标签页

**用途:** 任务管理的 Kanban 看板

**布局:**
```
┌──────────┬──────────┬──────────┬──────────┐
│   Todo   │Building  │ Testing  │   Done   │
├──────────┼──────────┼──────────┼──────────┤
│ [Task 1] │ [Task 3] │ [Task 5] │ [Task 7] │
│ [Task 2] │ [Task 4] │ [Task 6] │ [Task 8] │
│    +     │    +     │    +     │    +     │
└──────────┴──────────┴──────────┴──────────┘
```

**任务卡片:**
- 标题
- 优先级徽章 (彩色)
- 执行人头像
- 评论数
- 创建日期
- 拖动在列之间移动

**操作:**
- **创建任务** 按钮 (admin/lead/manager/owner)
- **过滤** 下拉 (按执行人，优先级)
- **排序** 下拉 (按日期，优先级)

**任务详情模态框:**
- 完整描述
- 状态下拉菜单
- 优先级选择器
- 执行人选择器
- 评论线程
- 编辑/删除按钮 (如果允许)

### 团队标签页

**用途:** 管理项目团队

**成员列表:**
- 头像
- 姓名和用户名
- 角色徽章
- 加入日期
- 操作菜单 (admin/lead/manager):
  - 更改角色
  - 移除成员

**操作:**
- **邀请成员** 按钮 (admin/lead/manager)
- **生成邀请链接** 按钮 (admin/lead/manager)

**角色过滤:**
- 下拉: 全部, Owner, Admin, Lead, Manager, Developer 等

### 聊天标签页

**用途:** 项目团队聊天

**显示:** 链接的群组聊天

**如果聊天未链接:**
- 消息 "聊天未链接"
- "链接聊天" 按钮 (仅所有者)

**如果聊天已链接:**
- 嵌入式聊天界面
- 群组/频道消息

---

## 项目设置模态框

### 触发
- 点击 header 中的 "设置" 按钮

### 设置标签页

#### 常规
- 上传 logo
- 名称
- 描述
- 状态
- Tech Stack
- GitHub URL
- Demo URL
- 招募成员
- Open Source

#### 成员
- 按用户名搜索用户
- 按 ID 添加
- 更改角色
- 移除成员

#### 聊天
- 将聊天链接到项目 (从现有聊天中选择)
- 取消链接聊天

#### 危险区域 (仅所有者)
- 删除项目

### 操作
- **保存更改**
- **取消**

---

## 创建任务模态框

### 触发
- 点击任务列中的 "+" 或 "创建任务" 按钮

### 表单字段

**标题** (必填)
- Input: text
- 验证: 3-200 字符

**描述** (可选)
- Textarea
- Markdown 支持
- 最多 2000 字符

**状态** (必填)
- 下拉: Todo, In Progress, Review, Done
- 默认: 基于点击的列

**优先级** (必填)
- 下拉: Low, Medium, High, Urgent
- 默认: Medium
- 彩色

**执行人** (可选)
- 下拉: 项目成员
- 可搜索
- 头像预览

### 操作
- **创建任务**
- **取消**

---

## 响应式设计

### Desktop (≥1024px)
- 项目卡片三列网格
- 四列 Kanban 看板
- 并排模态框

### Tablet (768px - 1023px)
- 两列网格
- 可滚动 Kanban
- 模态框全宽

### Mobile (<768px)
- 单列列表
- 垂直 Kanban (堆叠列)
- 底部工作表模态框
- 滑动手势改变任务状态

---

## 加载状态

### 初始加载
- 骨架卡片
- 闪烁效果

### 任务看板
- 列骨架
- 操作加载微调器

### 拖放
- 拖动时显示阴影卡片
- 放置区域高亮

---

## 错误处理

### API 错误
- Toast 通知
- 重试按钮
- 回退到缓存数据

### 验证错误
- 内联消息
- 阻止提交
- 高亮无效字段

### 网络错误
- 离线横幅
- 操作排队重试
- 显示缓存数据

---

## 动画

### 页面过渡
- 挂载时淡入
- 模态框滑动

### 卡片交互
- 悬停: 放大
- 点击: 波纹

### 拖放
- 平滑过渡
- 弹性动画
- 放置动画

### 任务状态变更
- 在列之间滑动
- 完成时撒花 (可选)

---

## 使用的组件

### UI 组件
- `Card` - 项目/任务卡片
- `Button` - 操作
- `Input` - 表单字段
- `Textarea` - 描述
- `Select` / `CustomSelect` - 下拉菜单
- `Badge` - 状态，优先级，标签
- `Avatar` - 用户头像
- `Tabs` - 导航
- `Dialog` - 模态框
- `DropdownMenu` - 操作菜单
- `Progress` - 任务完成

### 自定义组件
- `ProjectCard` - 项目显示
- `TaskCard` - 任务显示
- `KanbanBoard` - 任务看板
- `MemberList` - 团队管理
- `TechStackBadge` - 技术图标
- `ProjectSettingsModal` - 设置模态框

---

## API 集成

### 使用的端点
- `GET /projects/my` - 用户项目
- `GET /projects/public` - 公共项目
- `GET /projects/:slug` - 项目详情
- `POST /projects` - 创建项目
- `PATCH /projects/:id` - 更新项目
- `POST /projects/:id/logo` - 上传 logo
- `DELETE /projects/:id` - 删除项目
- `GET /projects/:id/members` - 获取成员
- `POST /projects/:id/members` - 添加成员
- `DELETE /projects/:id/members/:userId` - 移除成员
- `POST /projects/:id/leave` - 离开项目
- `POST /projects/:id/invite` - 生成邀请
- `POST /projects/:id/join` - 加入项目
- `POST /projects/:id/chat` - 链接聊天
- `DELETE /projects/:id/chat` - 取消链接聊天
- `GET /projects/:id/search-users` - 搜索用户
- `GET /projects/:projectId/tasks` - 获取任务
- `POST /projects/:projectId/tasks` - 创建任务
- `PATCH /tasks/:taskId` - 更新任务
- `DELETE /tasks/:taskId` - 删除任务
- `POST /tasks/:taskId/comments` - 添加评论

---

## 相关文档

- [Projects 模块](../PROJECTS_MODULE.md)
- [Tasks 模块](../TASKS_MODULE.md)
- [Workspaces UI](./WORKSPACES_UI.md)
- [路由](./ROUTES.md)
- [概述](./OVERVIEW.md)