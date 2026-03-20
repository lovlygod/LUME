# LUME 功能清单

中文 | [Русский](../docs-ru/FEATURES_INVENTORY.ru.md) | [English](../docs/FEATURES_INVENTORY.md)

**最后更新：** 2026-03-19
**状态：** ✅ 最新

以下列出的是 LUME 项目中**已实际实现**的功能。

---

## 🏠 Landing & Public Pages

### Landing Page
- **路由：** `/`
- **文件：** `src/pages/LandingPage.tsx`, `src/layouts/LandingLayout.tsx`
- **状态：** ✅ 已实现
- **说明：** 面向公众的首页，展示主要功能
- **组件：**
  - Hero 区域与 CTA 按钮
  - Feature cards（6 个卡片）
  - Footer 链接区

### 静态页面
- **路由：** `/faq`, `/rules`, `/support`, `/status`, `/contacts`
- **文件：** `src/pages/FAQPage.tsx`, `RulesPage.tsx`, `SupportPage.tsx`, `StatusPage.tsx`, `ContactsPage.tsx`
- **状态：** ✅ 已实现
- **说明：** 信息类页面

---

## 📜 Legal & Compliance

### 法律页面
- **路由：** `/privacy-policy`, `/terms-of-service`, `/cookie-policy`
- **文件：** `src/pages/PrivacyPolicy.tsx`, `src/pages/TermsOfService.tsx`, `src/pages/CookiePolicy.tsx`, `src/pages/LegalPageLayout.tsx`
- **状态：** ✅ 已实现
- **说明：** 公共法律页面（政策与条款）

### Cookie 同意横幅
- **文件：** `src/components/ui/CookieBanner.tsx`
- **状态：** ✅ 已实现
- **功能：** Accept/Decline、指向 Cookie Policy 的链接、选择持久化（`src/lib/cookieConsent.ts`）

---

## 📰 Feed & Posts

### 动态信息流（Feed）
- **路由：** `/feed`
- **文件：** `src/pages/Index.tsx`, `src/components/feed/PostComposer.tsx`, `src/components/feed/FeedHeader.tsx`, `src/components/post/Post.tsx`
- **状态：** ✅ 已实现
- **功能：**
  - 两个标签页：“For You”（recommended）与“Following”（following）
  - 最长 420 字的文本 + 图片
  - “Resonance”（点赞）
  - 表情评论
  - 转发
  - 置顶帖子
  - WebSocket 实时更新
  - 每 30 秒自动刷新
  - 新帖子提醒

### 帖子组件
- **文件：** `src/components/post/Post.tsx`
- **状态：** ✅ 已实现
- **功能：**
  - 文本与图片展示
  - Resonance（点赞）计数
  - 评论数
  - 回复按钮
  - Emoji picker 反应
  - 上下文菜单（删除、举报、置顶）
  - Image viewer 放大
  - Link preview（Open Graph）

---

## 💬 Messages & Chat

### 消息系统
- **路由：** `/messages`, `/messages/:chatId`
- **文件：** `src/pages/Messages.tsx`, `src/pages/messages/MessagesPage.tsx`, `src/pages/messages/components/ChatList.tsx`, `src/pages/messages/components/ChatPanel.tsx`, `src/pages/messages/components/MessageList.tsx`, `src/pages/messages/components/MessageComposer.tsx`
- **状态：** ✅ 已实现
- **功能：**
  - 聊天列表与最后消息
  - 未读计数
  - 私聊（一对一）
  - 文件与图片附件
  - 回复（reply）
  - 删除消息（仅自己/双方）
  - 状态：在线、上次在线、正在输入
  - Read receipts（已读状态）
  - 删除的上下文菜单
  - Image viewer 放大

### Moments（消失照片）
- **文件：** `src/pages/messages/MessagesPage.tsx`（内置）
- **状态：** ⚠️ 部分实现
- **功能：**
  - TTL 24 小时的消失照片
  - 点击查看
  - 禁止下载
  - 缩略图预览
  - 已读标记
  - 切换标签页自动关闭

### Reply Bar
- **文件：** `src/components/chat/ReplyBar.tsx`
- **状态：** ✅ 已实现
- **说明：** 消息回复条组件

---

## 👥 Groups & Channels (Chats)

### 群组与频道（聊天）
- **路由：** `/messages`, `/messages/:chatId`
- **文件：** `src/pages/Messages.tsx`, `src/pages/messages/MessagesPage.tsx`, `src/pages/messages/components/ChatList.tsx`, `src/pages/messages/components/ChatPanel.tsx`, `src/pages/messages/components/ChatSettingsModal.tsx`, `src/pages/messages/components/CreateChatModal.tsx`
- **状态：** ✅ 已实现
- **功能：**
  - 聊天类型：`group`、`channel`、`private`
  - 创建群组/频道
  - 公开频道的搜索与加入
  - 加入申请（approve/reject）
  - 成员与角色管理

---

## 👤 Profile & Users

### 个人资料（我的）
- **路由：** `/profile`
- **文件：** `src/pages/Profile.tsx`
- **状态：** ✅ 已实现
- **功能：**
  - 头像与横幅
  - 统计：粉丝、关注、帖子
  - 编辑资料（bio、city、website）
  - 置顶帖子
  - 帖子历史
  - 关注按钮（他人）

### 用户资料
- **路由：** `/profile/:userId`
- **文件：** `src/pages/UserProfile.tsx`
- **状态：** ✅ 已实现
- **功能：**
  - 查看他人资料
  - 关注/发消息按钮
  - 认证状态

### Follow Modal
- **文件：** `src/components/profile/FollowModal.tsx`
- **状态：** ✅ 已实现
- **说明：** 关注/粉丝列表弹窗

---

## ✅ Verification

### 认证页面
- **路由：** `/verified`
- **文件：** `src/pages/Verified.tsx`, `src/components/verification/VerificationHero.tsx`
- **状态：** ✅ 已实现
- **功能：**
  - 通过 TikTok 视频提交申请
  - 条件：注册 ≥7 天，视频 ≥2000 浏览
  - 管理员审核
  - 通过后有效 1 个月
  - 徽章：Verified、Developer、CEO

---

## ⚙️ Settings

### 账号设置
- **路由：** `/settings`
- **文件：** `src/pages/Settings.tsx`
- **状态：** ✅ 已实现
- **功能：**
  - 主题（暗色/亮色）
  - 语言（ru/en）
  - 雪花效果开关
  - 帖子隐私
  - 消息隐私
  - 删除账号

### 会话管理
- **路由：** `/settings/sessions`
- **文件：** `src/pages/settings/SessionsPage.tsx`
- **状态：** ✅ 已实现
- **功能：** 当前会话、活跃会话列表、退出设备、logout all

---

## 🛡️ Admin Panel

### 管理面板
- **路由：** `/admin`
- **文件：** `src/pages/AdminPanel.tsx`, `src/components/AdminPanelModal.tsx`
- **状态：** ✅ 已实现（访问取决于权限）
- **功能：**
  - 认证请求
  - 用户列表
  - 帖子举报
  - 通过/拒绝认证
  - 删除帖子
  - 驳回举报

---

## 🔐 Authentication

### 登录 / 注册
- **路由：** `/login`, `/register`
- **文件：** `src/pages/auth/Login.tsx`, `src/pages/auth/Register.tsx`
- **状态：** ✅ 已实现
- **功能：**
  - 邮箱 + 密码
  - username 校验（最少 5 个字符，拉丁字母 + 数字）
  - httpOnly cookies 存储 token
  - CSRF 保护
  - Rate limiting

---

## 🔍 Explore

### 搜索与发现
- **路由：** `/explore`
- **文件：** `src/pages/Explore.tsx`
- **状态：** ✅ 已实现
- **功能：**
  - 用户搜索
  - 公开频道/聊天搜索
  - 趋势（热门话题）
  - 推荐用户

---

## 🔧 System Pages

### 404 Not Found
- **路由：** `*`
- **文件：** `src/pages/NotFound.tsx`
- **状态：** ✅ 已实现

### Error Boundary
- **文件：** `src/components/ErrorBoundary.tsx`
- **状态：** ✅ 已实现
- **说明：** 渲染错误捕获

---

## 🌐 Internationalization (i18n)

### 翻译
- **文件：** `src/i18n/translations.ts`, `src/i18n/locales/ru.json`, `en.json`
- **状态：** ✅ 已实现
- **语言：** Русский, English
- **规模：** 1000+ 行翻译

---

## 🎨 UI Components

### shadcn/ui 组件（50+）
- **文件：** `src/components/ui/*.tsx`
- **状态：** ✅ 已实现
- **示例：** button, input, dialog, dropdown-menu, toast, skeleton, avatar, badge, card, tabs, switch, slider, progress, table, tooltip, popover, etc.

### 自定义组件
- **文件：** `src/components/*.tsx`
- **状态：** ✅ 已实现
- **示例：**
  - `Avatar.tsx` — 带首字母的头像
  - `Presence.tsx` — 在线/离线指示
  - `LinkPreview.tsx` — Open Graph 预览
  - `NavLink.tsx` — 动画导航
  - `ImageViewer.tsx` — 全屏查看
  - `SnowEffect.tsx` — 雪花效果
  - `LogoutModal.tsx` — 登出弹窗
  - `CookieBanner.tsx` — Cookie 同意条

### Layout 组件
- **文件：** `src/components/layout/*.tsx`
- **状态：** ✅ 已实现
- **示例：**
  - `AppLayout.tsx` — 主布局
  - `SidebarLeft.tsx` — 左侧栏（260px）
  - `SidebarRight.tsx` — 右侧栏（340px）

---

## 🔌 WebSocket Features

### 实时事件
- **文件：** `src/services/websocket.ts`
- **状态：** ✅ 已实现
- **事件：**
  - `new_post` — 新帖子
  - `post_resonance_updated` — 点赞更新
  - `new_comment` — 新评论
  - `new_message` — 新消息
  - `typing:update` — 输入状态
  - `chat:read_update` — 已读更新
  - `message:deleted` — 消息删除
  - `presence:update` — 在线状态
  - `chat:read_update`
  - `channel:new_message` — 频道消息

---

## 📊 Summary

| 分类 | 已实现 | 部分 | Placeholder | 总计 |
|------|--------|------|-------------|------|
| 页面 | 26 | 0 | 0 | 26 |
| 组件 | 60+ | 0 | 0 | 60+ |
| API endpoints | 40+ | 0 | 0 | 40+ |
| WebSocket 事件 | 12+ | 0 | 0 | 12+ |
| i18n 语言 | 2 | 0 | 0 | 2 |

**总体状态：** ✅ Production-ready

---

## 最近变更

### 已删除（2026-03-05）
- ❌ `/lume` 页面（LumeAI）— 已删除
- ❌ `/music` 页面 — 已删除
- ❌ `/api/lume/chat` API — 已删除
- ❌ `backend/src/lume/` 模块 — 已删除
- ❌ `lumeChatLimiter` 限流器 — 已删除

### 已变更
- ✅ 更新翻译（移除 LUME/Music 提及）
- ✅ 更新 SidebarLeft（移除 LUME AI、Music 按钮）
- ✅ 更新 App.tsx（移除路由）

---

## 相关文档

- [Error Handling](./ERROR_HANDLING.cn.md)
- [Groups Module](./GROUPS_MODULE.cn.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.cn.md)
