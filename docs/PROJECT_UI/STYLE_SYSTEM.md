п»ї??# LUME UI Style System

**пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ:** 9 пїЅпїЅпїЅпїЅпїЅ 2026 пїЅ.

---

## Р”РёР·Р°Р№РЅ-СЃРёСЃС‚РµРјР°

### Р¦РІРµС‚РѕРІР°СЏ РїР°Р»РёС‚СЂР°

**Background:**
- `bg-background` вЂ” РѕСЃРЅРѕРІРЅРѕР№ С„РѕРЅ
- `bg-white/5` вЂ” РїРѕР»СѓРїСЂРѕР·СЂР°С‡РЅС‹Р№ Р±РµР»С‹Р№ (5%)
- `bg-white/10` вЂ” РїРѕР»СѓРїСЂРѕР·СЂР°С‡РЅС‹Р№ Р±РµР»С‹Р№ (10%)
- `bg-white/15` вЂ” РїРѕР»СѓРїСЂРѕР·СЂР°С‡РЅС‹Р№ Р±РµР»С‹Р№ (15%)

**Text:**
- `text-white` вЂ” РѕСЃРЅРѕРІРЅРѕР№ С‚РµРєСЃС‚
- `text-white/80` вЂ” С‚РµРєСЃС‚ СЃ РїСЂРѕР·СЂР°С‡РЅРѕСЃС‚СЊСЋ 80%
- `text-white/60` вЂ” С‚РµРєСЃС‚ СЃ РїСЂРѕР·СЂР°С‡РЅРѕСЃС‚СЊСЋ 60%
- `text-secondary` вЂ” РІС‚РѕСЂРёС‡РЅС‹Р№ С‚РµРєСЃС‚ (СЃРµСЂС‹Р№)

**Borders:**
- `border-white/10` вЂ” РіСЂР°РЅРёС†С‹ СЃ РїСЂРѕР·СЂР°С‡РЅРѕСЃС‚СЊСЋ 10%
- `border-white/20` вЂ” РіСЂР°РЅРёС†С‹ СЃ РїСЂРѕР·СЂР°С‡РЅРѕСЃС‚СЊСЋ 20%

**Accent:**
- `text-red-200` вЂ” Р°РєС†РµРЅС‚РЅС‹Р№ РєСЂР°СЃРЅС‹Р№
- `border-red-500/30` вЂ” РєСЂР°СЃРЅР°СЏ РіСЂР°РЅРёС†Р°
- `bg-red-500/10` вЂ” РєСЂР°СЃРЅС‹Р№ С„РѕРЅ

---

## Glass СЌС„С„РµРєС‚

### Glass panel

**РљР»Р°СЃСЃ:** `glass-panel`

**РЎС‚РёР»Рё:**
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
}
```

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<div className="glass-panel px-6 py-5">
  {/* Content */}
</div>
```

### Glass input

**РљР»Р°СЃСЃ:** `glass-input`

**РЎС‚РёР»Рё:**
```css
.glass-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 22px;
  padding: 12px 16px;
  color: white;
}

.glass-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.2);
  ring: 2px solid rgba(255, 255, 255, 0.2);
}
```

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<input
  className="glass-input w-full"
  placeholder="Enter text..."
/>
```

---

## Rounded СЂР°Р·РјРµСЂС‹

| РљР»Р°СЃСЃ | Р—РЅР°С‡РµРЅРёРµ | РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ |
|-------|----------|---------------|
| `rounded-full` | 9999px | РђРІР°С‚Р°СЂС‹, РєРЅРѕРїРєРё |
| `rounded-2xl` | 16px | РљР°СЂС‚РѕС‡РєРё |
| `rounded-[28px]` | 28px | Р‘РѕР»СЊС€РёРµ РїР°РЅРµР»Рё |
| `rounded-[24px]` | 24px | РЎРѕРѕР±С‰РµРЅРёСЏ, РїСѓР·С‹СЂРё |
| `rounded-[22px]` | 22px | Input РїРѕР»СЏ |
| `rounded-[20px]` | 20px | РњР°Р»С‹Рµ СЌР»РµРјРµРЅС‚С‹ |
| `rounded-full` | 9999px | РљРЅРѕРїРєРё, Р°РІР°С‚Р°СЂС‹ |

---

## Typography

### РЁСЂРёС„С‚С‹

**РћСЃРЅРѕРІРЅРѕР№:**
- `font-sans` вЂ” СЃРёСЃС‚РµРјРЅС‹Р№ С€СЂРёС„С‚
- `font-mono` вЂ” РјРѕРЅРѕС€РёСЂРёРЅРЅС‹Р№ (username)

### Р Р°Р·РјРµСЂС‹ С‚РµРєСЃС‚Р°

| РљР»Р°СЃСЃ | Р Р°Р·РјРµСЂ | РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ |
|-------|--------|---------------|
| `text-xs` | 12px | Р’С‚РѕСЂРёС‡РЅС‹Р№ С‚РµРєСЃС‚, РїРѕРґРїРёСЃРё |
| `text-sm` | 14px | РћСЃРЅРѕРІРЅРѕР№ С‚РµРєСЃС‚ UI |
| `text-base` | 16px | РћСЃРЅРѕРІРЅРѕР№ РєРѕРЅС‚РµРЅС‚ |
| `text-lg` | 18px | Р—Р°РіРѕР»РѕРІРєРё СЂР°Р·РґРµР»РѕРІ |
| `text-xl` | 20px | Р—Р°РіРѕР»РѕРІРєРё |
| `text-2xl` | 24px | Р‘РѕР»СЊС€РёРµ Р·Р°РіРѕР»РѕРІРєРё |
| `text-3xl` | 30px | Hero Р·Р°РіРѕР»РѕРІРєРё |

### Font weight

| РљР»Р°СЃСЃ | Р—РЅР°С‡РµРЅРёРµ |
|-------|----------|
| `font-normal` | 400 |
| `font-medium` | 500 |
| `font-semibold` | 600 |
| `font-bold` | 700 |

### Letter spacing

| РљР»Р°СЃСЃ | Р—РЅР°С‡РµРЅРёРµ |
|-------|----------|
| `tracking-[0.3em]` | 0.3em | Р›РѕРіРѕС‚РёРї |
| `tracking-wide` | 0.025em | Р—Р°РіРѕР»РѕРІРєРё |

### Line height

| РљР»Р°СЃСЃ | Р—РЅР°С‡РµРЅРёРµ |
|-------|----------|
| `leading-relaxed` | 1.625 | РћСЃРЅРѕРІРЅРѕР№ С‚РµРєСЃС‚ |
| `leading-normal` | 1.5 | РЎС‚Р°РЅРґР°СЂС‚ |

---

## Spacing

### Padding

| РљР»Р°СЃСЃ | Р—РЅР°С‡РµРЅРёРµ |
|-------|----------|
| `px-2` | 8px |
| `px-3` | 12px |
| `px-4` | 16px |
| `px-6` | 24px |
| `px-9` | 36px |
| `py-2.5` | 10px |
| `py-3` | 12px |
| `py-4` | 16px |
| `py-5` | 20px |
| `py-6` | 24px |
| `py-9` | 36px |
| `py-12` | 48px |

### Gap

| РљР»Р°СЃСЃ | Р—РЅР°С‡РµРЅРёРµ |
|-------|----------|
| `gap-1` | 4px |
| `gap-2` | 8px |
| `gap-3` | 12px |
| `gap-4` | 16px |
| `gap-5` | 20px |
| `gap-6` | 24px |
| `gap-8` | 32px |

---

## РљРѕРјРїРѕРЅРµРЅС‚С‹ UI (shadcn/ui)

### Button

**Р¤Р°Р№Р»:** `src/components/ui/button.tsx`

**Variants:**
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
  }
);
```

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<Button variant="default" size="default">
  Click me
</Button>
```

---

### Dialog

**Р¤Р°Р№Р»:** `src/components/ui/dialog.tsx`

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

---

### Input

**Р¤Р°Р№Р»:** `src/components/ui/input.tsx`

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<Input
  type="email"
  placeholder="Enter email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

---

### Textarea

**Р¤Р°Р№Р»:** `src/components/ui/textarea.tsx`

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<Textarea
  placeholder="Type your message"
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  rows={4}
/>
```

---

### Avatar

**Р¤Р°Р№Р»:** `src/components/ui/avatar.tsx`

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<Avatar>
  <AvatarImage src={user.avatar} />
  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
</Avatar>
```

---

### Badge

**Р¤Р°Р№Р»:** `src/components/ui/badge.tsx`

**Variants:**
```typescript
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
      },
    },
  }
);
```

---

### Toast (Sonner)

**Р¤Р°Р№Р»:** `src/components/ui/sonner.tsx`

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```typescript
import { toast } from 'sonner';

toast.success("Success!");
toast.error("Error!");
toast.warning("Warning!");
toast.info("Info");
```

---

## РљР°СЃС‚РѕРјРЅС‹Рµ РєРѕРјРїРѕРЅРµРЅС‚С‹

### Avatar

**Р¤Р°Р№Р»:** `src/components/Avatar.tsx`

**Props:**
```typescript
interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<Avatar
  src={user.avatar}
  alt={user.name}
  fallback={user.name.charAt(0)}
  size="md"
/>
```

---

### Presence

**Р¤Р°Р№Р»:** `src/components/Presence.tsx`

**Props:**
```typescript
interface PresenceProps {
  isOnline: boolean;
  lastSeen?: Date;
  size?: 'sm' | 'md' | 'lg';
}
```

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<Presence isOnline={user.online} lastSeen={user.lastSeen} />
```

---

### LinkPreview

**Р¤Р°Р№Р»:** `src/components/LinkPreview.tsx`

**Props:**
```typescript
interface LinkPreviewProps {
  url: string;
  preview: LinkPreviewData;
}
```

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<LinkPreview url={url} preview={preview} />
```

---

### ImageViewer

**Р¤Р°Р№Р»:** `src/components/media/ImageViewer.tsx`

**Props:**
```typescript
interface ImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}
```

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<ImageViewer
  src={imageUrl}
  alt="Post image"
  onClose={() => setViewingImage(null)}
/>
```

---

### SnowEffect

**Р¤Р°Р№Р»:** `src/components/ui/SnowEffect.tsx`

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
{settings.showSnow && <SnowEffect />}
```

---

### LogoutModal

**Р¤Р°Р№Р»:** `src/components/ui/LogoutModal.tsx`

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<LogoutModal open={showModal} onOpenChange={setShowModal} />
```

---

## РђРЅРёРјР°С†РёРё (Framer Motion)

### Motion div

**РРјРїРѕСЂС‚:**
```typescript
import { motion } from "framer-motion";
```

**Р‘Р°Р·РѕРІРѕРµ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 10 }}
  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
>
  Content
</motion.div>
```

### Layout animations

**layoutId РґР»СЏ shared element transitions:**
```tsx
<motion.div
  className={`nav-item ${isActive ? 'active' : ''}`}
  layoutId="nav-active"
  transition={{ duration: 0.4 }}
>
  Nav Item
</motion.div>
```

### While hover/tap

```tsx
<motion.div
  whileHover={{ x: 2, scale: 1.01 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
>
  Button
</motion.div>
```

### AnimatePresence

**РРјРїРѕСЂС‚:**
```typescript
import { AnimatePresence } from "framer-motion";
```

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<AnimatePresence>
  {showPopover && (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
    >
      Popover Content
    </motion.div>
  )}
</AnimatePresence>
```

---

## Transition-smooth РєР»Р°СЃСЃ

**РћРїСЂРµРґРµР»РµРЅРёРµ:**
```css
.transition-smooth {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:**
```tsx
<div className="transition-smooth hover:bg-white/10">
  Hover me
</div>
```

---

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [Overview](./OVERVIEW.md) вЂ” РљР°СЂС‚Р° РїСЂРёР»РѕР¶РµРЅРёСЏ
- [Layout and Nav](./LAYOUT_AND_NAV.md) вЂ” Layout Рё РЅР°РІРёРіР°С†РёСЏ
- [Messages UI](./MESSAGES_UI.md) вЂ” UI СЃРѕРѕР±С‰РµРЅРёР№
- [Servers UI](./SERVERS_UI.md) вЂ” UI СЃРµСЂРІРµСЂРѕРІ

