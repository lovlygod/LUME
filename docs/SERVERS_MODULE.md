п»ї?# РњРѕРґСѓР»СЊ: РЎРµСЂРІРµСЂС‹ (Communities) РґР»СЏ LUME

**пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ:** 9 пїЅпїЅпїЅпїЅпїЅ 2026 пїЅ.
**РЎС‚Р°С‚СѓСЃ:** вњ… Р РµР°Р»РёР·РѕРІР°РЅРѕ Рё РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ

---

## РћР±Р·РѕСЂ

РњРѕРґСѓР»СЊ СЃРµСЂРІРµСЂРѕРІ (communities) вЂ” СЌС‚Рѕ СЃРёСЃС‚РµРјР° СЃРѕРѕР±С‰РµСЃС‚РІ РІ LUME. РЎРµСЂРІРµСЂ вЂ” СЌС‚Рѕ РїСЂРѕСЃС‚СЂР°РЅСЃС‚РІРѕ СЃ СѓС‡Р°СЃС‚РЅРёРєР°РјРё, СЂРѕР»СЏРјРё, РєР°РЅР°Р»Р°РјРё Рё СЃРёСЃС‚РµРјРѕР№ РїСЂР°РІ РґРѕСЃС‚СѓРїР°.

---

## РђСЂС…РёС‚РµРєС‚СѓСЂР°

### Backend

**Р¤Р°Р№Р»С‹:**
- `backend/src/servers.js` вЂ” API routes РґР»СЏ СЃРµСЂРІРµСЂРѕРІ (19 endpoints)
- `backend/src/server.js` вЂ” WebSocket РѕР±СЂР°Р±РѕС‚С‡РёРєРё
- `backend/src/permissions.js` вЂ” РЎРёСЃС‚РµРјР° РїСЂР°РІ РґРѕСЃС‚СѓРїР° (role-based)
- `backend/src/validation.js` вЂ” Zod СЃС…РµРјС‹ РІР°Р»РёРґР°С†РёРё
- `backend/src/auth.js` вЂ” РђСѓС‚РµРЅС‚РёС„РёРєР°С†РёСЏ
- `backend/src/errors.js` вЂ” РћР±СЂР°Р±РѕС‚РєР° РѕС€РёР±РѕРє
- `backend/src/logger.js` вЂ” Р›РѕРіРёСЂРѕРІР°РЅРёРµ
- `backend/src/audit.js` вЂ” РђСѓРґРёС‚ СЃРѕР±С‹С‚РёР№

**РўР°Р±Р»РёС†С‹ Р‘Р”:**
- `servers` вЂ” СЃРµСЂРІРµСЂС‹ (РїСѓР±Р»РёС‡РЅС‹Рµ СЃ username Рё РїСЂРёРІР°С‚РЅС‹Рµ)
- `server_members` вЂ” СѓС‡Р°СЃС‚РЅРёРєРё СЃРµСЂРІРµСЂРѕРІ
- `server_roles` вЂ” СЂРѕР»Рё (Owner/Admin/Moderator/Member)
- `server_channels` вЂ” С‚РµРєСЃС‚РѕРІС‹Рµ РєР°РЅР°Р»С‹
- `server_messages` вЂ” СЃРѕРѕР±С‰РµРЅРёСЏ РІ РєР°РЅР°Р»Р°С…
- `server_message_attachments` вЂ” РІР»РѕР¶РµРЅРёСЏ СЃРѕРѕР±С‰РµРЅРёР№
- `server_join_requests` вЂ” Р·Р°СЏРІРєРё РЅР° РІСЃС‚СѓРїР»РµРЅРёРµ (РґР»СЏ РїСЂРёРІР°С‚РЅС‹С… СЃРµСЂРІРµСЂРѕРІ)
- `server_bans` вЂ” Р±Р°РЅС‹ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№

### Frontend

**РЎС‚СЂР°РЅРёС†С‹:**
- `src/pages/ServersPage.tsx` вЂ” РєР°С‚Р°Р»РѕРі СЃРµСЂРІРµСЂРѕРІ (Discover/My Servers)
- `src/pages/ServerPage.tsx` вЂ” СЃС‚СЂР°РЅРёС†Р° СЃРµСЂРІРµСЂР° (РєР°РЅР°Р»С‹, С‡Р°С‚)
- `src/pages/ServerSettingsPage.tsx` вЂ” РЅР°СЃС‚СЂРѕР№РєРё СЃРµСЂРІРµСЂР°
- `src/pages/ServerMembersPage.tsx` вЂ” СѓРїСЂР°РІР»РµРЅРёРµ СѓС‡Р°СЃС‚РЅРёРєР°РјРё

**РљРѕРјРїРѕРЅРµРЅС‚С‹:**
- `src/pages/server/components/ServerSidebar.tsx` вЂ” РЅР°РІРёРіР°С†РёСЏ РїРѕ РєР°РЅР°Р»Р°Рј СЃРµСЂРІРµСЂР°
- `src/pages/server/components/ServerLayout.tsx` вЂ” layout Р±РµР· РїСЂР°РІРѕРіРѕ СЃР°Р№РґР±Р°СЂР°
- `src/pages/server/components/ChannelHeader.tsx` вЂ” Р·Р°РіРѕР»РѕРІРѕРє РєР°РЅР°Р»Р°
- `src/pages/server/components/ChannelMessageList.tsx` вЂ” СЃРїРёСЃРѕРє СЃРѕРѕР±С‰РµРЅРёР№ РєР°РЅР°Р»Р°
- `src/pages/server/components/ChannelComposer.tsx` вЂ” РѕС‚РїСЂР°РІРєР° СЃРѕРѕР±С‰РµРЅРёР№
- `src/pages/server/components/ChannelMessageRow.tsx` вЂ” РѕС‚РѕР±СЂР°Р¶РµРЅРёРµ СЃРѕРѕР±С‰РµРЅРёСЏ
- `src/pages/server/components/ChannelReplyBar.tsx` вЂ” РѕС‚РІРµС‚ РЅР° СЃРѕРѕР±С‰РµРЅРёРµ
- `src/pages/server/components/ChannelAttachmentsPreview.tsx` вЂ” РїСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ РІР»РѕР¶РµРЅРёР№
- `src/pages/server/components/MembersPanel.tsx` вЂ” РїР°РЅРµР»СЊ СѓС‡Р°СЃС‚РЅРёРєРѕРІ
- `src/components/servers/CreateServerDialog.tsx` вЂ” СЃРѕР·РґР°РЅРёРµ СЃРµСЂРІРµСЂР°

**РҐСѓРєРё:**
- `src/hooks/servers.ts` вЂ” React Query С…СѓРєРё (15+ С…СѓРєРѕРІ)
- `src/pages/server/hooks/useServerChannels.ts` вЂ” С…СѓРє РєР°РЅР°Р»РѕРІ
- `src/pages/server/hooks/useServerMeta.ts` вЂ” С…СѓРє РјРµС‚Р°РґР°РЅРЅС‹С… СЃРµСЂРІРµСЂР°
- `src/pages/server/hooks/useChannelMessages.ts` вЂ” СЃРѕРѕР±С‰РµРЅРёСЏ РєР°РЅР°Р»Р°
- `src/pages/server/hooks/useSendChannelMessage.ts` вЂ” РѕС‚РїСЂР°РІРєР° СЃРѕРѕР±С‰РµРЅРёР№
- `src/pages/server/hooks/useDeleteChannelMessage.ts` вЂ” СѓРґР°Р»РµРЅРёРµ СЃРѕРѕР±С‰РµРЅРёР№
- `src/pages/server/hooks/useChannelWs.ts` вЂ” WebSocket РґР»СЏ РєР°РЅР°Р»Р°
- `src/pages/server/hooks/useReply.ts` вЂ” РѕС‚РІРµС‚С‹ РЅР° СЃРѕРѕР±С‰РµРЅРёСЏ

**РЈС‚РёР»РёС‚С‹:**
- `src/pages/server/lib/scroll.ts` вЂ” Р°РІС‚РѕСЃРєСЂРѕР»Р» Рє РЅРѕРІС‹Рј СЃРѕРѕР±С‰РµРЅРёСЏРј
- `src/pages/server/lib/sanitize.ts` вЂ” СЃР°РЅРёС‚РёР·Р°С†РёСЏ С‚РµРєСЃС‚Р° СЃРѕРѕР±С‰РµРЅРёР№
- `src/pages/server/lib/messageText.tsx` вЂ” С„РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ С‚РµРєСЃС‚Р°
- `src/pages/server/hooks/queryKeys.ts` вЂ” query keys РґР»СЏ React Query

---

## РўРёРїС‹ СЃРµСЂРІРµСЂРѕРІ

### РџСѓР±Р»РёС‡РЅС‹Р№ СЃРµСЂРІРµСЂ
- РРјРµРµС‚ РїСѓР±Р»РёС‡РЅС‹Р№ username
- Р”РѕСЃС‚СѓРї РїРѕ URL: `/server/:username/channel/:channelName`
- Р›СЋР±РѕР№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РјРѕР¶РµС‚ РІСЃС‚СѓРїРёС‚СЊ С‡РµСЂРµР· РєРЅРѕРїРєСѓ "Join Server"
- РџСЂРёРјРµСЂ: `/server/gaminghub/channel/general`

### РџСЂРёРІР°С‚РЅС‹Р№ СЃРµСЂРІРµСЂ
- РќРµС‚ РїСѓР±Р»РёС‡РЅРѕРіРѕ username
- Р”РѕСЃС‚СѓРї РїРѕ ID: `/server/:id/channel/:channelName`
- Р’СЃС‚СѓРїР»РµРЅРёРµ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· Р·Р°СЏРІРєСѓ (Request Access)
- Owner РїСЂРёРЅРёРјР°РµС‚/РѕС‚РєР»РѕРЅСЏРµС‚ Р·Р°СЏРІРєРё
- РџСЂРёРјРµСЂ: `/server/123/channel/general`

---

## Р РѕР»Рё Рё РїСЂР°РІР°

| Р РѕР»СЊ | Rank | РџСЂР°РІР° |
|------|------|-------|
| Owner | 100 | РџРѕР»РЅС‹Р№ РґРѕСЃС‚СѓРї, СѓРґР°Р»РµРЅРёРµ СЃРµСЂРІРµСЂР°, РїРµСЂРµРґР°С‡Р° РІР»Р°РґРµРЅРёСЏ |
| Admin | 80 | РЈРїСЂР°РІР»РµРЅРёРµ РєР°РЅР°Р»Р°РјРё, СЂРѕР»СЏРјРё, РєРёРє/Р±Р°РЅ, РёРЅРІР°Р№С‚С‹ |
| Moderator | 50 | РЈРґР°Р»РµРЅРёРµ СЃРѕРѕР±С‰РµРЅРёР№, РєРёРє, С‚Р°Р№РјР°СѓС‚, Р·Р°РєСЂРµРї СЃРѕРѕР±С‰РµРЅРёР№ |
| Member | 10 | Р§С‚РµРЅРёРµ РєР°РЅР°Р»РѕРІ, РѕС‚РїСЂР°РІРєР° СЃРѕРѕР±С‰РµРЅРёР№ |

**РџСЂР°РІРёР»Рѕ:** РќРµР»СЊР·СЏ СѓРїСЂР°РІР»СЏС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»РµРј СЃ СЂРѕР»СЊСЋ в‰Ґ СЃРІРѕРµР№.

---

## API Endpoints

### РЎРѕР·РґР°РЅРёРµ СЃРµСЂРІРµСЂР°
```
POST /api/servers
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "name": "Gaming Hub",
  "username": "gaminghub", // С‚РѕР»СЊРєРѕ РґР»СЏ public
  "type": "public" | "private",
  "description": "..." // optional
}
```

### РџРѕР»СѓС‡РёС‚СЊ РјРѕРё СЃРµСЂРІРµСЂС‹
```
GET /api/servers/my
Authorization: Bearer <token>
```

### РџРѕР»СѓС‡РёС‚СЊ РїСѓР±Р»РёС‡РЅС‹Рµ СЃРµСЂРІРµСЂС‹
```
GET /api/servers/public
Authorization: Bearer <token>
```

### РџРѕР»СѓС‡РёС‚СЊ СЃРµСЂРІРµСЂ
```
GET /api/servers/:identifier
Authorization: Bearer <token>
```

### РћР±РЅРѕРІРёС‚СЊ СЃРµСЂРІРµСЂ (Owner)
```
PUT /api/servers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name",
  "description": "...",
  "username": "newusername" // С‚РѕР»СЊРєРѕ РґР»СЏ public
}
```

### РЈРґР°Р»РёС‚СЊ СЃРµСЂРІРµСЂ (Owner)
```
DELETE /api/servers/:id
Authorization: Bearer <token>
```

### Р’СЃС‚СѓРїРёС‚СЊ РІ РїСѓР±Р»РёС‡РЅС‹Р№ СЃРµСЂРІРµСЂ
```
POST /api/servers/:id/join
Authorization: Bearer <token>
```

### РџРѕРґР°С‚СЊ Р·Р°СЏРІРєСѓ РІ РїСЂРёРІР°С‚РЅС‹Р№ СЃРµСЂРІРµСЂ
```
POST /api/servers/:id/request-join
Authorization: Bearer <token>
```

### РџСЂРёРЅСЏС‚СЊ Р·Р°СЏРІРєСѓ (Owner)
```
POST /api/servers/:id/requests/:requestId/approve
Authorization: Bearer <token>
```

### РћС‚РєР»РѕРЅРёС‚СЊ Р·Р°СЏРІРєСѓ (Owner)
```
POST /api/servers/:id/requests/:requestId/reject
Authorization: Bearer <token>
```

### РџРѕР»СѓС‡РёС‚СЊ Р·Р°СЏРІРєРё (Owner)
```
GET /api/servers/:id/requests
Authorization: Bearer <token>
```

### РџРѕРєРёРЅСѓС‚СЊ СЃРµСЂРІРµСЂ
```
POST /api/servers/:id/leave
Authorization: Bearer <token>
```

### РЎРѕР·РґР°С‚СЊ РєР°РЅР°Р» (Admin+)
```
POST /api/servers/:id/channels
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "new-channel" }
```

### РџРѕР»СѓС‡РёС‚СЊ СѓС‡Р°СЃС‚РЅРёРєРѕРІ СЃРµСЂРІРµСЂР°
```
GET /api/servers/:id/members
Authorization: Bearer <token>
```

### РР·РјРµРЅРёС‚СЊ СЂРѕР»СЊ СѓС‡Р°СЃС‚РЅРёРєР° (Owner/Admin)
```
PUT /api/servers/:serverId/members/:memberId/role
Authorization: Bearer <token>
Content-Type: application/json

{ "roleId": 2 }
```

### РљРёРєРЅСѓС‚СЊ СѓС‡Р°СЃС‚РЅРёРєР° (Owner/Admin/Moderator)
```
DELETE /api/servers/:serverId/members/:memberId
Authorization: Bearer <token>
```

### РџРѕР»СѓС‡РёС‚СЊ СЃРѕРѕР±С‰РµРЅРёСЏ РєР°РЅР°Р»Р°
```
GET /api/servers/:serverId/channels/:channelId/messages?limit=50
Authorization: Bearer <token>
```

### РћС‚РїСЂР°РІРёС‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ
```
POST /api/servers/:serverId/channels/:channelId/messages
Authorization: Bearer <token>
Content-Type: application/json

{ "text": "Hello!" }
```

### Р—Р°РіСЂСѓР·РёС‚СЊ С„Р°Р№Р»
```
POST /api/servers/:serverId/channels/:channelId/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

---

## WebSocket СЃРѕР±С‹С‚РёСЏ

### РљР»РёРµРЅС‚ в†’ РЎРµСЂРІРµСЂ
- `server:subscribe` вЂ” РїРѕРґРїРёСЃРєР° РЅР° РѕР±РЅРѕРІР»РµРЅРёСЏ СЃРµСЂРІРµСЂР°
- `server:unsubscribe` вЂ” РѕС‚РїРёСЃРєР°
- `server:message_read` вЂ” РїСЂРѕС‡РёС‚Р°РЅРѕ СЃРѕРѕР±С‰РµРЅРёРµ

### РЎРµСЂРІРµСЂ в†’ РљР»РёРµРЅС‚
- `server:created` вЂ” СЃРµСЂРІРµСЂ СЃРѕР·РґР°РЅ
- `server:deleted` вЂ” СЃРµСЂРІРµСЂ СѓРґР°Р»РµРЅ
- `server:member_joined` вЂ” СѓС‡Р°СЃС‚РЅРёРє РІСЃС‚СѓРїРёР»
- `server:member_left` вЂ” СѓС‡Р°СЃС‚РЅРёРє РїРѕРєРёРЅСѓР»
- `server:join_request` вЂ” РЅРѕРІР°СЏ Р·Р°СЏРІРєР° (Owner)
- `server:join_request_updated` вЂ” СЃС‚Р°С‚СѓСЃ Р·Р°СЏРІРєРё РёР·РјРµРЅС‘РЅ
- `server:channel_created` вЂ” РєР°РЅР°Р» СЃРѕР·РґР°РЅ
- `channel:new_message` вЂ” РЅРѕРІРѕРµ СЃРѕРѕР±С‰РµРЅРёРµ РІ РєР°РЅР°Р»Рµ

---

## РЎС‚СЂР°РЅРёС†С‹

### `/servers` вЂ” РљР°С‚Р°Р»РѕРі СЃРµСЂРІРµСЂРѕРІ
- **Discover:** РџРѕРёСЃРє Рё РїСЂРѕСЃРјРѕС‚СЂ РїСѓР±Р»РёС‡РЅС‹С… СЃРµСЂРІРµСЂРѕРІ
- **My Servers:** РЎРµСЂРІРµСЂС‹ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ

### `/server/:identifier` вЂ” Р“Р»Р°РІРЅР°СЏ СЃРµСЂРІРµСЂР°
- РџРµСЂРµРЅР°РїСЂР°РІР»СЏРµС‚ РЅР° `/server/:identifier/channel/:channelName`

### `/server/:identifier/channel/:channelName` вЂ” РљР°РЅР°Р» СЃРµСЂРІРµСЂР°
- Р§Р°С‚ РєР°РЅР°Р»Р°
- Р‘РѕРєРѕРІР°СЏ РїР°РЅРµР»СЊ СЃ РєР°РЅР°Р»Р°РјРё
- Р—Р°СЏРІРєРё РЅР° РІСЃС‚СѓРїР»РµРЅРёРµ (РґР»СЏ Owner)

### `/server/:identifier/settings` вЂ” РќР°СЃС‚СЂРѕР№РєРё СЃРµСЂРІРµСЂР°
- РР·РјРµРЅРµРЅРёРµ РёРјРµРЅРё, РѕРїРёСЃР°РЅРёСЏ, username
- РЈРґР°Р»РµРЅРёРµ СЃРµСЂРІРµСЂР° (Owner)

### `/server/:identifier/members` вЂ” РЈС‡Р°СЃС‚РЅРёРєРё
- РЎРїРёСЃРѕРє СѓС‡Р°СЃС‚РЅРёРєРѕРІ
- РР·РјРµРЅРµРЅРёРµ СЂРѕР»РµР№ (Owner/Admin)
- РљРёРє СѓС‡Р°СЃС‚РЅРёРєРѕРІ (Owner/Admin/Moderator)

---

## Flow: Р—Р°РіСЂСѓР·РєР° СЃРµСЂРІРµСЂР°

1. **Р—Р°РіСЂСѓР·РєР° СЃРїРёСЃРєР° СЃРµСЂРІРµСЂРѕРІ**
   - `useMyServers()` / `usePublicServers()` в†’ GET `/api/servers/my` РёР»Рё `/api/servers/public`
   - РљСЌС€РёСЂРѕРІР°РЅРёРµ РІ React Query (staleTime: 5-10 РјРёРЅСѓС‚)

2. **Р’С‹Р±РѕСЂ СЃРµСЂРІРµСЂР°**
   - РќР°РІРёРіР°С†РёСЏ: `/server/:identifier`
   - `useServer(identifier)` в†’ GET `/api/servers/:identifier`
   - РџРѕР»СѓС‡РµРЅРёРµ РґР°РЅРЅС‹С… СЃРµСЂРІРµСЂР° + РєР°РЅР°Р»С‹ + СЂРѕР»СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ

3. **Р’С‹Р±РѕСЂ РєР°РЅР°Р»Р°**
   - РќР°РІРёРіР°С†РёСЏ: `/server/:identifier/channel/:channelName`
   - `useChannelMessages(serverId, channelId)` в†’ GET `/api/servers/:serverId/channels/:channelId/messages`
   - РџРѕРґРїРёСЃРєР° РЅР° WebSocket: `channel:new_message`

4. **РћС‚РїСЂР°РІРєР° СЃРѕРѕР±С‰РµРЅРёСЏ**
   - `useSendChannelMessage()` в†’ POST `/api/servers/:serverId/channels/:channelId/messages`
   - РћРїС‚РёРјРёСЃС‚РёС‡РЅРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ UI
   - РРЅРІР°Р»РёРґР°С†РёСЏ РєСЌС€Р° СЃРѕРѕР±С‰РµРЅРёР№
   - WebSocket СѓРІРµРґРѕРјР»РµРЅРёРµ РґСЂСѓРіРёРј РєР»РёРµРЅС‚Р°Рј

5. **Real-time РѕР±РЅРѕРІР»РµРЅРёСЏ**
   - РџРѕРґРєР»СЋС‡РµРЅРёРµ WebSocket РїСЂРё Р·Р°РіСЂСѓР·РєРµ СЃС‚СЂР°РЅРёС†С‹
   - РћР±СЂР°Р±РѕС‚РєР° СЃРѕР±С‹С‚РёР№: `channel:new_message`, `server:member_joined`, etc.
   - РђРІС‚РѕСЃРєСЂРѕР»Р» Рє РЅРѕРІС‹Рј СЃРѕРѕР±С‰РµРЅРёСЏРј

---

## Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ

- вњ… Р’СЃРµ endpoints Р·Р°С‰РёС‰РµРЅС‹ `authenticateToken`
- вњ… РџСЂРѕРІРµСЂРєР° РїСЂР°РІ РїСЂРё РєР°Р¶РґРѕРј РґРµР№СЃС‚РІРёРё (`requireMinRank`, `requireCanManageMember`)
- вњ… Owner РЅРµР»СЊР·СЏ Р·Р°Р±Р°РЅРёС‚СЊ/РєРёРєРЅСѓС‚СЊ/РїРѕРЅРёР·РёС‚СЊ
- вњ… РџСЂРё СѓРґР°Р»РµРЅРёРё СЃРµСЂРІРµСЂР° РєР°СЃРєР°РґРЅРѕ СѓРґР°Р»СЏСЋС‚СЃСЏ: РєР°РЅР°Р»С‹, СѓС‡Р°СЃС‚РЅРёРєРё, Р·Р°СЏРІРєРё
- вњ… Zod РІР°Р»РёРґР°С†РёСЏ РІСЃРµС… РІС…РѕРґСЏС‰РёС… РґР°РЅРЅС‹С…
- вњ… Rate limiting РЅР° endpoints

---

## РЎС‚СЂСѓРєС‚СѓСЂР° URL

```
/server/:identifier/channel/:channelName
```

Р“РґРµ:
- `identifier` = `username` (public) РёР»Рё `id` (private)
- `channelName` = РёРјСЏ РєР°РЅР°Р»Р° (РЅР°РїСЂРёРјРµСЂ, `general`)

---

## Р РµР°Р»РёР·РѕРІР°РЅРЅС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р»

### вњ… РЎРµСЂРІРµСЂС‹
- [x] РЎРѕР·РґР°РЅРёРµ СЃРµСЂРІРµСЂР° (public/private)
- [x] РџРѕР»СѓС‡РµРЅРёРµ СЃРїРёСЃРєР° СЃРµСЂРІРµСЂРѕРІ (my/public)
- [x] РџРѕР»СѓС‡РµРЅРёРµ СЃРµСЂРІРµСЂР° РїРѕ identifier
- [x] РћР±РЅРѕРІР»РµРЅРёРµ РЅР°СЃС‚СЂРѕРµРє СЃРµСЂРІРµСЂР°
- [x] РЈРґР°Р»РµРЅРёРµ СЃРµСЂРІРµСЂР°

### вњ… Р§Р»РµРЅСЃС‚РІРѕ
- [x] Р’СЃС‚СѓРїР»РµРЅРёРµ РІ public СЃРµСЂРІРµСЂ
- [x] Р—Р°СЏРІРєР° РІ private СЃРµСЂРІРµСЂ
- [x] РџСЂРёРЅСЏС‚РёРµ/РѕС‚РєР»РѕРЅРµРЅРёРµ Р·Р°СЏРІРѕРє
- [x] РџРѕРєРёРґР°РЅРёРµ СЃРµСЂРІРµСЂР°
- [x] РџСЂРѕСЃРјРѕС‚СЂ СѓС‡Р°СЃС‚РЅРёРєРѕРІ

### вњ… Р РѕР»Рё
- [x] РЎРёСЃС‚РµРјР° СЂРѕР»РµР№ (Owner/Admin/Moderator/Member)
- [x] РР·РјРµРЅРµРЅРёРµ СЂРѕР»Рё СѓС‡Р°СЃС‚РЅРёРєР°
- [x] РљРёРє СѓС‡Р°СЃС‚РЅРёРєР°
- [x] РџСЂРѕРІРµСЂРєР° РїСЂР°РІ (rank system)

### вњ… РљР°РЅР°Р»С‹
- [x] РЎРѕР·РґР°РЅРёРµ РєР°РЅР°Р»РѕРІ
- [x] РџСЂРѕСЃРјРѕС‚СЂ РєР°РЅР°Р»РѕРІ
- [x] РќР°РІРёРіР°С†РёСЏ РїРѕ РєР°РЅР°Р»Р°Рј

### вњ… РЎРѕРѕР±С‰РµРЅРёСЏ
- [x] РћС‚РїСЂР°РІРєР° СЃРѕРѕР±С‰РµРЅРёР№
- [x] РџРѕР»СѓС‡РµРЅРёРµ РёСЃС‚РѕСЂРёРё СЃРѕРѕР±С‰РµРЅРёР№
- [x] Р—Р°РіСЂСѓР·РєР° С„Р°Р№Р»РѕРІ
- [x] РЈРґР°Р»РµРЅРёРµ СЃРѕРѕР±С‰РµРЅРёР№ (author/moderator+)
- [x] РћС‚РІРµС‚С‹ РЅР° СЃРѕРѕР±С‰РµРЅРёСЏ (reply)
- [x] WebSocket СѓРІРµРґРѕРјР»РµРЅРёСЏ

### вњ… UI
- [x] РљР°С‚Р°Р»РѕРі СЃРµСЂРІРµСЂРѕРІ (Discover/My)
- [x] РЎС‚СЂР°РЅРёС†Р° СЃРµСЂРІРµСЂР°
- [x] РќР°СЃС‚СЂРѕР№РєРё СЃРµСЂРІРµСЂР°
- [x] РЈРїСЂР°РІР»РµРЅРёРµ СѓС‡Р°СЃС‚РЅРёРєР°РјРё
- [x] ServerSidebar
- [x] ChannelChat
- [x] ChannelMessageList
- [x] ChannelComposer

---

## Known Pitfalls

### 1. Р Р°СЃСЃРёРЅС…СЂРѕРЅ РєСЌС€Р°
**РџСЂРѕР±Р»РµРјР°:** РџРѕСЃР»Рµ РѕС‚РїСЂР°РІРєРё СЃРѕРѕР±С‰РµРЅРёСЏ РєСЌС€ РјРѕР¶РµС‚ РЅРµ РѕР±РЅРѕРІРёС‚СЊСЃСЏ СЃСЂР°Р·Сѓ.

**Р РµС€РµРЅРёРµ:** РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ `invalidateQueries` РїРѕСЃР»Рµ РјСѓС‚Р°С†РёРё:
```typescript
queryClient.invalidateQueries({ 
  queryKey: queryKeys.messages.channel(serverId, channelId) 
});
```

### 2. РћС‚РїРёСЃРєР° РѕС‚ WebSocket
**РџСЂРѕР±Р»РµРјР°:** РџСЂРё СѓС…РѕРґРµ СЃРѕ СЃС‚СЂР°РЅРёС†С‹ WebSocket РїРѕРґРїРёСЃРєРё РѕСЃС‚Р°СЋС‚СЃСЏ.

**Р РµС€РµРЅРёРµ:** РћС‡РёС‰Р°С‚СЊ РїРѕРґРїРёСЃРєРё РІ `useEffect` cleanup:
```typescript
useEffect(() => {
  const unsubscribe = wsService.on('channel:new_message', handler);
  return () => unsubscribe();
}, []);
```

### 3. РЎРєСЂРѕР»Р» Рє РЅРѕРІС‹Рј СЃРѕРѕР±С‰РµРЅРёСЏРј
**РџСЂРѕР±Р»РµРјР°:** РџСЂРё Р·Р°РіСЂСѓР·РєРµ СЃС‚Р°СЂС‹С… СЃРѕРѕР±С‰РµРЅРёР№ СЃРєСЂРѕР»Р» СЃР±РёРІР°РµС‚СЃСЏ.

**Р РµС€РµРЅРёРµ:** РЎРѕС…СЂР°РЅСЏС‚СЊ РїРѕР·РёС†РёСЋ СЃРєСЂРѕР»Р»Р° Рё РІРѕСЃСЃС‚Р°РЅР°РІР»РёРІР°С‚СЊ РїРѕСЃР»Рµ Р·Р°РіСЂСѓР·РєРё.

### 4. Р”СѓР±Р»РёСЂРѕРІР°РЅРёРµ СЃРѕРѕР±С‰РµРЅРёР№
**РџСЂРѕР±Р»РµРјР°:** РЎРѕРѕР±С‰РµРЅРёРµ РїСЂРёС…РѕРґРёС‚ Рё РѕС‚ API, Рё РѕС‚ WebSocket.

**Р РµС€РµРЅРёРµ:** РџСЂРѕРІРµСЂСЏС‚СЊ `messageId` Рё РЅРµ РґРѕР±Р°РІР»СЏС‚СЊ РґСѓР±Р»РёРєР°С‚С‹.

---

## TODO (РџР»Р°РЅС‹ РЅР° Р±СѓРґСѓС‰РµРµ)

- [ ] Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ/СѓРґР°Р»РµРЅРёРµ РєР°РЅР°Р»РѕРІ
- [ ] РЎРёСЃС‚РµРјР° Р±Р°РЅРѕРІ
- [ ] РўР°Р№РјР°СѓС‚С‹
- [ ] Р—Р°РєСЂРµРїР»С‘РЅРЅС‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ
- [ ] РџРѕРёСЃРє РїРѕ СЃРѕРѕР±С‰РµРЅРёСЏРј
- [ ] РЈРІРµРґРѕРјР»РµРЅРёСЏ Рѕ РїСЂРѕС‡С‚РµРЅРёРё
- [ ] РРЅРІР°Р№С‚С‹ СЃ СЃСЂРѕРєРѕРј РґРµР№СЃС‚РІРёСЏ
- [ ] РџРµСЂРµРґР°С‡Р° РІР»Р°РґРµРЅРёСЏ
- [ ] Р›РѕРі Р°СѓРґРёС‚Р° СЃРµСЂРІРµСЂР°
- [ ] Voice РєР°РЅР°Р»С‹ (mediasoup-client РіРѕС‚РѕРІ)

---

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [API Documentation](../backend/API.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Features Inventory](./FEATURES_INVENTORY.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.md)

