п»ї??# LUME Feed UI

**пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ:** 9 пїЅпїЅпїЅпїЅпїЅ 2026 пїЅ.

---

## РћР±Р·РѕСЂ

Р›РµРЅС‚Р° РїСѓР±Р»РёРєР°С†РёР№ (Feed) вЂ” СЌС‚Рѕ РіР»Р°РІРЅР°СЏ СЃС‚СЂР°РЅРёС†Р° РїСЂРёР»РѕР¶РµРЅРёСЏ СЃ РїРѕСЃС‚Р°РјРё РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.

**Р¤Р°Р№Р»С‹:**
- РЎС‚СЂР°РЅРёС†Р°: `src/pages/Index.tsx`
- РљРѕРјРїРѕРЅРµРЅС‚С‹: `src/components/feed/`, `src/components/post/`
- РҐСѓРєРё: `src/hooks/`

---

## РЎС‚СЂСѓРєС‚СѓСЂР° СЃС‚СЂР°РЅРёС†С‹

```
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚  Feed Header                                        в”‚
в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ  в”‚
в”‚  в”‚ [For You в–ј]  [Refresh]                        в”‚  в”‚
в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”  в”‚
в”‚                                                     в”‚
в”‚  Post Composer                                      в”‚
в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ  в”‚
в”‚  в”‚ [Avatar]  [What's happening?]                 в”‚  в”‚
в”‚  в”‚            [Image] [Poll] [Emoji]    [Post]   в”‚  в”‚
в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”  в”‚
в”‚                                                     в”‚
в”‚  Posts Feed                                         в”‚
в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ  в”‚
в”‚  в”‚ [Avatar]  User Name  В·  2h         [В·В·В·]     в”‚  в”‚
в”‚  в”‚           @username  [Verified]               в”‚  в”‚
в”‚  в”‚                                               в”‚  в”‚
в”‚  в”‚           Post text content here...           в”‚  в”‚
в”‚  в”‚                                               в”‚  в”‚
в”‚  в”‚           [Image Preview]                     в”‚  в”‚
в”‚  в”‚                                               в”‚  в”‚
в”‚  в”‚           [Reply] [Repost] [Resonance] [Share]в”‚  в”‚
в”‚  в”‚           12      5         42        [в†’]     в”‚  в”‚
в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”  в”‚
в”‚                                                     в”‚
в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ  в”‚
в”‚  в”‚ ... (more posts)                              в”‚  в”‚
в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”  в”‚
в”‚                                                     в”‚
в”‚  [Load More / End of Feed]                          в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
```

---

## Feed Header

**Р¤Р°Р№Р»:** `src/components/feed/FeedHeader.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<div className="mb-6">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold">Feed</h1>
    
    <div className="flex items-center gap-3">
      {/* Tab selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {tab === 'for-you' ? 'For You' : 'Following'}
            <ChevronDownIcon className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setTab('for-you')}>
            <SparklesIcon className="h-4 w-4 mr-2" />
            For You
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTab('following')}>
            <UserIcon className="h-4 w-4 mr-2" />
            Following
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Refresh button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  </div>

  {/* New posts notification */}
  {newPostsCount > 0 && (
    <motion.button
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      className="mt-3 w-full py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium"
      onClick={handleShowNewPosts}
    >
      Show {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'}
    </motion.button>
  )}
</div>
```

---

## Post Composer

**Р¤Р°Р№Р»:** `src/components/feed/PostComposer.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-[24px]">
  <div className="flex gap-4">
    {/* Avatar */}
    <Avatar src={user.avatar} fallback={user.name.charAt(0)} className="w-10 h-10" />

    {/* Input area */}
    <div className="flex-1">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's happening?"
        rows={3}
        className="w-full resize-none bg-transparent border-none focus:ring-0 text-base"
      />

      {/* Image preview */}
      {image && (
        <div className="mt-3 relative inline-block">
          <img src={URL.createObjectURL(image)} alt="Preview" className="rounded-xl max-h-64 object-cover" />
          <button
            onClick={() => setImage(null)}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()}>
            <ImageIcon className="h-5 w-5" />
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          <Button variant="ghost" size="icon">
            <EmojiIcon className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <PollIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-sm ${text.length > 420 ? 'text-red-400' : 'text-secondary'}`}>
            {text.length}/420
          </span>
          <Button
            onClick={handlePost}
            disabled={!text.trim() || isPosting}
            className="btn-glass"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## Post Component

**Р¤Р°Р№Р»:** `src/components/post/Post.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<article className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-[24px] hover:bg-white/[0.07] transition-smooth">
  <div className="flex gap-4">
    {/* Avatar */}
    <Avatar
      src={post.author.avatar}
      fallback={post.author.name.charAt(0)}
      className="w-10 h-10 cursor-pointer"
      onClick={() => navigate(`/profile/${post.author.id}`)}
    />

    {/* Content */}
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold cursor-pointer hover:underline"
            onClick={() => navigate(`/profile/${post.author.id}`)}
          >
            {post.author.name}
          </span>
          {post.author.verified && <VerifiedBadge className="h-4 w-4" />}
          <span className="text-sm text-secondary">@{post.author.username}</span>
          <span className="text-sm text-secondary">В·</span>
          <span className="text-sm text-secondary">{formatTimeAgo(post.timestamp)}</span>
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontalIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handlePin()}>
              <PinIcon className="h-4 w-4 mr-2" />
              Pin post
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleReport()}>
              <FlagIcon className="h-4 w-4 mr-2" />
              Report
            </DropdownMenuItem>
            {isOwn && (
              <DropdownMenuItem onClick={() => handleDelete()}>
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Text */}
      <p className="mt-2 text-base leading-relaxed whitespace-pre-wrap">
        {formatLinks(post.text)}
      </p>

      {/* Image */}
      {post.imageUrl && (
        <div className="mt-3">
          <img
            src={post.imageUrl}
            alt="Post image"
            className="rounded-2xl max-h-96 w-full object-cover cursor-pointer"
            onClick={() => setViewingImage(post.imageUrl)}
          />
        </div>
      )}

      {/* Link Preview */}
      {post.linkPreview && (
        <LinkPreview preview={post.linkPreview} className="mt-3" />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 max-w-md">
        {/* Reply */}
        <Button
          variant="ghost"
          className="gap-2 text-secondary hover:text-blue-400"
          onClick={() => handleReply()}
        >
          <ReplyIcon className="h-5 w-5" />
          <span className="text-sm">{post.replies || 0}</span>
        </Button>

        {/* Repost */}
        <Button
          variant="ghost"
          className="gap-2 text-secondary hover:text-green-400"
          onClick={() => handleRepost()}
        >
          <RepeatIcon className="h-5 w-5" />
          <span className="text-sm">{post.reposts || 0}</span>
        </Button>

        {/* Resonance (Like) */}
        <Button
          variant="ghost"
          className={`gap-2 ${post.hasResonated ? 'text-red-400' : 'text-secondary hover:text-red-400'}`}
          onClick={() => handleResonate()}
        >
          <HeartIcon className={`h-5 w-5 ${post.hasResonated ? 'fill-current' : ''}`} />
          <span className="text-sm">{post.resonance || 0}</span>
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          className="gap-2 text-secondary hover:text-blue-400"
          onClick={() => handleShare()}
        >
          <ShareIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  </div>
</article>
```

---

## РЎРѕСЃС‚РѕСЏРЅРёСЏ

### Loading

```tsx
{isLoading && (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    ))}
  </div>
)}
```

### Empty

```tsx
{posts.length === 0 && !isLoading && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <FileTextIcon className="h-16 w-16 text-white/20 mb-4" />
    <p className="text-lg font-medium">No posts yet</p>
    <p className="text-sm text-secondary mt-1">
      Be the first to post something!
    </p>
  </div>
)}
```

### Error

```tsx
{error && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircleIcon className="h-16 w-16 text-red-500/50 mb-4" />
    <p className="text-lg font-medium">Failed to load posts</p>
    <Button onClick={refetch} className="mt-4">
      Try again
    </Button>
  </div>
)}
```

---

## РҐСѓРєРё

### usePosts (recommended)

```typescript
const { data: posts, isLoading, error } = useQuery({
  queryKey: ['posts', 'recommended'],
  queryFn: fetchRecommendedPosts,
  staleTime: 5 * 60 * 1000,
});
```

### usePosts (following)

```typescript
const { data: posts } = useQuery({
  queryKey: ['posts', 'following'],
  queryFn: fetchFollowingPosts,
  staleTime: 2 * 60 * 1000,
});
```

### useCreatePost

```typescript
const createPost = useMutation({
  mutationFn: createPostApi,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    setText('');
    setImage(null);
  },
});
```

### useResonance

```typescript
const resonate = useMutation({
  mutationFn: (postId: string) => resonateApi(postId),
  onMutate: async ({ postId }) => {
    // Optimistic update
    await queryClient.cancelQueries({ queryKey: ['posts'] });
    const previous = queryClient.getQueryData(['posts']);
    queryClient.setQueryData(['posts'], (old) =>
      old.map((post) =>
        post.id === postId
          ? { ...post, resonance: post.resonance + 1, hasResonated: true }
          : post
      )
    );
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['posts'], context.previous);
  },
});
```

---

## WebSocket СЃРѕР±С‹С‚РёСЏ

### РџРѕР»СѓС‡РµРЅРёРµ РЅРѕРІС‹С… РїРѕСЃС‚РѕРІ

```typescript
wsService.on('new_post', (data) => {
  setNewPostsCount((count) => count + 1);
  
  // РР»Рё РѕРїС‚РёРјРёСЃС‚РёС‡РЅРѕРµ РґРѕР±Р°РІР»РµРЅРёРµ
  queryClient.setQueryData(['posts', 'recommended'], (old) => [
    data.post,
    ...old,
  ]);
});
```

### РћР±РЅРѕРІР»РµРЅРёРµ СЂРµР·РѕРЅР°РЅСЃР°

```typescript
wsService.on('post_resonance_updated', (data) => {
  queryClient.setQueryData(['posts'], (old) =>
    old.map((post) =>
      post.id === data.postId
        ? { ...post, resonance: data.resonance }
        : post
    )
  );
});
```

### РќРѕРІС‹Р№ РєРѕРјРјРµРЅС‚Р°СЂРёР№

```typescript
wsService.on('new_comment', (data) => {
  queryClient.setQueryData(['posts', data.postId, 'comments'], (old) => [
    ...old,
    data.comment,
  ]);
});
```

---

## Image Viewer

**Р¤Р°Р№Р»:** `src/components/media/ImageViewer.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-4xl bg-transparent border-none shadow-none">
    <div className="relative">
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] w-auto mx-auto"
      />
      <button
        onClick={() => setIsOpen(false)}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70"
      >
        <XIcon className="h-6 w-6" />
      </button>
    </div>
  </DialogContent>
</Dialog>
```

---

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [Overview](./OVERVIEW.md) вЂ” РљР°СЂС‚Р° РїСЂРёР»РѕР¶РµРЅРёСЏ
- [Style System](./STYLE_SYSTEM.md) вЂ” UI СЃС‚РёР»СЊ
- [Profile UI](./PROFILE_UI.md) вЂ” UI РїСЂРѕС„РёР»СЏ

