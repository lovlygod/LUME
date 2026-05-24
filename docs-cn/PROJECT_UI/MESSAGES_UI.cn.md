# LUME 消息（Messages）UI

中文 | [Русский](../../docs-ru/PROJECT_UI/MESSAGES_UI.ru.md) | [English](../../docs/PROJECT_UI/MESSAGES_UI.md)

**最后更新：** 2026-05-19

---

## 概览

Messages 提供实时的一对一私聊。

**文件：**
- 页面：`src/pages/Messages.tsx` → `src/pages/messages/MessagesPage.tsx`
- 组件：`src/pages/messages/components/`
- Hooks：`src/pages/messages/hooks/`

---

## 页面结构

```
聊天列表（左）
聊天面板（右）
```

---

## 聊天列表

**文件：** `src/pages/messages/components/ChatList.tsx`

- 搜索输入框
- 聊天项 + 未读计数 badge

---

## 聊天面板

**文件：** `src/pages/messages/components/ChatPanel.tsx`

- 头部：头像、名称、在线状态
- 消息列表
- 输入框

---

## 消息列表与气泡

**文件：** `src/pages/messages/components/MessageList.tsx`

- 支持回复与附件
- 自己的消息显示已读回执
- 输入状态指示器
- 语音消息（录制 + 播放）
- **NPM Package Preview** — 自动识别 `npm <package>` 命令

---

## NPM Package Preview（NPM 包预览）

**检测：** `src/utils/npmDetector.ts`

- 模式：`npm <package>`（例如 `npm react`、`npm express`、`npm @types/node`）
- 正则表达式：`/^npm\s+([@a-z0-9-/]+)/i`

**组件：** `src/components/npm/NpmPackageCard.tsx`

- Glass panel UI（毛玻璃面板）
- 显示：包名、版本、描述、npmjs.com 链接
- 加载时显示骨架屏
- 未找到包时显示 fallback

**后端：** `backend/src/npm.js`

- 接口：`GET /api/npm/:packageName`
- 请求：`https://registry.npmjs.org/:packageName`
- 返回：`{ name, version, description, url }`
- 内存缓存（15 分钟 TTL）

---

## 输入框

**文件：** `src/pages/messages/components/MessageComposer.tsx`

- 回复条
- 附件
- 发送按钮
- 语音录制

---

## 状态

| 状态 | 行为 |
|------|------|
| Loading | Skeleton 列表 |
| Empty | "暂无聊天" 占位 |
| Error | 重试按钮 |

---

## Hooks（钩子）

- `useChats`
- `useChatMessages`
- `useSendMessage`
- `useChatWs`

---

## WebSocket 事件

**发送：** `typing:start`, `chat:read`

**接收：** `new_message`, `typing:update`, `chat:read_update`

---

## 滚动行为

- 新消息自动滚动到底部
- 加载历史时保持滚动位置

---

## 语音消息

- 聊天输入框内录制 UI
- 消息气泡内播放 UI
- 上传接口：`POST /messages/voice`

---

## 消息多选

**文件：**
- 状态：`src/pages/messages/MessagesPage.tsx`（`selectedMessages` 状态）
- UI：选择消息时在消息列表上方显示工具栏
- 上下文菜单：`src/components/chat/MessageContextMenu.tsx`

### 功能

- **选择触发：** 点击消息仅在已处于多选模式时选择（首次选择操作后）
- **视觉反馈：** 选中的消息显示勾号（白色/20 背景，白色边框）
- **工具栏：** 出现在消息区域顶部，显示：选中数量 + 删除按钮 + 取消按钮
- **清除选择：** 切换聊天时自动清除（useEffect）

### 权限

| 聊天类型 | 角色 | 可用操作 |
|----------|------|----------|
| 私聊 | - | 选择、复制、仅为我删除、为所有人删除 |
| 群组 | - | 选择、复制、仅为我删除、为所有人删除（仅自己的消息） |
| 频道 | 参与者 | 仅复制 |
| 频道 | 管理员 | 回复、复制 |
| 频道 | 所有者 | 回复、选择、复制、为所有人删除 |

### 批量删除

- **接口：** `POST /api/chats/:chatId/messages/bulk-delete`
- **请求体：** `{ messageIds: string[], scope: "me" | "all" }`
- **限制：** 每次最多 100 条消息
- **PostgreSQL：** 使用 `ANY($1::bigint[])` 数组语法

### 翻译

新增键值到 `src/i18n/locales/`：
- `messages.select` — "选择"
- `messages.selected` — "已选择"
- `messages.deleteSelected` — "删除已选择"
- `messages.deleteSelectedForMe` — "仅为我删除"
- `messages.deleteSelectedForAll` — "为所有人删除"
- `messages.cancelSelection` — "取消选择"
- `messages.maxSelectionError` — "最多可以选择100条消息"

---

## 相关文档

- [Overview](./OVERVIEW.cn.md)
- [Style System](./STYLE_SYSTEM.cn.md)
- [Groups UI](./GROUPS_UI.cn.md)
