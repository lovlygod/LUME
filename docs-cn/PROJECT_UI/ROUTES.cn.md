# LUME 路由

中文 | [Русский](../../docs-ru/PROJECT_UI/ROUTES.ru.md) | [English](../../docs/PROJECT_UI/ROUTES.md)

**最后更新：** 2026-03-16

---

## 公共路由（LandingLayout）

| 路径 | 组件 | 文件 | 说明 |
|------|------|------|------|
| `/` | LandingPage | `src/pages/LandingPage.tsx` | Landing 页面 |
| `/faq` | FAQPage | `src/pages/FAQPage.tsx` | FAQ |
| `/rules` | RulesPage | `src/pages/RulesPage.tsx` | 平台规则 |
| `/support` | SupportPage | `src/pages/SupportPage.tsx` | 支持 |
| `/status` | StatusPage | `src/pages/StatusPage.tsx` | 系统状态 |
| `/contacts` | ContactsPage | `src/pages/ContactsPage.tsx` | 联系方式 |

## 公共路由（MainLayout）

| 路径 | 组件 | 文件 | 说明 |
|------|------|------|------|
| `/privacy-policy` | PrivacyPolicy | `src/pages/PrivacyPolicy.tsx` | 隐私政策 |
| `/terms-of-service` | TermsOfService | `src/pages/TermsOfService.tsx` | 服务条款 |
| `/cookie-policy` | CookiePolicy | `src/pages/CookiePolicy.tsx` | Cookie 政策 |

---

## 应用路由（ProtectedRoute + MainLayout）

### 认证

| 路径 | 组件 | 文件 | 说明 |
|------|------|------|------|
| `/login` | Login | `src/pages/auth/Login.tsx` | 登录 |
| `/register` | Register | `src/pages/auth/Register.tsx` | 注册 |

### 主功能

| 路径 | 组件 | 文件 | 说明 |
|------|------|------|------|
| `/feed` | Index | `src/pages/Index.tsx` | Feed（支持 `?post={id}` 深链） |
| `/explore` | Explore | `src/pages/Explore.tsx` | Explore |
| `/messages` | Messages | `src/pages/Messages.tsx` | 聊天列表 |
| `/messages/:chatId` | Messages | `src/pages/Messages.tsx` | 聊天视图 |
| `/messages?userId=:id` | Messages | `src/pages/Messages.tsx` | 通过 query 参数打开聊天 |

### 服务器

| 路径 | 组件 | 文件 | 说明 |
|------|------|------|------|
| `/servers` | ServersPage | `src/pages/ServersPage.tsx` | 服务器目录 |
| `/server/:identifier` | ServerPage | `src/pages/ServerPage.tsx` | 服务器页面 |
| `/server/:identifier/channel/:channelName` | ServerPage | `src/pages/ServerPage.tsx` | 频道聊天 |
| `/server/:identifier/settings` | ServerSettingsPage | `src/pages/ServerSettingsPage.tsx` | 设置 |
| `/server/:identifier/members` | ServerMembersPage | `src/pages/ServerMembersPage.tsx` | 成员 |

### 个人资料

| 路径 | 组件 | 文件 | 说明 |
|------|------|------|------|
| `/profile` | Profile | `src/pages/Profile.tsx` | 我的资料 |
| `/profile/:userId` | UserProfile | `src/pages/UserProfile.tsx` | 用户资料 |

### 系统

| 路径 | 组件 | 文件 | 说明 |
|------|------|------|------|
| `/verified` | Verified | `src/pages/Verified.tsx` | 认证 |
| `/settings` | Settings | `src/pages/Settings.tsx` | 设置 |
| `/settings/sessions` | SessionsPage | `src/pages/settings/SessionsPage.tsx` | 会话 |
| `/admin` | AdminPanel | `src/pages/AdminPanel.tsx` | 管理面板 |
| `*` | NotFound | `src/pages/NotFound.tsx` | 404 |

---

## 代码中的路由

**文件：** `src/App.tsx`

```tsx
<Routes>
  <Route path="/" element={<LandingLayout><LandingPage /></LandingLayout>} />
  <Route path="/faq" element={<FAQPage />} />
  <Route path="/rules" element={<RulesPage />} />
  <Route path="/support" element={<SupportPage />} />
  <Route path="/status" element={<StatusPage />} />
  <Route path="/contacts" element={<ContactsPage />} />

  <Route element={<MainLayout />}>
    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    <Route path="/terms-of-service" element={<TermsOfService />} />
    <Route path="/cookie-policy" element={<CookiePolicy />} />
  </Route>

  <Route element={<GuestRoute />}>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
  </Route>

  <Route element={<ProtectedRoute />}>
    <Route path="/server/:identifier/channel/:channelName" element={<ServerPage />} />
    <Route path="/server/:identifier/settings" element={<ServerSettingsPage />} />
    <Route path="/server/:identifier/members" element={<ServerMembersPage />} />
    <Route path="/server/:identifier" element={<ServerPage />} />

    <Route element={<MainLayout />}>
      <Route path="/feed" element={<Index />} />
      <Route path="/servers" element={<ServersPage />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/messages/:chatId" element={<Messages />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:userId" element={<UserProfile />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/verified" element={<Verified />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/sessions" element={<SessionsPage />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Route>
  </Route>

  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## 条件渲染

**隐藏右侧栏：**

```typescript
const hideRightSidebar = pathname.startsWith("/messages");
```

---

## 嵌套路由

```
/messages/:chatId
/server/:identifier/channel/:channelName
/server/:identifier/settings
/server/:identifier/members
```

---

## 受保护路由行为

1. 前端无 token 时跳转到 `/login`。
2. 后端对受保护 API 强制 `authenticateToken`。

---

## 相关文档

- [Overview](./OVERVIEW.cn.md)
- [Layout and Navigation](./LAYOUT_AND_NAV.cn.md)
- [Features Inventory](../FEATURES_INVENTORY.cn.md)
