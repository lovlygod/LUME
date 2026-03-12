# LUME 服务器（Servers）UI

中文 | [Русский](../../docs-ru/PROJECT_UI/SERVERS_UI.ru.md) | [English](../../docs/PROJECT_UI/SERVERS_UI.md)

**最后更新：** 2026-03-11

---

## 概览

Servers UI 提供服务器发现、频道聊天和管理工具。

**文件：**
- 页面：`src/pages/ServersPage.tsx`, `src/pages/ServerPage.tsx`, `src/pages/ServerSettingsPage.tsx`, `src/pages/ServerMembersPage.tsx`
- 组件：`src/pages/server/components/`
- Hooks：`src/hooks/servers.ts`, `src/pages/server/hooks/`

---

## 服务器目录（Servers page）

- 头部：创建按钮、Discover 过滤、搜索
- Tabs：Discover / My Servers
- 服务器卡片网格

### 服务器卡片

- 图标 / 字母占位
- 名称、描述、成员数
- 操作：Join / Request Access / Open

---

## 服务器页面

```
ServerSidebar（频道 + 成员）
Channel Chat（Header、列表、输入框）
```

---

## ServerSidebar

- 频道列表与激活态
- 成员预览
- Owner/Admin 可见设置按钮

---

## 频道聊天

**Header：** 频道名 + 成员数 + 操作按钮

**消息列表：** 头像、名称、时间、内容、附件

**输入框：** 附件、reply bar、发送按钮

---

## 服务器设置

- 修改图标、名称、username（公开）、描述
- 删除服务器（owner）

---

## 服务器成员

- 搜索成员
- 角色分组
- 角色变更 / 踢人（基于权限）

---

## 创建服务器弹窗

- 类型：public/private
- 名称、username（public）、描述
- 可选图标上传

---

## Hooks

- `useMyServers` / `usePublicServers`
- `useServer`
- `useCreateServer`
- `useChannelMessages`
- `useSendChannelMessage`

---

## WebSocket 事件

**发送：** `server:subscribe`

**接收：**
- `channel:new_message`
- `server:member_joined`

---

## 相关文档

- [Overview](./OVERVIEW.cn.md)
- [Style System](./STYLE_SYSTEM.cn.md)
- [Messages UI](./MESSAGES_UI.cn.md)
- [Servers Module](../SERVERS_MODULE.cn.md)
