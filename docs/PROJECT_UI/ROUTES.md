п»ї??# LUME Routes

**пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ:** 9 пїЅпїЅпїЅпїЅпїЅ 2026 пїЅ.

---

## Р’СЃРµ СЂРѕСѓС‚С‹ РїСЂРёР»РѕР¶РµРЅРёСЏ

### Public routes (LandingLayout)

| Path | Component | Р¤Р°Р№Р» | РћРїРёСЃР°РЅРёРµ |
|------|-----------|------|----------|
| `/` | LandingPage | `src/pages/LandingPage.tsx` | Р“Р»Р°РІРЅР°СЏ СЃС‚СЂР°РЅРёС†Р° |
| `/faq` | FAQPage | `src/pages/FAQPage.tsx` | Р§Р°СЃС‚Рѕ Р·Р°РґР°РІР°РµРјС‹Рµ РІРѕРїСЂРѕСЃС‹ |
| `/rules` | RulesPage | `src/pages/RulesPage.tsx` | РџСЂР°РІРёР»Р° РїР»Р°С‚С„РѕСЂРјС‹ |
| `/support` | SupportPage | `src/pages/SupportPage.tsx` | РџРѕРґРґРµСЂР¶РєР° |
| `/status` | StatusPage | `src/pages/StatusPage.tsx` | РЎС‚Р°С‚СѓСЃ СЃРёСЃС‚РµРјС‹ |
| `/contacts` | ContactsPage | `src/pages/ContactsPage.tsx` | РљРѕРЅС‚Р°РєС‚С‹ |

### Public routes (MainLayout)

| Path | Component | Р¤Р°Р№Р» | РћРїС‹СЃР°РЅРёРµ |
|------|-----------|------|----------|
| `/privacy-policy` | PrivacyPolicy | `src/pages/PrivacyPolicy.tsx` | пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ |
| `/terms-of-service` | TermsOfService | `src/pages/TermsOfService.tsx` | пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ |
| `/cookie-policy` | CookiePolicy | `src/pages/CookiePolicy.tsx` | пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ cookies |

---

### App routes (ProtectedRoute + MainLayout)

#### Auth
| Path | Component | Р¤Р°Р№Р» | РћРїРёСЃР°РЅРёРµ |
|------|-----------|------|----------|
| `/login` | Login | `src/pages/auth/Login.tsx` | Р’С…РѕРґ |
| `/register` | Register | `src/pages/auth/Register.tsx` | Р РµРіРёСЃС‚СЂР°С†РёСЏ |

#### Main
| Path | Component | Р¤Р°Р№Р» | РћРїРёСЃР°РЅРёРµ |
|------|-----------|------|----------|
| `/feed` | Index | `src/pages/Index.tsx` | Р›РµРЅС‚Р° РїСѓР±Р»РёРєР°С†РёР№ |
| `/explore` | Explore | `src/pages/Explore.tsx` | РџРѕРёСЃРє Рё РѕР±Р·РѕСЂ |
| `/messages` | Messages | `src/pages/Messages.tsx` | РњРµСЃСЃРµРЅРґР¶РµСЂ (СЃРїРёСЃРѕРє С‡Р°С‚РѕРІ) |
| `/messages/:chatId` | Messages | `src/pages/Messages.tsx` | Р§Р°С‚ СЃ РїРѕР»СЊР·РѕРІР°С‚РµР»РµРј |

#### Servers
| Path | Component | Р¤Р°Р№Р» | РћРїРёСЃР°РЅРёРµ |
|------|-----------|------|----------|
| `/servers` | ServersPage | `src/pages/ServersPage.tsx` | РљР°С‚Р°Р»РѕРі СЃРµСЂРІРµСЂРѕРІ |
| `/server/:identifier` | ServerPage | `src/pages/ServerPage.tsx` | РЎС‚СЂР°РЅРёС†Р° СЃРµСЂРІРµСЂР° |
| `/server/:identifier/channel/:channelName` | ServerPage | `src/pages/ServerPage.tsx` | РљР°РЅР°Р» СЃРµСЂРІРµСЂР° |
| `/server/:identifier/settings` | ServerSettingsPage | `src/pages/ServerSettingsPage.tsx` | РќР°СЃС‚СЂРѕР№РєРё СЃРµСЂРІРµСЂР° |
| `/server/:identifier/members` | ServerMembersPage | `src/pages/ServerMembersPage.tsx` | РЈС‡Р°СЃС‚РЅРёРєРё СЃРµСЂРІРµСЂР° |

#### Profile
| Path | Component | Р¤Р°Р№Р» | РћРїРёСЃР°РЅРёРµ |
|------|-----------|------|----------|
| `/profile` | Profile | `src/pages/Profile.tsx` | РњРѕР№ РїСЂРѕС„РёР»СЊ |
| `/profile/:userId` | UserProfile | `src/pages/UserProfile.tsx` | РџСЂРѕС„РёР»СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ |

#### System
| Path | Component | Р¤Р°Р№Р» | РћРїРёСЃР°РЅРёРµ |
|------|-----------|------|----------|
| `/verified` | Verified | `src/pages/Verified.tsx` | Р’РµСЂРёС„РёРєР°С†РёСЏ |
| `/settings` | Settings | `src/pages/Settings.tsx` | РќР°СЃС‚СЂРѕР№РєРё Р°РєРєР°СѓРЅС‚Р° |
| `/settings/sessions` | SessionsPage | `src/pages/settings/SessionsPage.tsx` | пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ |
| `/admin` | AdminPanel | `src/pages/AdminPanel.tsx` | РђРґРјРёРЅ-РїР°РЅРµР»СЊ |
| `*` | NotFound | `src/pages/NotFound.tsx` | 404 Not Found |

---

## Р РѕСѓС‚С‹ РІ РєРѕРґРµ

**Р¤Р°Р№Р»:** `src/App.tsx`

```tsx
<Routes>
  {/* Public landing */}
  <Route path="/" element={<LandingLayout><LandingPage /></LandingLayout>} />
  <Route path="/faq" element={<FAQPage />} />
  <Route path="/rules" element={<RulesPage />} />
  <Route path="/support" element={<SupportPage />} />
  <Route path="/status" element={<StatusPage />} />
  <Route path="/contacts" element={<ContactsPage />} />

  {/* Public legal pages */}
  <Route element={<MainLayout />}>
    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    <Route path="/terms-of-service" element={<TermsOfService />} />
    <Route path="/cookie-policy" element={<CookiePolicy />} />
  </Route>

  {/* Guest-only */}
  <Route element={<GuestRoute />}>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
  </Route>

  {/* Protected */}
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

## Р›РѕРіРёРєР° conditional rendering

### Hide Right Sidebar

**Р¤Р°Р№Р»:** `src/layouts/MainLayout.tsx`

```typescript
const hideRightSidebar = pathname.startsWith("/messages");
```

**РљРѕРіРґР° СЃРєСЂС‹РІР°РµС‚СЃСЏ:**
- `/messages` вЂ” РјРµСЃСЃРµРЅРґР¶РµСЂ
- `/messages/:chatId` вЂ” С‡Р°С‚ СЃ РїРѕР»СЊР·РѕРІР°С‚РµР»РµРј

**РџСЂРёС‡РёРЅР°:** Р‘РѕР»СЊС€Рµ РјРµСЃС‚Р° РґР»СЏ РїРµСЂРµРїРёСЃРєРё

---

## Server routes

### Identifier

Server routes РёСЃРїРѕР»СЊР·СѓСЋС‚ `:identifier` РєРѕС‚РѕСЂС‹Р№ РјРѕР¶РµС‚ Р±С‹С‚СЊ:
- **Username** (РґР»СЏ РїСѓР±Р»РёС‡РЅС‹С… СЃРµСЂРІРµСЂРѕРІ) вЂ” РЅР°РїСЂРёРјРµСЂ, `gaminghub`
- **ID** (РґР»СЏ РїСЂРёРІР°С‚РЅС‹С… СЃРµСЂРІРµСЂРѕРІ) вЂ” РЅР°РїСЂРёРјРµСЂ, `123`

**РџСЂРёРјРµСЂС‹:**
- РџСѓР±Р»РёС‡РЅС‹Р№: `/server/gaminghub/channel/general`
- РџСЂРёРІР°С‚РЅС‹Р№: `/server/123/channel/general`

---

## Nested routes

### Messages
```
/messages
  в””в”Ђв”Ђ /:chatId  (MessagesPage, РїРѕРєР°Р·С‹РІР°РµС‚ С‡Р°С‚ СЃ РєРѕРЅРєСЂРµС‚РЅС‹Рј РїРѕР»СЊР·РѕРІР°С‚РµР»РµРј)
```

### Server
```
/server/:identifier
  в”њв”Ђв”Ђ /channel/:channelName  (С‡Р°С‚ РєР°РЅР°Р»Р°)
  в”њв”Ђв”Ђ /settings  (РЅР°СЃС‚СЂРѕР№РєРё СЃРµСЂРІРµСЂР°)
  в””в”Ђв”Ђ /members  (СѓС‡Р°СЃС‚РЅРёРєРё СЃРµСЂРІРµСЂР°)
```

---

## Protected routes

Р’СЃРµ routes РІ `ProtectedRoute` С‚СЂРµР±СѓСЋС‚ Р°РІС‚РѕСЂРёР·Р°С†РёРё. РџСЂРѕРІРµСЂРєР° РїСЂРѕРёСЃС…РѕРґРёС‚ РЅР° СѓСЂРѕРІРЅРµ:
1. **Frontend:** Redirect РЅР° `/login` РµСЃР»Рё РЅРµС‚ С‚РѕРєРµРЅР°
2. **Backend:** `authenticateToken` middleware РЅР° API endpoints

---

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [Overview](./OVERVIEW.md) вЂ” РљР°СЂС‚Р° РїСЂРёР»РѕР¶РµРЅРёСЏ
- [Layout and Nav](./LAYOUT_AND_NAV.md) вЂ” Layout Рё РЅР°РІРёРіР°С†РёСЏ
- [Features Inventory](../FEATURES_INVENTORY.md) вЂ” РЎРїРёСЃРѕРє С„СѓРЅРєС†РёР№
