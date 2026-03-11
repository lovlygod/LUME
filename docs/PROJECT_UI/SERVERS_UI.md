п»ї??# LUME Servers UI

**пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ:** 9 пїЅпїЅпїЅпїЅпїЅ 2026 пїЅ.

---

## РћР±Р·РѕСЂ

РњРѕРґСѓР»СЊ СЃРµСЂРІРµСЂРѕРІ (communities) вЂ” СЌС‚Рѕ СЃРёСЃС‚РµРјР° СЃРѕРѕР±С‰РµСЃС‚РІ СЃ РєР°РЅР°Р»Р°РјРё, СЂРѕР»СЏРјРё Рё СѓРїСЂР°РІР»РµРЅРёРµРј СѓС‡Р°СЃС‚РЅРёРєР°РјРё.

**Р¤Р°Р№Р»С‹:**
- РЎС‚СЂР°РЅРёС†С‹: `src/pages/ServersPage.tsx`, `src/pages/ServerPage.tsx`, `src/pages/ServerSettingsPage.tsx`, `src/pages/ServerMembersPage.tsx`
- РљРѕРјРїРѕРЅРµРЅС‚С‹: `src/pages/server/components/`
- РҐСѓРєРё: `src/hooks/servers.ts`, `src/pages/server/hooks/`

---

## Servers Page (РљР°С‚Р°Р»РѕРі)

**Р¤Р°Р№Р»:** `src/pages/ServersPage.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚  Servers Header                                     в”‚
в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ  в”‚
в”‚  в”‚ [Create Server]  [Discover в–ј]  [Search...]    в”‚  в”‚
в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”  в”‚
в”‚                                                     в”‚
в”‚  Tabs: [Discover] [My Servers]                      в”‚
в”‚  в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ  в”‚
в”‚                                                     в”‚
в”‚  Server Grid                                        в”‚
в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ            в”‚
в”‚  в”‚ [Icon]   в”‚ в”‚ [Icon]   в”‚ в”‚ [Icon]   в”‚            в”‚
в”‚  в”‚ Name     в”‚ в”‚ Name     в”‚ в”‚ Name     в”‚            в”‚
в”‚  в”‚ Members  в”‚ в”‚ Members  в”‚ в”‚ Members  в”‚            в”‚
в”‚  в”‚ [Join]   в”‚ в”‚ [Open]   в”‚ в”‚ [Join]   в”‚            в”‚
в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв” в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв” в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”            в”‚
в”‚                                                     в”‚
в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ            в”‚
в”‚  в”‚ ...      в”‚ в”‚ ...      в”‚ в”‚ ...      в”‚            в”‚
в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв” в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв” в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”            в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
```

### Server Card

**РљРѕРјРїРѕРЅРµРЅС‚:** `src/pages/ServersPage.tsx`

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
```tsx
<div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-smooth">
  {/* Icon */}
  <div className="w-full aspect-square rounded-xl bg-white/10 flex items-center justify-center mb-3">
    {server.iconUrl ? (
      <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover rounded-xl" />
    ) : (
      <span className="text-2xl font-bold text-white/40">
        {server.name.charAt(0)}
      </span>
    )}
  </div>

  {/* Info */}
  <h3 className="text-base font-semibold mb-1">{server.name}</h3>
  <p className="text-sm text-secondary mb-3 line-clamp-2">
    {server.description || 'No description'}
  </p>

  {/* Members count */}
  <div className="flex items-center gap-2 text-xs text-secondary mb-3">
    <UsersIcon className="h-4 w-4" />
    <span>{server.membersCount} members</span>
  </div>

  {/* Action button */}
  {server.isMember ? (
    <Button className="w-full" onClick={() => navigate(`/server/${server.id}`)}>
      Open Server
    </Button>
  ) : server.type === 'private' ? (
    <Button variant="outline" className="w-full" onClick={() => handleRequestJoin(server.id)}>
      Request Access
    </Button>
  ) : (
    <Button className="w-full" onClick={() => handleJoin(server.id)}>
      Join Server
    </Button>
  )}
</div>
```

---

## Server Page

**Р¤Р°Р№Р»:** `src/pages/ServerPage.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚  ServerSidebar (280px)  в”‚  Channel Chat (flex-1)            в”‚
в”‚                       в”‚                                     в”‚
в”‚  [Server Icon]        в”‚  Channel Header                     в”‚
в”‚  Server Name          в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ    в”‚
в”‚  #channel-name        в”‚  в”‚ # general                   в”‚    в”‚
в”‚                       в”‚  в”‚ 123 members                 в”‚    в”‚
в”‚  Channels             в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”    в”‚
в”‚  в”њв”Ђ # general         в”‚                                     в”‚
в”‚  в”њв”Ђ # off-topic       в”‚  Message List                       в”‚
в”‚  в””в”Ђ # announcements   в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ    в”‚
в”‚                       в”‚  в”‚ в—‹ User: Hello everyone!     в”‚    в”‚
в”‚  Members (preview)    в”‚  в”‚ в—Џ You: Hi!                  в”‚    в”‚
в”‚  в”њв”Ђ рџ‘‘ Owner          в”‚  в”‚ в—‹ User: Welcome to server   в”‚    в”‚
в”‚  в”њв”Ђ вљЎ Admin          в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”    в”‚
в”‚  в””в”Ђ рџ”№ Member         в”‚                                     в”‚
в”‚                       в”‚  Channel Composer                   в”‚
в”‚  [Settings]           в”‚  в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ    в”‚
в”‚                       в”‚  в”‚ [Type message...]  [в†’]      в”‚    в”‚
в”‚                       в”‚  в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”    в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
```

---

## ServerSidebar

**Р¤Р°Р№Р»:** `src/pages/server/components/ServerSidebar.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<aside className="w-[280px] border-r border-white/10 flex flex-col">
  {/* Server Header */}
  <div className="p-4 border-b border-white/10">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
        {server.iconUrl ? (
          <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span className="text-lg font-bold">{server.name.charAt(0)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold truncate">{server.name}</h2>
        <p className="text-xs text-secondary truncate">
          {server.type === 'public' ? 'Public' : 'Private'} server
        </p>
      </div>
    </div>
  </div>

  {/* Channels */}
  <div className="flex-1 overflow-y-auto py-3">
    <div className="px-3 mb-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
          Text Channels
        </span>
        {canCreateChannel && (
          <Button variant="ghost" size="icon" onClick={handleCreateChannel}>
            <PlusIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>

    {channels.map((channel) => (
      <NavLink
        key={channel.id}
        to={`/server/${serverId}/channel/${channel.name}`}
        className={({ isActive }) =>
          `flex items-center gap-2 px-3 py-2 mx-3 rounded-lg transition-smooth ${
            isActive
              ? 'bg-white/10 text-white'
              : 'text-secondary hover:text-white hover:bg-white/5'
          }`
        }
      >
        <HashIcon className="h-5 w-5 text-white/40" />
        <span className="text-sm font-medium">{channel.name}</span>
      </NavLink>
    ))}
  </div>

  {/* Members Preview */}
  <div className="border-t border-white/10 p-3">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
        Members
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/server/${serverId}/members`)}
      >
        See all
      </Button>
    </div>
    <div className="flex -space-x-2">
      {members.slice(0, 5).map((member) => (
        <Avatar
          key={member.id}
          src={member.avatar}
          fallback={member.name.charAt(0)}
          className="w-8 h-8 border-2 border-background"
        />
      ))}
    </div>
  </div>

  {/* Settings Button (Owner/Admin) */}
  {(isOwner || isAdmin) && (
    <div className="border-t border-white/10 p-3">
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => navigate(`/server/${serverId}/settings`)}
      >
        <SettingsIcon className="h-5 w-5 mr-2" />
        Server Settings
      </Button>
    </div>
  )}
</aside>
```

---

## Channel Chat

**Р¤Р°Р№Р»:** `src/pages/server/components/ChannelMessageList.tsx`, `ChannelComposer.tsx`

### Channel Header

**РљРѕРјРїРѕРЅРµРЅС‚:** `src/pages/server/components/ChannelHeader.tsx`

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
```tsx
<div className="h-16 border-b border-white/10 flex items-center justify-between px-6">
  <div className="flex items-center gap-3">
    <HashIcon className="h-6 w-6 text-white/40" />
    <div>
      <h3 className="text-base font-semibold">#{channel.name}</h3>
      <p className="text-xs text-secondary">{membersCount} members</p>
    </div>
  </div>

  {/* Actions */}
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="icon">
      <BellIcon className="h-5 w-5" />
    </Button>
    <Button variant="ghost" size="icon">
      <PinIcon className="h-5 w-5" />
    </Button>
    <Button variant="ghost" size="icon">
      <UsersIcon className="h-5 w-5" />
    </Button>
  </div>
</div>
```

### Message List

**РљРѕРјРїРѕРЅРµРЅС‚:** `src/pages/server/components/ChannelMessageList.tsx`

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
```tsx
<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
  {messages.map((message) => (
    <ChannelMessageRow
      key={message.id}
      message={message}
      onReply={() => setReplyTo(message)}
      onDelete={() => handleDelete(message.id)}
    />
  ))}
  <div ref={scrollRef} />
</div>
```

### ChannelMessageRow

**РљРѕРјРїРѕРЅРµРЅС‚:** `src/pages/server/components/ChannelMessageRow.tsx`

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
```tsx
<div className="flex gap-3 group">
  {/* Avatar */}
  <Avatar
    src={message.author.avatar}
    fallback={message.author.name.charAt(0)}
    className="w-10 h-10"
  />

  {/* Content */}
  <div className="flex-1 min-w-0">
    {/* Header */}
    <div className="flex items-baseline gap-2">
      <span className="text-sm font-semibold">{message.author.name}</span>
      <span className="text-xs text-secondary">
        {formatTime(message.createdAt)}
      </span>
      {message.author.verified && (
        <VerifiedBadge className="h-4 w-4" />
      )}
    </div>

    {/* Reply preview */}
    {message.replyToMessageId && (
      <div className="mt-1 mb-2 p-2 rounded-lg bg-white/5 border border-white/10">
        <p className="text-xs text-secondary truncate">
          {replyToMessage.text}
        </p>
      </div>
    )}

    {/* Text */}
    <p className="text-sm leading-relaxed">{formatMessageText(message.text)}</p>

    {/* Attachments */}
    {message.attachments.length > 0 && (
      <div className="mt-2 grid grid-cols-2 gap-2">
        {message.attachments.map((att) => (
          <img
            key={att.id}
            src={att.url}
            alt="Attachment"
            className="rounded-xl max-w-full cursor-pointer hover:opacity-90"
            onClick={() => openImageViewer(att.url)}
          />
        ))}
      </div>
    )}

    {/* Actions (hover) */}
    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <ReplyIcon className="h-3.5 w-3.5" />
      </Button>
      {isOwn && (
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <TrashIcon className="h-3.5 w-3.5" />
        </Button>
      )}
      {(isModerator || isAdmin) && (
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <TrashIcon className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  </div>
</div>
```

### Channel Composer

**РљРѕРјРїРѕРЅРµРЅС‚:** `src/pages/server/components/ChannelComposer.tsx`

**РЎС‚СЂСѓРєС‚СѓСЂР°:**
```tsx
<div className="border-t border-white/10 px-6 py-4">
  {/* Reply bar */}
  {replyTo && (
    <ChannelReplyBar
      message={replyTo}
      onCancel={() => setReplyTo(null)}
    />
  )}

  {/* Attachments preview */}
  {attachments.length > 0 && (
    <ChannelAttachmentsPreview
      attachments={attachments}
      onRemove={(id) => setAttachments(attachments.filter(a => a.id !== id))}
    />
  )}

  {/* Input area */}
  <div className="flex items-end gap-3">
    {/* Upload button */}
    <Button
      variant="ghost"
      size="icon"
      onClick={() => fileInputRef.current?.click()}
    >
      <PlusIcon className="h-5 w-5" />
    </Button>
    <input
      ref={fileInputRef}
      type="file"
      multiple
      accept="image/*,*/*"
      className="hidden"
      onChange={handleFileSelect}
    />

    {/* Text input */}
    <Textarea
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={`Message #${channel.name}`}
      rows={1}
      className="flex-1 min-h-[44px] max-h-[200px] resize-none"
    />

    {/* Send button */}
    <Button
      onClick={handleSend}
      disabled={!message.trim() && attachments.length === 0}
      size="icon"
    >
      <SendIcon className="h-5 w-5" />
    </Button>
  </div>
</div>
```

---

## Server Settings

**Р¤Р°Р№Р»:** `src/pages/ServerSettingsPage.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<div className="max-w-2xl mx-auto p-6">
  <h1 className="text-2xl font-bold mb-6">Server Settings</h1>

  {/* Server Icon */}
  <div className="mb-6">
    <label className="block text-sm font-medium mb-2">Server Icon</label>
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
        {server.iconUrl ? (
          <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover rounded-2xl" />
        ) : (
          <span className="text-2xl font-bold">{server.name.charAt(0)}</span>
        )}
      </div>
      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
        Change Icon
      </Button>
    </div>
  </div>

  {/* Server Name */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">Server Name</label>
    <Input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Enter server name"
    />
  </div>

  {/* Username (public servers) */}
  {server.type === 'public' && (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Username</label>
      <div className="flex items-center gap-2">
        <span className="text-secondary">/server/</span>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="server-username"
        />
      </div>
    </div>
  )}

  {/* Description */}
  <div className="mb-6">
    <label className="block text-sm font-medium mb-2">Description</label>
    <Textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="Describe your server"
      rows={4}
    />
  </div>

  {/* Actions */}
  <div className="flex items-center justify-between">
    <Button onClick={handleSave}>
      Save Changes
    </Button>
    <Button variant="destructive" onClick={handleDelete}>
      Delete Server
    </Button>
  </div>
</div>
```

---

## Server Members

**Р¤Р°Р№Р»:** `src/pages/ServerMembersPage.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<div className="p-6">
  <div className="flex items-center justify-between mb-6">
    <h1 className="text-2xl font-bold">Members</h1>
    <Input
      placeholder="Search members..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="max-w-xs"
    />
  </div>

  {/* Role sections */}
  {roles.map((role) => (
    <div key={role.id} className="mb-6">
      <h2 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
        {role.name} ({role.members.length})
      </h2>
      <div className="space-y-2">
        {role.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-smooth"
          >
            <div className="flex items-center gap-3">
              <Avatar src={member.avatar} fallback={member.name.charAt(0)} />
              <div>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs text-secondary">@{member.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canManageMembers && (
                <Select
                  value={member.roleId}
                  onValueChange={(roleId) => handleChangeRole(member.id, roleId)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {canKick && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleKick(member.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

---

## Create Server Dialog

**Р¤Р°Р№Р»:** `src/components/servers/CreateServerDialog.tsx`

### РЎС‚СЂСѓРєС‚СѓСЂР°

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Server</DialogTitle>
      <DialogDescription>
        Create a new community for your friends or fans
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit}>
      {/* Server Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Server Type</label>
        <div className="grid grid-cols-2 gap-3">
          <Card
            className={`cursor-pointer ${type === 'public' ? 'border-primary' : ''}`}
            onClick={() => setType('public')}
          >
            <CardContent className="p-4">
              <GlobeIcon className="h-6 w-6 mb-2" />
              <p className="font-semibold">Public</p>
              <p className="text-xs text-secondary">Anyone can find and join</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer ${type === 'private' ? 'border-primary' : ''}`}
            onClick={() => setType('private')}
          >
            <CardContent className="p-4">
              <LockIcon className="h-6 w-6 mb-2" />
              <p className="font-semibold">Private</p>
              <p className="text-xs text-secondary">Invite only, requires approval</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Server Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Server Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Awesome Server"
        />
      </div>

      {/* Username (public only) */}
      {type === 'public' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="my-server"
          />
          <p className="text-xs text-secondary mt-1">
            Min 5 characters, lowercase letters and numbers only
          </p>
        </div>
      )}

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your server"
          rows={3}
        />
      </div>

      {/* Icon */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Server Icon (optional)</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
            {iconPreview ? (
              <img src={iconPreview} alt="Icon" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <UploadIcon className="h-6 w-6 text-white/40" />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Server'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

## РҐСѓРєРё

### useMyServers

```typescript
const { data: servers, isLoading } = useMyServers();
```

### useServer

```typescript
const { data: server, isLoading } = useServer(identifier);
```

### useCreateServer

```typescript
const createServer = useCreateServer();

await createServer.mutateAsync(formData);
```

### useChannelMessages

```typescript
const { data: messages } = useChannelMessages(serverId, channelId);
```

### useSendChannelMessage

```typescript
const sendMessage = useSendChannelMessage(serverId, channelId);

await sendMessage.mutateAsync({ text, attachmentIds });
```

---

## WebSocket СЃРѕР±С‹С‚РёСЏ

### РљР»РёРµРЅС‚ в†’ РЎРµСЂРІРµСЂ

```typescript
wsService.send({
  type: 'server:subscribe',
  serverId: serverId,
});
```

### РЎРµСЂРІРµСЂ в†’ РљР»РёРµРЅС‚

```typescript
wsService.on('channel:new_message', (data) => {
  queryClient.setQueryData(
    queryKeys.messages.channel(serverId, channelId),
    (old) => [...old, data.message]
  );
});

wsService.on('server:member_joined', (data) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.servers.members(serverId) });
});
```

---

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [Overview](./OVERVIEW.md) вЂ” РљР°СЂС‚Р° РїСЂРёР»РѕР¶РµРЅРёСЏ
- [Style System](./STYLE_SYSTEM.md) вЂ” UI СЃС‚РёР»СЊ
- [Messages UI](./MESSAGES_UI.md) вЂ” UI Р»РёС‡РЅС‹С… СЃРѕРѕР±С‰РµРЅРёР№
- [Servers Module](../SERVERS_MODULE.md) вЂ” Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ backend

