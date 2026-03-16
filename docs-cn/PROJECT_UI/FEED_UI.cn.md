# LUME 动态（Feed）UI

中文 | [Русский](../../docs-ru/PROJECT_UI/FEED_UI.ru.md) | [English](../../docs/PROJECT_UI/FEED_UI.md)

**最后更新：** 2026-03-16

---

## 概览

Feed 是用户阅读与发布帖子的信息流。

**文件：**
- 页面：`src/pages/Index.tsx`
- 组件：`src/components/feed/`, `src/components/post/`
- Hooks：`src/hooks/`

---

## 页面结构

```
Feed Header
Post Composer
Posts Feed
```

---

## Feed header

**文件：** `src/components/feed/FeedHeader.tsx`

- Tab 切换：For You / Following
- 刷新按钮
- 新帖子提示

---

## Post composer

**文件：** `src/components/feed/PostComposer.tsx`

- 文本输入
- 图片上传预览
- 操作：图片、表情、投票
- 发布按钮与字数计数

---

## Post 组件

**文件：** `src/components/post/Post.tsx`

- 头部：作者、用户名、时间、菜单
- 内容：文本、图片、链接预览
- 操作：reply、repost、resonance、share

---

## 状态

| 状态 | 行为 |
|------|------|
| Loading | Skeleton 卡片 |
| Empty | “No posts yet” 占位 |
| Error | 重试按钮 |

---

## Hooks

- `usePosts`（recommended/following）
- `useCreatePost`
- `useResonance`

---

## WebSocket 事件

- `new_post` → 增加 `newPostsCount`
- `post_resonance_updated` → 更新缓存中的计数
- `new_comment` → 更新评论缓存

---

## 深链（通知跳转）

Feed 支持通过 query 参数从通知跳转并定位到指定帖子：

- `/feed?post={postId}` → 滚动到帖子并短暂高亮。
- `/feed?post={postId}&comment={commentId}` → 评论相关通知使用相同逻辑。

**实现位置：** `src/pages/Index.tsx`（解析 query + 滚动/高亮）。

---

## 图片查看器

**文件：** `src/components/media/ImageViewer.tsx`

用于全屏预览帖子图片。

---

## 相关文档

- [Overview](./OVERVIEW.cn.md)
- [Style System](./STYLE_SYSTEM.cn.md)
- [Profile UI](./PROFILE_UI.cn.md)
