# LUME UI 样式系统

中文 | [Русский](../../docs-ru/PROJECT_UI/STYLE_SYSTEM.ru.md) | [English](../../docs/PROJECT_UI/STYLE_SYSTEM.md)

**最后更新：** 2026-03-11

---

## 设计系统

### 颜色

**背景：** `bg-background`, `bg-white/5`, `bg-white/10`, `bg-white/15`

**文本：** `text-white`, `text-white/80`, `text-white/60`, `text-secondary`

**边框：** `border-white/10`, `border-white/20`

**强调色：** `text-red-200`, `border-red-500/30`, `bg-red-500/10`

---

## 玻璃拟态

**Glass panel：** `glass-panel`

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
}
```

**Glass input：** `glass-input`

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

## 圆角尺度

| 类名 | 值 | 使用场景 |
|------|----|----------|
| `rounded-full` | 9999px | 按钮、头像 |
| `rounded-2xl` | 16px | 卡片 |
| `rounded-[28px]` | 28px | 大面板 |
| `rounded-[24px]` | 24px | 消息 |
| `rounded-[22px]` | 22px | 输入框 |
| `rounded-[20px]` | 20px | 小元素 |

---

## 排版

**字体：** `font-sans`（默认）, `font-mono`（用户名）

**字号：** `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`

**字重：** `font-normal`, `font-medium`, `font-semibold`, `font-bold`

**字距：** `tracking-[0.3em]`, `tracking-wide`

---

## 间距

**Padding：** `px-2`, `px-3`, `px-4`, `px-6`, `px-9`, `py-2.5`, `py-3`, `py-4`, `py-5`, `py-6`, `py-9`, `py-12`

**Gap：** `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-5`, `gap-6`, `gap-8`

---

## UI 组件（shadcn/ui）

- Button: `src/components/ui/button.tsx`
- Dialog: `src/components/ui/dialog.tsx`
- Input: `src/components/ui/input.tsx`
- Textarea: `src/components/ui/textarea.tsx`
- Avatar: `src/components/ui/avatar.tsx`
- Badge: `src/components/ui/badge.tsx`
- Toast: `src/components/ui/sonner.tsx`

---

## 自定义组件

- `src/components/Avatar.tsx`
- `src/components/Presence.tsx`
- `src/components/LinkPreview.tsx`
- `src/components/media/ImageViewer.tsx`
- `src/components/ui/LogoutModal.tsx`

---

## 动效

- Framer Motion 用于 hover、tap、布局过渡
- 使用 `layoutId="nav-active"` 处理导航激活背景
- `transition-smooth` 工具类

---

## 相关文档

- [Overview](./OVERVIEW.cn.md)
- [Layout and Navigation](./LAYOUT_AND_NAV.cn.md)
- [Messages UI](./MESSAGES_UI.cn.md)
- [Groups UI](./GROUPS_UI.cn.md)
