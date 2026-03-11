п»ї??# LUME Messages UI

**пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ:** 9 пїЅпїЅпїЅпїЅпїЅ 2026 пїЅ.

---

## РћР±Р·РѕСЂ

Р›РёС‡РЅС‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ (РјРµСЃСЃРµРЅРґР¶РµСЂ) вЂ” СЌС‚Рѕ СЂР°Р·РґРµР» РґР»СЏ РїСЂРёРІР°С‚РЅРѕРіРѕ РѕР±С‰РµРЅРёСЏ РјРµР¶РґСѓ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏРјРё.

**Р¤Р°Р№Р»С‹:**
- РЎС‚СЂР°РЅРёС†Р°: `src/pages/Messages.tsx` > `src/pages/messages/MessagesPage.tsx`
- РљРѕРјРїРѕРЅРµРЅС‚С‹: `src/pages/messages/components/`
- РҐСѓРєРё: `src/pages/messages/hooks/`

---

## РЎС‚СЂСѓРєС‚СѓСЂР° СЃС‚СЂР°РЅРёС†С‹

```
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚  Chat List (320px)  в”‚  Chat Panel (flex-1)         в”‚
в”‚                     в”‚                               в”‚
в”‚  Search             в”‚  Header                       в”‚
в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ  в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ  в”‚
в”‚  в”‚ User 1        в”‚  в”‚  в”‚ User Name               в”‚  в”‚
в”‚  в”‚ Last message  в”‚  в”‚  в”‚ online                  в”‚  в”‚
в”‚  в”‚ 12:30         в”‚  в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”  в”‚
в”‚  в”њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”¤  в”‚                               в”‚
в”‚  в”‚ User 2        в”‚  в”‚  Message List                 в”‚
в”‚  в”‚ Last message  в”‚  в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ  в”‚
в”‚  в”‚ 11:45         в”‚  в”‚  в”‚ в—‹ User: Hello!          в”‚  в”‚
в”‚  в”њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”¤  в”‚  в”‚ в—Џ You: Hi there!        в”‚  в”‚
в”‚  в”‚ User 3        в”‚  в”‚  в”‚ в—‹ User: How are you?    в”‚  в”‚
в”‚  в”‚ Last message  в”‚  в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”  в”‚
в”‚  в”‚ 10:20         в”‚  в”‚                               в”‚
в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”  в”‚  Composer                     в”‚
в”‚                     в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ  в”‚
в”‚                     в”‚  в”‚ [Type message...]  [в†’]  в”‚  в”‚
в”‚                     в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”  в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
```

---

## Chat List

**Р¤Р°Р№Р»:** `src/pages/messages/components/ChatList.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<div className="w-[320px] border-r border-white/10 flex flex-col">
  {/* Header */}
  <div className="p-4 border-b border-white/10">
    <h2 className="text-lg font-semibold">Messages</h2>
  </div>

  {/* Search */}
  <div className="p-3">
    <Input placeholder="Search chats..." />
  </div>

  {/* Chat items */}
  <div className="flex-1 overflow-y-auto">
    {chats.map((chat) => (
      <ChatItem
        key={chat.id}
        chat={chat}
        onClick={() => selectChat(chat.userId)}
      />
    ))}
  </div>
</div>
```

### Chat Item

**РљРѕРјРїРѕРЅРµРЅС‚:** `src/pages/messages/components/ChatList.tsx`

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
```tsx
<div
  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-smooth ${
    isActive ? 'bg-white/10' : 'hover:bg-white/5'
  }`}
>
  {/* Avatar */}
  <div className="relative">
    <Avatar src={chat.avatar} fallback={chat.name.charAt(0)} />
    {chat.online && (
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
    )}
  </div>

  {/* Info */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium truncate">{chat.name}</p>
      <span className="text-xs text-secondary">{formatTime(chat.timestamp)}</span>
    </div>
    <p className="text-sm text-secondary truncate">{chat.lastMessage}</p>
  </div>

  {/* Unread badge */}
  {chat.unread > 0 && (
    <div className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary flex items-center justify-center">
      <span className="text-xs font-semibold">{chat.unread}</span>
    </div>
  )}
</div>
```

---

## Chat Panel

**Р¤Р°Р№Р»:** `src/pages/messages/components/ChatPanel.tsx`

### Header

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
```tsx
<div className="h-16 border-b border-white/10 flex items-center justify-between px-4">
  <div className="flex items-center gap-3">
    <Avatar src={user.avatar} fallback={user.name.charAt(0)} />
    <div>
      <p className="text-sm font-semibold">{user.name}</p>
      <p className="text-xs text-secondary">
        {user.online ? 'Online' : `Last seen ${formatLastSeen(user.lastSeen)}`}
      </p>
    </div>
  </div>
  
  {/* Actions */}
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="icon">
      <PhoneIcon className="h-5 w-5" />
    </Button>
    <Button variant="ghost" size="icon">
      <MoreVerticalIcon className="h-5 w-5" />
    </Button>
  </div>
</div>
```

---

## Message List

**Р¤Р°Р№Р»:** `src/pages/messages/components/MessageList.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<div className="flex-1 overflow-y-auto p-4 space-y-3">
  {messages.map((message) => (
    <MessageBubble
      key={message.id}
      message={message}
      onReply={() => setReplyTo(message)}
      onDelete={() => handleDelete(message.id)}
    />
  ))}
  
  {/* Typing indicator */}
  {isTyping && (
    <div className="flex items-center gap-2 text-sm text-secondary">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>РїРµС‡Р°С‚Р°РµС‚...</span>
    </div>
  )}
  
  {/* Scroll to bottom */}
  <div ref={scrollRef} />
</div>
```

### Message Bubble

**Р¤Р°Р№Р»:** `src/pages/messages/components/MessageList.tsx`

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
```tsx
<div className={`flex ${message.own ? 'justify-end' : 'justify-start'}`}>
  <div
    className={`max-w-[70%] rounded-[24px] px-4 py-2.5 ${
      message.own
        ? 'bg-white/10 text-white rounded-br-md'
        : 'bg-white/5 text-white/90 rounded-bl-md'
    }`}
  >
    {/* Reply preview */}
    {message.replyToMessageId && (
      <div className="mb-2 pb-2 border-b border-white/10">
        <p className="text-xs text-secondary truncate">
          {replyToMessage.text}
        </p>
      </div>
    )}

    {/* Text */}
    <p className="text-sm leading-relaxed">{message.text}</p>

    {/* Attachments */}
    {message.attachments.length > 0 && (
      <div className="mt-2 space-y-2">
        {message.attachments.map((att) => (
          <img
            key={att.id}
            src={att.url}
            alt="Attachment"
            className="rounded-xl max-w-full"
          />
        ))}
      </div>
    )}

    {/* Moment (РёСЃС‡РµР·Р°СЋС‰РµРµ С„РѕС‚Рѕ) */}
    {message.moment && (
      <div className="mt-2">
        <div className="relative aspect-square rounded-xl overflow-hidden cursor-pointer">
          <img src={message.moment.thumbDataUrl} alt="Moment" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <EyeIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        {message.moment.viewedAt && (
          <p className="text-xs text-secondary mt-1">РџСЂРѕСЃРјРѕС‚СЂРµРЅРѕ</p>
        )}
      </div>
    )}

    {/* Metadata */}
    <div className="flex items-center justify-end gap-2 mt-1">
      {/* Read receipt */}
      {message.own && message.read && (
        <CheckDoubleIcon className="h-4 w-4 text-blue-500" />
      )}
      
      {/* Timestamp */}
      <span className="text-xs text-white/40">
        {formatTime(message.timestamp)}
      </span>
    </div>
  </div>
</div>
```

### Context menu

**РћС‚РєСЂС‹С‚РёРµ:** РџСЂР°РІС‹Р№ РєР»РёРє РїРѕ СЃРѕРѕР±С‰РµРЅРёСЋ

**РћРїС†РёРё:**
- Reply
- Edit (С‚РѕР»СЊРєРѕ СЃРІРѕРё)
- Delete for me
- Delete for all (С‚РѕР»СЊРєРѕ СЃРІРѕРё, < 15 РјРёРЅ)
- Copy text

---

## Message Composer

**Р¤Р°Р№Р»:** `src/pages/messages/components/MessageComposer.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<div className="border-t border-white/10 p-4">
  {/* Reply bar */}
  {replyTo && (
    <ReplyBar
      message={replyTo}
      onCancel={() => setReplyTo(null)}
    />
  )}

  {/* Input area */}
  <div className="flex items-end gap-3">
    {/* Attach button */}
    <Button variant="ghost" size="icon">
      <PaperclipIcon className="h-5 w-5" />
    </Button>

    {/* Text input */}
    <Textarea
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Type a message..."
      rows={1}
      className="flex-1 min-h-[44px] max-h-[200px] resize-none"
    />

    {/* Send button */}
    <Button
      onClick={handleSend}
      disabled={!message.trim()}
      size="icon"
    >
      <SendIcon className="h-5 w-5" />
    </Button>
  </div>
</div>
```

### Reply Bar

**Р¤Р°Р№Р»:** `src/components/chat/ReplyBar.tsx`

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
```tsx
<div className="mb-3 p-3 rounded-xl bg-white/5 border border-white/10">
  <div className="flex items-start justify-between gap-3">
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-secondary mb-1">
        Replying to {message.senderName}
      </p>
      <p className="text-sm truncate">{message.text}</p>
    </div>
    <Button
      variant="ghost"
      size="icon"
      onClick={onCancel}
      className="h-8 w-8"
    >
      <XIcon className="h-4 w-4" />
    </Button>
  </div>
</div>
```

---

## РЎРѕСЃС‚РѕСЏРЅРёСЏ

### Loading

```tsx
{isLoading && (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-12 w-full rounded-xl" />
    ))}
  </div>
)}
```

### Empty

```tsx
{chats.length === 0 && (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <MessageCircleIcon className="h-16 w-16 text-white/20 mb-4" />
    <p className="text-lg font-medium">No chats yet</p>
    <p className="text-sm text-secondary mt-1">
      Start a conversation with someone
    </p>
  </div>
)}
```

### Error

```tsx
{error && (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <AlertCircleIcon className="h-16 w-16 text-red-500/50 mb-4" />
    <p className="text-lg font-medium">Failed to load chats</p>
    <Button onClick={refetch} className="mt-4">
      Try again
    </Button>
  </div>
)}
```

---

## РҐСѓРєРё

### useChats

**Р¤Р°Р№Р»:** `src/pages/messages/hooks/useChats.ts`

```typescript
const { data: chats, isLoading, error } = useChats();
```

### useChatMessages

**Р¤Р°Р№Р»:** `src/pages/messages/hooks/useChatMessages.ts`

```typescript
const { data: messages, isLoading } = useChatMessages(userId);
```

### useSendMessage

**Р¤Р°Р№Р»:** `src/pages/messages/hooks/useSendMessage.ts`

```typescript
const sendMessage = useSendMessage();

await sendMessage.mutateAsync({
  receiverId: userId,
  text: message,
  replyToMessageId: replyTo?.id,
});
```

### useChatWs

**Р¤Р°Р№Р»:** `src/pages/messages/hooks/useChatWs.ts`

```typescript
useChatWs({
  chatId,
  onNewMessage: (message) => {
    queryClient.setQueryData(
      queryKeys.chats.messages(chatId),
      (old) => [...old, message]
    );
  },
  onTypingUpdate: (data) => {
    setIsTyping(data.isTyping);
  },
});
```

---

## WebSocket СЃРѕР±С‹С‚РёСЏ

### РћС‚РїСЂР°РІРєР°

```typescript
wsService.send({
  type: 'typing:start',
  chatId: userId,
});

wsService.send({
  type: 'chat:read',
  chatId: userId,
  lastReadMessageId: lastMessage.id,
});
```

### РџРѕР»СѓС‡РµРЅРёРµ

```typescript
wsService.on('new_message', (data) => {
  // Add message to list
});

wsService.on('typing:update', (data) => {
  // Show typing indicator
});

wsService.on('chat:read_update', (data) => {
  // Update read status
});
```

---

## РЎРєСЂРѕР»Р» РїРѕРІРµРґРµРЅРёРµ

### РђРІС‚РѕСЃРєСЂРѕР»Р» Рє РЅРѕРІС‹Рј СЃРѕРѕР±С‰РµРЅРёСЏРј

```typescript
useEffect(() => {
  if (!scrollRef.current) return;
  scrollRef.current.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```

### РЎРѕС…СЂР°РЅРµРЅРёРµ РїРѕР·РёС†РёРё РїСЂРё Р·Р°РіСЂСѓР·РєРµ СЃС‚Р°СЂС‹С…

```typescript
const saveScrollPosition = () => {
  const container = messageListRef.current;
  if (container) {
    setScrollPosition(container.scrollTop);
  }
};

const restoreScrollPosition = () => {
  const container = messageListRef.current;
  if (container && scrollPosition !== null) {
    container.scrollTop = scrollPosition;
  }
};
```

---

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [Overview](./OVERVIEW.md) вЂ” РљР°СЂС‚Р° РїСЂРёР»РѕР¶РµРЅРёСЏ
- [Style System](./STYLE_SYSTEM.md) вЂ” UI СЃС‚РёР»СЊ
- [Servers UI](./SERVERS_UI.md) вЂ” UI СЃРµСЂРІРµСЂРѕРІ

