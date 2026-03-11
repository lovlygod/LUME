п»ї??# LUME Project UI Overview

**пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ:** 9 пїЅпїЅпїЅпїЅпїЅ 2026 пїЅ.

---

## РљР°СЂС‚Р° РїСЂРёР»РѕР¶РµРЅРёСЏ

### РћСЃРЅРѕРІРЅС‹Рµ СЂР°Р·РґРµР»С‹

```
LUME
в”њв”Ђв”Ђ Landing (РїСѓР±Р»РёС‡РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹)
в”‚   в”њв”Ђв”Ђ / вЂ” Р“Р»Р°РІРЅР°СЏ (LandingPage)
в”‚   в”њв”Ђв”Ђ /faq вЂ” FAQ
в”‚   в”њв”Ђв”Ђ /rules вЂ” РџСЂР°РІРёР»Р°
в”‚   в”њв”Ђв”Ђ /support вЂ” РџРѕРґРґРµСЂР¶РєР°
в”‚   в”њв”Ђв”Ђ /status вЂ” РЎС‚Р°С‚СѓСЃ СЃРёСЃС‚РµРјС‹
в”‚   в””в”Ђв”Ђ /contacts вЂ” РљРѕРЅС‚Р°РєС‚С‹
в”‚
в”њв”Ђв”Ђ App (РѕСЃРЅРѕРІРЅРѕРµ РїСЂРёР»РѕР¶РµРЅРёРµ)
в”‚   в”њв”Ђв”Ђ /feed вЂ” Р›РµРЅС‚Р° РїСѓР±Р»РёРєР°С†РёР№
в”‚   в”њв”Ђв”Ђ /explore вЂ” РџРѕРёСЃРє Рё РѕР±Р·РѕСЂ
в”‚   в”њв”Ђв”Ђ /messages вЂ” РњРµСЃСЃРµРЅРґР¶РµСЂ
в”‚   в”‚   в””в”Ђв”Ђ /messages/:chatId вЂ” Р§Р°С‚ СЃ РїРѕР»СЊР·РѕРІР°С‚РµР»РµРј
в”‚   в”њв”Ђв”Ђ /servers вЂ” РљР°С‚Р°Р»РѕРі СЃРµСЂРІРµСЂРѕРІ
в”‚   в”њв”Ђв”Ђ /server/:identifier вЂ” РЎС‚СЂР°РЅРёС†Р° СЃРµСЂРІРµСЂР°
в”‚   в”‚   в”њв”Ђв”Ђ /server/:identifier/channel/:channelName вЂ” РљР°РЅР°Р» СЃРµСЂРІРµСЂР°
в”‚   в”‚   в”њв”Ђв”Ђ /server/:identifier/settings вЂ” РќР°СЃС‚СЂРѕР№РєРё СЃРµСЂРІРµСЂР°
в”‚   в”‚   в””в”Ђв”Ђ /server/:identifier/members вЂ” РЈС‡Р°СЃС‚РЅРёРєРё СЃРµСЂРІРµСЂР°
в”‚   в”њв”Ђв”Ђ /profile вЂ” РњРѕР№ РїСЂРѕС„РёР»СЊ
в”‚   в”њв”Ђв”Ђ /profile/:userId вЂ” РџСЂРѕС„РёР»СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
в”‚   в”њв”Ђв”Ђ /verified вЂ” Р’РµСЂРёС„РёРєР°С†РёСЏ
в”‚   в”њв”Ђв”Ђ /settings вЂ” РќР°СЃС‚СЂРѕР№РєРё Р°РєРєР°СѓРЅС‚Р°
в”‚   в”њв”Ђв”Ђ /admin вЂ” РђРґРјРёРЅ-РїР°РЅРµР»СЊ
  в”‚   в”њв”Ђв”Ђ /login вЂ” Р’С…РѕРґ
  в”‚   в”њв”Ђв”Ђ /register вЂ” Р РµРіРёСЃС‚СЂР°С†РёСЏ
  в”‚   в”њв”Ђв”Ђ /settings/sessions вЂ” РЎРµСЃСЃРёРё
  в”‚   в”њв”Ђв”Ђ /privacy-policy вЂ” РџРѕР»РёС‚РёРєР° РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё
  в”‚   в”њв”Ђв”Ђ /terms-of-service вЂ” РЈСЃР»РѕРІРёСЏ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ
  в”‚   в””в”Ђв”Ђ /cookie-policy вЂ” РџРѕР»РёС‚РёРєР° cookies
в”‚
в””в”Ђв”Ђ System
    в””в”Ђв”Ђ * вЂ” 404 Not Found
```

---

## Layout'С‹

### LandingLayout
**Р¤Р°Р№Р»:** `src/layouts/LandingLayout.tsx`

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
- `/` вЂ” Р“Р»Р°РІРЅР°СЏ СЃС‚СЂР°РЅРёС†Р°
- `/faq`, `/rules`, `/support`, `/status`, `/contacts` вЂ” РРЅС„РѕСЂРјР°С†РёРѕРЅРЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
- Header СЃ Р»РѕРіРѕС‚РёРїРѕРј Рё РЅР°РІРёРіР°С†РёРµР№
- Main content area
- Footer СЃ СЃСЃС‹Р»РєР°РјРё Рё copyright

**РћСЃРѕР±РµРЅРЅРѕСЃС‚Рё:**
- РќРµС‚ СЃР°Р№РґР±Р°СЂРѕРІ
- РџРѕР»РЅРѕС€РёСЂРёРЅРЅС‹Р№ РєРѕРЅС‚РµРЅС‚
- РџСѓР±Р»РёС‡РЅС‹Р№ РґРѕСЃС‚СѓРї (РЅРµ С‚СЂРµР±СѓРµС‚ Р°РІС‚РѕСЂРёР·Р°С†РёРё)

---

### AppLayout
**Р¤Р°Р№Р»:** `src/components/layout/AppLayout.tsx`

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
- Р’СЃРµ СЃС‚СЂР°РЅРёС†С‹ РїСЂРёР»РѕР¶РµРЅРёСЏ РїРѕСЃР»Рµ Р°РІС‚РѕСЂРёР·Р°С†РёРё

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
```
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚  SidebarLeft (260px)  в”‚  Main Content  в”‚ SidebarRight  в”‚
в”‚                       в”‚   (scrollable) в”‚   (340px)     в”‚
в”‚                       в”‚                в”‚               в”‚
в”‚   Navigation          в”‚   Page Content в”‚   Activity    в”‚
в”‚   Menu                в”‚                в”‚   Feed        в”‚
в”‚                       в”‚                в”‚               в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
```

**РљРѕРЅС‚РµР№РЅРµСЂ:**
- Max width: 1560px (СЃ РґРІСѓРјСЏ СЃР°Р№РґР±Р°СЂР°РјРё)
- Max width: 640px (Р±РµР· РїСЂР°РІРѕРіРѕ СЃР°Р№РґР±Р°СЂР°)
- Padding: 36px (px-9)

**Grid layout:**
```css
grid-template-columns: 280px minmax(720px, 1fr) 340px;
gap: 80px;
```

**РђРґР°РїС‚РёРІРЅРѕСЃС‚СЊ:**
- <1400px: gap 64px, right sidebar 320px
- <1280px: right sidebar СЃРєСЂС‹С‚
- <1024px: left sidebar 72px (РёРєРѕРЅРєРё)

---

## РЎР°Р№РґР±Р°СЂС‹

### SidebarLeft
**Р¤Р°Р№Р»:** `src/components/layout/SidebarLeft.tsx`

**РЁРёСЂРёРЅР°:** 260px (fixed)

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
1. **Logo** вЂ” AURA LUME branding
2. **Navigation menu** вЂ” РѕСЃРЅРѕРІРЅС‹Рµ РїСѓРЅРєС‚С‹
3. **User info** вЂ” РїСЂРѕС„РёР»СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ СЃ popover

**РџСѓРЅРєС‚С‹ РјРµРЅСЋ (Р°РІС‚РѕСЂРёР·РѕРІР°РЅ):**
| РРєРѕРЅРєР° | РўРµРєСЃС‚ | РњР°СЂС€СЂСѓС‚ |
|--------|-------|---------|
| рџЏ  Home | Р“Р»Р°РІРЅР°СЏ | `/feed` |
| рџ§­ Explore | РџРѕРёСЃРє | `/explore` |
| рџ’¬ Messages | РЎРѕРѕР±С‰РµРЅРёСЏ | `/messages` |
| рџ‘Ґ Servers | РЎРµСЂРІРµСЂС‹ | `/servers` |
| рџ‘¤ Profile | РџСЂРѕС„РёР»СЊ | `/profile` |
| вњ… Verified | Р’РµСЂРёС„РёРєР°С†РёСЏ | `/verified` |

**РџСѓРЅРєС‚С‹ РјРµРЅСЋ (РЅРµ Р°РІС‚РѕСЂРёР·РѕРІР°РЅ):**
| РРєРѕРЅРєР° | РўРµРєСЃС‚ | РњР°СЂС€СЂСѓС‚ |
|--------|-------|---------|
| рџЏ  Home | Р“Р»Р°РІРЅР°СЏ | `/feed` |
| рџ§­ Explore | РџРѕРёСЃРє | `/explore` |
| рџ”‘ Login | Р’РѕР№С‚Рё | `/login` |
| рџ“ќ Register | Р РµРіРёСЃС‚СЂР°С†РёСЏ | `/register` |

**Active state:**
- РџРѕРґСЃРІРµС‚РєР° С‚РµРєСѓС‰РµРіРѕ СЂР°Р·РґРµР»Р°
- РђРЅРёРјР°С†РёСЏ РїРµСЂРµС…РѕРґР° (framer-motion)
- LayoutId РґР»СЏ РїР»Р°РІРЅРѕРіРѕ РїРµСЂРµС…РѕРґР° С„РѕРЅР°

**User popover:**
- РљР»РёРє РїРѕ Р°РІР°С‚Р°СЂСѓ РѕС‚РєСЂС‹РІР°РµС‚ popover
- РљРЅРѕРїРєРё: Settings, Logout
- РћС‚РѕР±СЂР°Р¶РµРЅРёРµ РёРјРµРЅРё, username, verified badge

---

### SidebarRight
**Р¤Р°Р№Р»:** `src/components/layout/SidebarRight.tsx`

**РЁРёСЂРёРЅР°:** 340px (fixed)

**РљРѕРіРґР° РїРѕРєР°Р·С‹РІР°РµС‚СЃСЏ:**
- вњ… `/feed` вЂ” Activity feed
- вњ… `/explore` вЂ” Trends, СЂРµРєРѕРјРµРЅРґР°С†РёРё
- вњ… `/profile` вЂ” РРЅС„РѕСЂРјР°С†РёСЏ РїСЂРѕС„РёР»СЏ
- вњ… `/servers` вЂ” РРЅС„РѕСЂРјР°С†РёСЏ Рѕ СЃРµСЂРІРµСЂР°С…
- вќЊ `/messages` вЂ” СЃРєСЂС‹С‚ (Р±РѕР»СЊС€Рµ РјРµСЃС‚Р° РґР»СЏ С‡Р°С‚Р°)
- вќЊ `/server/:id/channel/:name` вЂ” СЃРєСЂС‹С‚

**РЎРѕРґРµСЂР¶РёРјРѕРµ:**
- Р—Р°РіРѕР»РѕРІРѕРє СЂР°Р·РґРµР»Р°
- РљРѕРЅС‚РµРЅС‚ (Р·Р°РІРёСЃРёС‚ РѕС‚ СЃС‚СЂР°РЅРёС†С‹)
- Help button (bottom right)

---

## Main Container

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
```tsx
<main className={`
  flex-1 overflow-y-auto min-h-0 px-9
  ${hideRightSidebar ? "max-w-none" : "max-w-[640px]"}
`}>
  {/* Page content */}
</main>
```

**РџР°СЂР°РјРµС‚СЂС‹:**
- Padding: 36px (px-9)
- Max width: 640px (СЃ РїСЂР°РІС‹Рј СЃР°Р№РґР±Р°СЂРѕРј)
- Max width: none (Р±РµР· РїСЂР°РІРѕРіРѕ СЃР°Р№РґР±Р°СЂР°)
- Scroll: vertical (overflow-y-auto)

---

## РќР°РІРёРіР°С†РёСЏ РјРµР¶РґСѓ СЂР°Р·РґРµР»Р°РјРё

### РџРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёР№ flow

```
Landing (/) 
  в†“ (Login)
Login (/login)
  в†“
Feed (/feed)
  в”њв”Ђв†’ Explore (/explore)
  в”њв”Ђв†’ Messages (/messages)
  в”‚     в””в”Ђв†’ Chat (/messages/:chatId)
  в”њв”Ђв†’ Servers (/servers)
  в”‚     в”њв”Ђв†’ Server (/server/:id)
  в”‚     в”‚     в”њв”Ђв†’ Channel (/server/:id/channel/:name)
  в”‚     в”‚     в”њв”Ђв†’ Settings (/server/:id/settings)
  в”‚     в”‚     в””в”Ђв†’ Members (/server/:id/members)
  в”њв”Ђв†’ Profile (/profile)
  в”‚     в””в”Ђв†’ User Profile (/profile/:userId)
  в”њв”Ђв†’ Verified (/verified)
  в”њв”Ђв†’ Settings (/settings)
  в””в”Ђв†’ Admin (/admin)
```

---

## РљРѕРјРїРѕРЅРµРЅС‚С‹ СЃС‚СЂР°РЅРёС†

### РЎС‚СЂР°РЅРёС†С‹ РїСЂРёР»РѕР¶РµРЅРёСЏ

| РЎС‚СЂР°РЅРёС†Р° | Р¤Р°Р№Р» | Layout |
|----------|------|--------|
| Feed | `src/pages/Index.tsx` | AppLayout |
| Explore | `src/pages/Explore.tsx` | AppLayout |
| Messages | `src/pages/Messages.tsx` | AppLayout |
| Servers | `src/pages/ServersPage.tsx` | AppLayout |
| Server | `src/pages/ServerPage.tsx` | AppLayout |
| Server Settings | `src/pages/ServerSettingsPage.tsx` | AppLayout |
| Server Members | `src/pages/ServerMembersPage.tsx` | AppLayout |
| Profile | `src/pages/Profile.tsx` | AppLayout |
| User Profile | `src/pages/UserProfile.tsx` | AppLayout |
| Verified | `src/pages/Verified.tsx` | AppLayout |
| Settings | `src/pages/Settings.tsx` | AppLayout |
| Sessions | `src/pages/settings/SessionsPage.tsx` | AppLayout |
| Admin | `src/pages/AdminPanel.tsx` | AppLayout |
| Login | `src/pages/auth/Login.tsx` | AppLayout |
| Register | `src/pages/auth/Register.tsx` | AppLayout |
| Privacy Policy | `src/pages/PrivacyPolicy.tsx` | AppLayout |
| Terms of Service | `src/pages/TermsOfService.tsx` | AppLayout |
| Cookie Policy | `src/pages/CookiePolicy.tsx` | AppLayout |
| Landing | `src/pages/LandingPage.tsx` | LandingLayout |
| FAQ | `src/pages/FAQPage.tsx` | LandingLayout |
| Rules | `src/pages/RulesPage.tsx` | LandingLayout |
| Support | `src/pages/SupportPage.tsx` | LandingLayout |
| Status | `src/pages/StatusPage.tsx` | LandingLayout |
| Contacts | `src/pages/ContactsPage.tsx` | LandingLayout |
| 404 | `src/pages/NotFound.tsx` | AppLayout |

---

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [Routes](./ROUTES.md) вЂ” РџРѕР»РЅС‹Р№ СЃРїРёСЃРѕРє СЂРѕСѓС‚РѕРІ
- [Layout and Nav](./LAYOUT_AND_NAV.md) вЂ” Р”РµС‚Р°Р»Рё layout Рё РЅР°РІРёРіР°С†РёРё
- [Style System](./STYLE_SYSTEM.md) вЂ” UI СЃС‚РёР»СЊ Рё РєРѕРјРїРѕРЅРµРЅС‚С‹
- [Features Inventory](../FEATURES_INVENTORY.md) вЂ” РЎРїРёСЃРѕРє С„СѓРЅРєС†РёР№

