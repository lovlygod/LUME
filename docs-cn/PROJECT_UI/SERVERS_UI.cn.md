# LUME 群组（Groups）UI

中文 | [Русский](../../docs-ru/PROJECT_UI/GROUPS_UI.ru.md) | [English](../../docs/PROJECT_UI/GROUPS_UI.md)

**最后更新：** 2026-03-11

---

## 概览

Groups UI 提供群组发现、频道聊天和管理工具。

**文件：**
- 页面：`src/pages/GroupsPage.tsx`, `src/pages/GroupPage.tsx`, `src/pages/GroupSettingsPage.tsx`, `src/pages/GroupMembersPage.tsx`
- 组件：`src/pages/group/components/`
- Hooks：`src/hooks/groups.ts`, `src/pages/group/hooks/`

---

## 群组目录（Groups page）

- 头部：创建按钮、Discover 过滤、搜索
- Tabs：Discover / My Groups
- 群组卡片网格

### 群组卡片

- 图标 / 字母占位
- 名称、描述、成员数
- 操作：Join / Request Access / Open

---

## 群组页面

```
GroupSidebar（频道 + 成员）
Channel Chat（Header、列表、输入框）
```

---

## GroupSidebar

- 频道列表与激活态
- 成员预览
- Owner/Admin 可见设置按钮

---

## 频道聊天

**Header：** 频道名 + 成员数 + 操作按钮

**消息列表：** 头像、名称、时间、内容、附件

**输入框：** 附件、reply bar、发送按钮

---

## 群组设置

- 修改图标、名称、username（公开）、描述
- 删除群组（owner）

---

## 群组成员

- 搜索成员
- 角色分组
- 角色变更 / 踢人（基于权限）

---

## 创建群组弹窗

- 类型：public/private
- 名称、username（public）、描述
- 可选图标上传

---

## Hooks

- `useMyGroups` / `usePublicGroups`
- `useGroup`
- `useCreateGroup`
- `useChannelMessages`
- `useSendChannelMessage`

---

## WebSocket 事件

**发送：** `group:subscribe`

**接收：**
- `channel:new_message`
- `group:member_joined`

---

## 相关文档

- [Overview](./OVERVIEW.cn.md)
- [Style System](./STYLE_SYSTEM.cn.md)
- [Messages UI](./MESSAGES_UI.cn.md)
- [Groups Module](../GROUPS_MODULE.cn.md)
