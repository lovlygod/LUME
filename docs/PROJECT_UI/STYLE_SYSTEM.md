# LUME UI Style System

English | [Русский](../../docs-ru/PROJECT_UI/STYLE_SYSTEM.ru.md) | [中文](../../docs-cn/PROJECT_UI/STYLE_SYSTEM.cn.md)

**Last updated:** 2026-03-11

---

## Design system

### Color palette

**Background:** `bg-background`, `bg-white/5`, `bg-white/10`, `bg-white/15`

**Text:** `text-white`, `text-white/80`, `text-white/60`, `text-secondary`

**Borders:** `border-white/10`, `border-white/20`

**Accent:** `text-red-200`, `border-red-500/30`, `bg-red-500/10`

---

## Glass effect

**Glass panel:** `glass-panel`

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
}
```

**Glass input:** `glass-input`

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
}
```

---

## Radius scale

| Class | Value | Usage |
|------|-------|-------|
| `rounded-full` | 9999px | Buttons, avatars |
| `rounded-2xl` | 16px | Cards |
| `rounded-[28px]` | 28px | Large panels |
| `rounded-[24px]` | 24px | Messages |
| `rounded-[22px]` | 22px | Inputs |
| `rounded-[20px]` | 20px | Small elements |

---

## Typography

**Fonts:** `font-sans` (default), `font-mono` (usernames)

**Text sizes:** `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`

**Weights:** `font-normal`, `font-medium`, `font-semibold`, `font-bold`

**Letter spacing:** `tracking-[0.3em]`, `tracking-wide`

---

## Spacing

**Padding:** `px-2`, `px-3`, `px-4`, `px-6`, `px-9`, `py-2.5`, `py-3`, `py-4`, `py-5`, `py-6`, `py-9`, `py-12`

**Gap:** `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-5`, `gap-6`, `gap-8`

---

## UI components (shadcn/ui)

- Button: `src/components/ui/button.tsx`
- Dialog: `src/components/ui/dialog.tsx`
- Input: `src/components/ui/input.tsx`
- Textarea: `src/components/ui/textarea.tsx`
- Avatar: `src/components/ui/avatar.tsx`
- Badge: `src/components/ui/badge.tsx`
- Toast: `src/components/ui/sonner.tsx`

---

## Custom components

- `src/components/Avatar.tsx`
- `src/components/Presence.tsx`
- `src/components/LinkPreview.tsx`
- `src/components/media/ImageViewer.tsx`
- `src/components/ui/LogoutModal.tsx`

---

## Motion

- Framer Motion for hover, tap, and layout transitions
- `layoutId="nav-active"` for active nav background
- `transition-smooth` utility class

---

## Related documents

- [Overview](./OVERVIEW.md)
- [Layout and Navigation](./LAYOUT_AND_NAV.md)
- [Messages UI](./MESSAGES_UI.md)
- [Groups UI](./GROUPS_UI.md)
