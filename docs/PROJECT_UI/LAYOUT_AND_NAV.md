п»ї??# LUME Layout and Navigation

**пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ:** 9 пїЅпїЅпїЅпїЅпїЅ 2026 пїЅ.

---

## SidebarLeft

**Р¤Р°Р№Р»:** `src/components/layout/SidebarLeft.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<aside className="hidden h-screen w-[260px] shrink-0 flex-col gap-2 py-6 pr-6 lg:flex">
  {/* Logo */}
  <div className="mb-6 px-2">
    <Link to="/">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
          <span className="text-[10px] tracking-[0.3em] text-white/80">AURA</span>
        </div>
        <div>
          <h1 className="font-semibold text-lg tracking-[0.3em] text-white">LUME</h1>
        </div>
      </div>
    </Link>
  </div>

  {/* Navigation */}
  <nav className="flex flex-1 flex-col gap-1">
    {navItems.map((item) => (
      <NavLink to={item.to}>
        <motion.div
          className={`relative flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium ${
            isActive ? "bg-white/10 text-white" : "text-secondary hover:text-white"
          }`}
          whileHover={{ x: 2, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full bg-white/5"
              layoutId="nav-active"
            />
          )}
        </motion.div>
      </NavLink>
    ))}
  </nav>

  {/* User info */}
  <div className="relative" ref={popoverRef}>
    <button onClick={() => setShowPopover(!showPopover)}>
      <div className="flex items-center gap-3">
        <Avatar />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-secondary font-mono truncate">@{user.username}</p>
        </div>
        <ChevronUp />
      </div>
    </button>
    
    {/* Popover */}
    {showPopover && (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={handleSettings}>Settings</button>
        <button onClick={handleLogout}>Logout</button>
      </motion.div>
    )}
  </div>
</aside>
```

### РќР°РІРёРіР°С†РёРѕРЅРЅС‹Рµ СЌР»РµРјРµРЅС‚С‹

**РђРІС‚РѕСЂРёР·РѕРІР°РЅРЅС‹Р№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ:**
```typescript
const authNavItems = [
  { to: "/feed", icon: Home, label: "Р“Р»Р°РІРЅР°СЏ" },
  { to: "/explore", icon: Compass, label: "РџРѕРёСЃРє" },
  { to: "/messages", icon: MessageCircle, label: "РЎРѕРѕР±С‰РµРЅРёСЏ" },
  { to: "/servers", icon: Users, label: "РЎРµСЂРІРµСЂС‹" },
  { to: "/profile", icon: User, label: "РџСЂРѕС„РёР»СЊ" },
  { to: "/verified", icon: ShieldCheck, label: "Р’РµСЂРёС„РёРєР°С†РёСЏ" },
];
```

**РќРµР°РІС‚РѕСЂРёР·РѕРІР°РЅРЅС‹Р№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ:**
```typescript
const unauthNavItems = [
  { to: "/feed", icon: Home, label: "Р“Р»Р°РІРЅР°СЏ" },
  { to: "/explore", icon: Compass, label: "РџРѕРёСЃРє" },
  { to: "/login", icon: User, label: "Р’РѕР№С‚Рё" },
  { to: "/register", icon: User, label: "Р РµРіРёСЃС‚СЂР°С†РёСЏ" },
];
```

### Active state

**Р›РѕРіРёРєР°:**
```typescript
const isActive = location.pathname === item.to;
```

**РЎС‚РёР»Рё:**
- Active: `bg-white/10 text-white`
- Inactive: `text-secondary hover:text-white`

**РђРЅРёРјР°С†РёСЏ:**
- `layoutId="nav-active"` вЂ” РїР»Р°РІРЅС‹Р№ РїРµСЂРµС…РѕРґ С„РѕРЅР° РјРµР¶РґСѓ СЌР»РµРјРµРЅС‚Р°РјРё
- `whileHover={{ x: 2, scale: 1.01 }}` вЂ” СЃРјРµС‰РµРЅРёРµ РїСЂРё РЅР°РІРµРґРµРЅРёРё
- `transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}` вЂ” easing

### User popover

**РўСЂРёРіРіРµСЂ:** РљР»РёРє РїРѕ Р°РІР°С‚Р°СЂСѓ/РёРјРµРЅРё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ

**РЎРѕРґРµСЂР¶РёРјРѕРµ:**
- Settings (РїРµСЂРµС…РѕРґ РЅР° `/settings`)
- Logout (РѕС‚РєСЂС‹РІР°РµС‚ РјРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ)

**РђРЅРёРјР°С†РёСЏ РѕС‚РєСЂС‹С‚РёСЏ:**
```typescript
initial={{ opacity: 0, y: 10, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 10, scale: 0.95 }}
```

### Close outside

Popover Р·Р°РєСЂС‹РІР°РµС‚СЃСЏ РїСЂРё РєР»РёРєРµ РІРЅРµ РѕР±Р»Р°СЃС‚Рё:
```typescript
useEffect(() => {
  const handleClickOutside = (event) => {
    if (popoverRef.current && !popoverRef.current.contains(event.target)) {
      setShowPopover(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [showPopover]);
```

---

## SidebarRight

**Р¤Р°Р№Р»:** `src/components/layout/SidebarRight.tsx`

### РљРѕРіРґР° РїРѕРєР°Р·С‹РІР°РµС‚СЃСЏ

```typescript
const hideRightSidebar = pathname.startsWith("/messages");

// Р’ СЂРµРЅРґРµСЂРµ:
{!hideRightSidebar && <SidebarRight />}
```

**РЎРєСЂС‹С‚ РЅР°:**
- `/messages` вЂ” РјРµСЃСЃРµРЅРґР¶РµСЂ
- `/messages/:chatId` вЂ” С‡Р°С‚

**РџРѕРєР°Р·Р°РЅ РЅР°:**
- `/feed` вЂ” Activity feed
- `/explore` вЂ” Trends
- `/profile` вЂ” Profile info
- `/servers` вЂ” Server info
- Р’СЃРµ РѕСЃС‚Р°Р»СЊРЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<aside className="hidden h-screen w-[340px] shrink-0 flex-col gap-2 py-6 pl-6 lg:flex">
  {/* Content depends on current page */}
  <div className="flex-1 overflow-y-auto">
    {/* Page-specific content */}
  </div>
  
  {/* Help button */}
  <button className="fixed bottom-6 right-6 p-3 rounded-full bg-white/10">
    <HelpIcon />
  </button>
</aside>
```

---

## Main Content

### Container

**Р¤Р°Р№Р»:** `src/layouts/MainLayout.tsx`

```tsx
<main className={`
  flex-1 overflow-y-auto min-h-0 px-9
  ${hideRightSidebar ? "max-w-none" : "max-w-[640px]"}
`}>
  {children}
</main>
```

### РџР°СЂР°РјРµС‚СЂС‹

| РџР°СЂР°РјРµС‚СЂ | Р—РЅР°С‡РµРЅРёРµ | РћРїРёСЃР°РЅРёРµ |
|----------|----------|----------|
| Padding | `px-9` (36px) | Р“РѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅС‹Р№ padding |
| Max width (СЃ sidebar) | `max-w-[640px]` | РћРіСЂР°РЅРёС‡РµРЅРёРµ С€РёСЂРёРЅС‹ |
| Max width (Р±РµР· sidebar) | `max-w-none` | РќР° РІСЃСЋ РґРѕСЃС‚СѓРїРЅСѓСЋ С€РёСЂРёРЅСѓ |
| Scroll | `overflow-y-auto` | Р’РµСЂС‚РёРєР°Р»СЊРЅС‹Р№ СЃРєСЂРѕР»Р» |

### Grid layout

**РџРѕР»РЅС‹Р№ layout (СЃ РґРІСѓРјСЏ СЃР°Р№РґР±Р°СЂР°РјРё):**
```css
grid-template-columns: 280px minmax(720px, 1fr) 340px;
gap: 80px;
```

**Р‘РµР· РїСЂР°РІРѕРіРѕ СЃР°Р№РґР±Р°СЂР°:**
```css
grid-template-columns: 280px minmax(720px, 1fr);
gap: 80px;
```

### РђРґР°РїС‚РёРІРЅРѕСЃС‚СЊ

**<1400px:**
```css
gap: 64px;
right sidebar: 320px;
```

**<1280px:**
```css
right sidebar: hidden;
```

**<1024px:**
```css
left sidebar: 72px;
left sidebar: flex-col (С‚РѕР»СЊРєРѕ РёРєРѕРЅРєРё);
left sidebar span: hidden;
```

---

## AppLayout

**Р¤Р°Р№Р»:** `src/components/layout/AppLayout.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<div className="min-h-screen bg-background relative overflow-hidden">
  <div className="relative mx-auto w-full max-w-[1560px] px-9
    [&>div]:!grid [&>div]:grid-cols-[280px_minmax(720px,1fr)_340px]
    [&>div]:gap-[80px]">
    {children}
  </div>
</div>
```

### WebSocket РїРѕРґРєР»СЋС‡РµРЅРёРµ

```typescript
useEffect(() => {
  if (isAuthenticated() && user && token) {
    wsService.connect(user.id);
    return () => wsService.disconnect();
  }
}, [isAuthenticated, user, token]);
```

---

## LandingLayout

**Р¤Р°Р№Р»:** `src/layouts/LandingLayout.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<div className="min-h-screen bg-background">
  {/* Header */}
  <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur">
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <Logo />
        <nav>{/* Navigation */}</nav>
      </div>
    </div>
  </header>

  {/* Main */}
  <main className="pt-20">{children}</main>

  {/* Footer */}
  <footer className="py-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-4 gap-8">
        {/* Footer columns */}
      </div>
    </div>
  </footer>
</div>
```

---

## РќР°РІРёРіР°С†РёСЏ

### NavLink РєРѕРјРїРѕРЅРµРЅС‚

**Р¤Р°Р№Р»:** `src/components/NavLink.tsx`

**Props:**
```typescript
interface NavLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}
```

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<NavLink to="/feed" className="custom-class">
  <HomeIcon />
  <span>Home</span>
</NavLink>
```

---

## Home button behavior

**Р¤Р°Р№Р»:** `src/components/layout/SidebarLeft.tsx`

**Р›РѕРіРёРєР°:**
```typescript
const handleHomeClick = (e) => {
  e.preventDefault();
  if (location.pathname === "/feed") {
    // РЈР¶Рµ РЅР° РіР»Р°РІРЅРѕР№ вЂ” СЃРєСЂРѕР»Р» РІРІРµСЂС… + refresh
    const mainElement = document.querySelector('main.overflow-y-auto');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.dispatchEvent(new CustomEvent("refreshHome"));
  } else {
    // РќРµ РЅР° РіР»Р°РІРЅРѕР№ вЂ” РїРµСЂРµС…РѕРґ Рё СЃРєСЂРѕР»Р» РІРІРµСЂС…
    const mainElement = document.querySelector('main.overflow-y-auto');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: "smooth" });
    }
    navigate("/feed");
  }
};
```

---

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [Overview](./OVERVIEW.md) вЂ” РљР°СЂС‚Р° РїСЂРёР»РѕР¶РµРЅРёСЏ
- [Routes](./ROUTES.md) вЂ” РЎРїРёСЃРѕРє СЂРѕСѓС‚РѕРІ
- [Style System](./STYLE_SYSTEM.md) вЂ” UI СЃС‚РёР»СЊ

