# LUME Routes

English | [Русский](../../docs-ru/PROJECT_UI/ROUTES.ru.md) | [中文](../../docs-cn/PROJECT_UI/ROUTES.cn.md)

**Last updated:** 2026-03-11

---

## Public routes (LandingLayout)

| Path | Component | File | Description |
|------|-----------|------|-------------|
| `/` | LandingPage | `src/pages/LandingPage.tsx` | Landing page |
| `/faq` | FAQPage | `src/pages/FAQPage.tsx` | FAQ |
| `/rules` | RulesPage | `src/pages/RulesPage.tsx` | Platform rules |
| `/support` | SupportPage | `src/pages/SupportPage.tsx` | Support |
| `/status` | StatusPage | `src/pages/StatusPage.tsx` | System status |
| `/contacts` | ContactsPage | `src/pages/ContactsPage.tsx` | Contacts |

## Public routes (MainLayout)

| Path | Component | File | Description |
|------|-----------|------|-------------|
| `/privacy-policy` | PrivacyPolicy | `src/pages/PrivacyPolicy.tsx` | Privacy policy |
| `/terms-of-service` | TermsOfService | `src/pages/TermsOfService.tsx` | Terms of service |
| `/cookie-policy` | CookiePolicy | `src/pages/CookiePolicy.tsx` | Cookie policy |

---

## App routes (ProtectedRoute + MainLayout)

### Auth

| Path | Component | File | Description |
|------|-----------|------|-------------|
| `/login` | Login | `src/pages/auth/Login.tsx` | Login |
| `/register` | Register | `src/pages/auth/Register.tsx` | Register |

### Main

| Path | Component | File | Description |
|------|-----------|------|-------------|
| `/feed` | Index | `src/pages/Index.tsx` | Feed (supports `?post={id}` deep link) |
| `/explore` | Explore | `src/pages/Explore.tsx` | Explore |
| `/messages` | Messages | `src/pages/Messages.tsx` | Chat list |
| `/messages/:chatId` | Messages | `src/pages/Messages.tsx` | Chat view |
| `/messages?userId=:id` | Messages | `src/pages/Messages.tsx` | Open chat via query param |

### Servers

| Path | Component | File | Description |
|------|-----------|------|-------------|
| `/servers` | ServersPage | `src/pages/ServersPage.tsx` | Servers catalog |
| `/server/:identifier` | ServerPage | `src/pages/ServerPage.tsx` | Server page |
| `/server/:identifier/channel/:channelName` | ServerPage | `src/pages/ServerPage.tsx` | Channel chat |
| `/server/:identifier/settings` | ServerSettingsPage | `src/pages/ServerSettingsPage.tsx` | Settings |
| `/server/:identifier/members` | ServerMembersPage | `src/pages/ServerMembersPage.tsx` | Members |

### Profile

| Path | Component | File | Description |
|------|-----------|------|-------------|
| `/profile` | Profile | `src/pages/Profile.tsx` | My profile |
| `/profile/:userId` | UserProfile | `src/pages/UserProfile.tsx` | User profile |

### System

| Path | Component | File | Description |
|------|-----------|------|-------------|
| `/verified` | Verified | `src/pages/Verified.tsx` | Verification |
| `/settings` | Settings | `src/pages/Settings.tsx` | Settings |
| `/settings/sessions` | SessionsPage | `src/pages/settings/SessionsPage.tsx` | Sessions |
| `/admin` | AdminPanel | `src/pages/AdminPanel.tsx` | Admin panel |
| `*` | NotFound | `src/pages/NotFound.tsx` | 404 |

---

## Routes in code

**File:** `src/App.tsx`

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

## Conditional rendering

**Hide right sidebar:**

```typescript
const hideRightSidebar = pathname.startsWith("/messages");
```

---

## Nested routes

```
/messages/:chatId
/server/:identifier/channel/:channelName
/server/:identifier/settings
/server/:identifier/members
```

---

## Protected routes behavior

1. Frontend redirects to `/login` when no token is present.
2. Backend enforces `authenticateToken` on protected APIs.

---

## Related documents

- [Overview](./OVERVIEW.md)
- [Layout and Navigation](./LAYOUT_AND_NAV.md)
- [Features Inventory](../FEATURES_INVENTORY.md)
