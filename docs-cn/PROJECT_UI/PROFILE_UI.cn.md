# LUME 个人资料（Profile）UI

中文 | [Русский](../../docs-ru/PROJECT_UI/PROFILE_UI.ru.md) | [English](../../docs/PROJECT_UI/PROFILE_UI.md)

**最后更新：** 2026-03-11

---

## 概览

个人资料页面展示用户身份、统计数据与帖子。

**文件：**
- 我的资料：`src/pages/Profile.tsx`
- 用户资料：`src/pages/UserProfile.tsx`
- 组件：`src/components/profile/`

---

## 页面结构

```
Banner
Avatar + User info
Stats + Action buttons
Tabs (Posts / Media / Likes)
Posts feed
```

---

## Header

- 横幅图片（无图时渐变）
- 头像（自己的资料可上传）
- 姓名、用户名、简介、元信息

---

## 操作按钮

**我的资料：** Settings、Edit Profile

**他人资料：** Follow/Unfollow、Message

---

## 编辑资料弹窗

**文件：** `src/pages/Profile.tsx`

- Banner、name、bio、city、website

---

## 帖子列表

- Tabs：Posts / Media / Likes
- 置顶帖子显示
- Skeleton loading

---

## Follow 弹窗

**文件：** `src/components/profile/FollowModal.tsx`

- Followers / Following 列表
- Load more 分页

---

## Hooks

- `useProfile`
- `useUpdateProfile`
- `useFollow`
- `useUserPosts`

---

## 相关文档

- [Overview](./OVERVIEW.cn.md)
- [Style System](./STYLE_SYSTEM.cn.md)
- [Feed UI](./FEED_UI.cn.md)
