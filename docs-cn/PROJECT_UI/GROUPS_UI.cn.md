# LUME 群组与频道（Chats）UI

中文 | [Русский](../../docs-ru/PROJECT_UI/GROUPS_UI.ru.md) | [English](../../docs/PROJECT_UI/GROUPS_UI.md)

**最后更新：** 2026-03-19

---

## 概览

LUME 的群组/频道 UI 基于消息系统（Messages）。群组与频道是聊天类型（`group` / `channel`），统一在聊天列表、消息面板与设置弹窗中管理。

**文件：**
- 页面：`src/pages/Messages.tsx`, `src/pages/messages/MessagesPage.tsx`
- 组件：`src/pages/messages/components/`
- Hooks：`src/pages/messages/hooks/`
- API：`src/services/api.ts`（`getChats`, `createChat`, `getMessages`）

---

## 主要界面结构

```
MessagesPage
 ├─ ChatList（会话/群组/频道列表）
 ├─ ChatPanel（当前聊天）
 │   ├─ MessageList
 │   └─ MessageComposer
 └─ ChatSettingsModal / CreateChatModal
```

---

## 群组与频道列表（ChatList）

- 展示所有聊天条目：私聊、群组、频道。
- 支持筛选/搜索聊天。
- 点击条目进入 `/messages/:chatId`。
- 公开频道可通过“发现”入口或搜索加入（基于 `getPublicChannels`）。

---

## 聊天面板（ChatPanel）

**Header：** 标题、头像、成员数、设置入口。

**消息列表：** 文本、附件、语音、回复、时间戳。

**输入框：** 文本、附件、语音录制、回复栏。

---

## 创建与设置

### 创建聊天（CreateChatModal）

- 类型：`group` 或 `channel`
- 可配置名称、描述、公开 username（频道）
- 创建后加入聊天列表

### 设置面板（ChatSettingsModal）

- 编辑名称、描述、头像
- 管理成员与角色（owner/admin/member）
- 处理加入请求（公开频道）

---

## Hooks

- `useChats`：获取聊天列表
- `useChat`：当前聊天元信息
- `useChatMessages`：消息列表
- `useSendMessage`：发送消息
- `useChatWs`：WS 订阅/推送
- `useMarkRead`：已读上报

---

## WebSocket 事件

**发送：**
- `chat:subscribe`
- `chat:unsubscribe`
- `chat:read`

**接收：**
- `new_message`
- `channel:new_message`
- `chat:read_update`

---

## 相关文档

- [Overview](./OVERVIEW.cn.md)
- [Style System](./STYLE_SYSTEM.cn.md)
- [Messages UI](./MESSAGES_UI.cn.md)
- [Groups Module](../GROUPS_MODULE.cn.md)
