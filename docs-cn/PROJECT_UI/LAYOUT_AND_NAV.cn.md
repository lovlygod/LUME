# LUME 布局与导航

中文 | [Русский](../../docs-ru/PROJECT_UI/LAYOUT_AND_NAV.ru.md) | [English](../../docs/PROJECT_UI/LAYOUT_AND_NAV.md)

**最后更新：** 2026-03-11

---

## SidebarLeft

**文件：** `src/components/layout/SidebarLeft.tsx`

### 结构

- Logo 与品牌区
- 导航列表
- 用户弹层（设置/退出）

### 导航项

**已登录：**
- Home, Explore, Messages, Servers, Profile, Verified

**未登录：**
- Home, Explore, Login, Register

### 激活态

- 激活：`bg-white/10 text-white`
- 未激活：`text-secondary hover:text-white`
- 使用 `layoutId="nav-active"` 的动画背景

---

## SidebarRight

**文件：** `src/components/layout/SidebarRight.tsx`

以下页面隐藏：
- `/messages`
- `/messages/:chatId`

以下页面显示：
- `/feed`, `/explore`, `/profile`, `/servers`

---

## 主内容容器

**文件：** `src/layouts/MainLayout.tsx`

- 内边距：`px-9`
- 宽度：带右侧栏时 `max-w-[640px]`，无右侧栏时 `max-w-none`
- 滚动：`overflow-y-auto`

---

## AppLayout

**文件：** `src/components/layout/AppLayout.tsx`

- 全局容器与网格布局
- 已登录用户会建立 WebSocket 连接

---

## LandingLayout

**文件：** `src/layouts/LandingLayout.tsx`

- 固定头部
- 公共内容区
- Footer 导航链接

---

## 导航工具

**NavLink 组件：** `src/components/NavLink.tsx`

**Home 按钮行为：**

- 若已在 `/feed`，滚动到顶部并刷新
- 否则跳转到 `/feed` 并滚动到顶部

---

## 相关文档

- [Overview](./OVERVIEW.cn.md)
- [Routes](./ROUTES.cn.md)
- [Style System](./STYLE_SYSTEM.cn.md)
