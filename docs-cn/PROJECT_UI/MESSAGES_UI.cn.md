# LUME 消息（Messages）UI

中文 | [Русский](../../docs-ru/PROJECT_UI/MESSAGES_UI.ru.md) | [English](../../docs/PROJECT_UI/MESSAGES_UI.md)

**最后更新：** 2026-03-11

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
Chat List（左）
Chat Panel（右）
```

---

## Chat list

**文件：** `src/pages/messages/components/ChatList.tsx`

- 搜索输入
- 聊天项 + 未读 badge

---

## Chat panel

**文件：** `src/pages/messages/components/ChatPanel.tsx`

- 头部：头像、名称、在线状态
- 消息列表
- 输入框

---

## 消息列表与气泡

**文件：** `src/pages/messages/components/MessageList.tsx`

- 支持回复与附件
- 自己的消息显示已读回执
- 输入状态
- 语音消息（录制 + 播放）
- “瞬间”消息（TTL + 已读跟踪）

---

## 输入框

**文件：** `src/pages/messages/components/MessageComposer.tsx`

- 回复条
- 附件
- 发送按钮
- Moment 开关（消失图片）
- 语音录制

---

## 状态

| 状态 | 行为 |
|------|------|
| Loading | Skeleton 列表 |
| Empty | “No chats yet” 占位 |
| Error | 重试按钮 |

---

## Hooks

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

## Moments（消失媒体）

- TTL 消失图片（24 小时）
- 打开 token 流：`POST /moments/:id/open` → 签名内容 URL
- 已读标记：`POST /moments/:id/viewed`
- 已查看后隐藏

---

## 语音消息

- 聊天输入框内录制 UI
- 消息气泡内播放 UI
- 上传接口：`POST /messages/voice`

---

## 相关文档

- [Overview](./OVERVIEW.cn.md)
- [Style System](./STYLE_SYSTEM.cn.md)
- [Groups UI](./GROUPS_UI.cn.md)
