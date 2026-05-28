# LUME ж¶€жЃЇпј€Messagesпј‰UI

дё­ж–‡ | [Р СѓСЃСЃРєРёР№](../../docs-ru/PROJECT_UI/MESSAGES_UI.ru.md) | [English](../../docs/PROJECT_UI/MESSAGES_UI.md)

**жњЂеђЋж›ґж–°пјљ** 2026-05-19

---

## ж¦‚и§€

Messages жЏђдѕ›е®ћж—¶зљ„дёЂеЇ№дёЂз§ЃиЃЉгЂ‚

**ж–‡д»¶пјљ**
- йЎµйќўпјљ`src/pages/Messages.tsx` в†’ `src/pages/messages/MessagesPage.tsx`
- з»„д»¶пјљ`src/pages/messages/components/`
- Hooksпјљ`src/pages/messages/hooks/`

---

## йЎµйќўз»“жћ„

```
иЃЉе¤©е€—иЎЁпј€е·¦пј‰
иЃЉе¤©йќўжќїпј€еЏіпј‰
```

---

## иЃЉе¤©е€—иЎЁ

**ж–‡д»¶пјљ** `src/pages/messages/components/ChatList.tsx`

- жђњзґўиѕ“е…ҐжЎ†
- иЃЉе¤©йЎ№ + жњЄиЇ»и®Ўж•° badge

---

## иЃЉе¤©йќўжќї

**ж–‡д»¶пјљ** `src/pages/messages/components/ChatPanel.tsx`

- е¤ґйѓЁпјље¤ґеѓЏгЂЃеђЌз§°гЂЃењЁзєїзЉ¶жЂЃ
- ж¶€жЃЇе€—иЎЁ
- иѕ“е…ҐжЎ†

---

## ж¶€жЃЇе€—иЎЁдёЋж°”жіЎ

**ж–‡д»¶пјљ** `src/pages/messages/components/MessageList.tsx`

- ж”ЇжЊЃе›ће¤ЌдёЋй™„д»¶
- и‡Єе·±зљ„ж¶€жЃЇжѕз¤єе·ІиЇ»е›ћж‰§
- иѕ“е…ҐзЉ¶жЂЃжЊ‡з¤єе™Ё
- иЇ­йџіж¶€жЃЇпј€еЅ•е€¶ + ж’­ж”ѕпј‰
- "зћ¬й—ґ"ж¶€жЃЇпј€TTL + е·ІиЇ»и·џиёЄпј‰
- **NPM Package Preview** вЂ” и‡ЄеЉЁиЇ†е€« `npm <package>` е‘Ѕд»¤

---

## NPM Package Previewпј€NPM еЊ…йў„и§€пј‰

**жЈЂжµ‹пјљ** `src/utils/npmDetector.ts`

- жЁЎејЏпјљ`npm <package>`пј€дѕ‹е¦‚ `npm react`гЂЃ`npm express`гЂЃ`npm @types/node`пј‰
- ж­Је€™иЎЁиѕѕејЏпјљ`/^npm\s+([@a-z0-9-/]+)/i`

**з»„д»¶пјљ** `src/components/npm/NpmPackageCard.tsx`

- Glass panel UIпј€жЇ›зЋ»з’ѓйќўжќїпј‰
- жѕз¤єпјљеЊ…еђЌгЂЃз‰€жњ¬гЂЃжЏЏиї°гЂЃnpmjs.com й“ѕжЋҐ
- еЉ иЅЅж—¶жѕз¤єйЄЁжћ¶е±Џ
- жњЄж‰ѕе€°еЊ…ж—¶жѕз¤є fallback

**еђЋз«Їпјљ** `backend/src/npm.js`

- жЋҐеЏЈпјљ`GET /api/npm/:packageName`
- иЇ·ж±‚пјљ`https://registry.npmjs.org/:packageName`
- иї”е›ћпјљ`{ name, version, description, url }`
- е†…е­зј“е­пј€15 е€†й’џ TTLпј‰

---

## иѕ“е…ҐжЎ†

**ж–‡д»¶пјљ** `src/pages/messages/components/MessageComposer.tsx`

- е›ће¤ЌжќЎ
- й™„д»¶
- еЏ‘йЂЃжЊ‰й’®
- media ејЂе…іпј€ж¶€е¤±е›ѕз‰‡пј‰
- иЇ­йџіеЅ•е€¶

---

## зЉ¶жЂЃ

| зЉ¶жЂЃ | иЎЊдёє |
|------|------|
| Loading | Skeleton е€—иЎЁ |
| Empty | "жљ‚ж— иЃЉе¤©" еЌ дЅЌ |
| Error | й‡ЌиЇ•жЊ‰й’® |

---

## Hooksпј€й’©е­ђпј‰

- `useChats`
- `useChatMessages`
- `useSendMessage`
- `useChatWs`

---

## WebSocket дє‹д»¶

**еЏ‘йЂЃпјљ** `typing:start`, `chat:read`

**жЋҐж”¶пјљ** `new_message`, `typing:update`, `chat:read_update`

---

## ж»љеЉЁиЎЊдёє

- ж–°ж¶€жЃЇи‡ЄеЉЁж»љеЉЁе€°еє•йѓЁ
- еЉ иЅЅеЋ†еЏІж—¶дїќжЊЃж»љеЉЁдЅЌзЅ®

---

## Momentsпј€ж¶€е¤±еЄ’дЅ“пј‰

- TTL ж¶€е¤±е›ѕз‰‡пј€24 е°Џж—¶пј‰
- ж‰“ејЂ token жµЃпјљ`POST /media/:id/open` в†’ з­ѕеђЌе†…е®№ URL
- е·ІиЇ»ж ‡и®°пјљ`POST /media/:id/viewed`
- е·ІжџҐзњ‹еђЋйљђи—Џ

---

## иЇ­йџіж¶€жЃЇ

- иЃЉе¤©иѕ“е…ҐжЎ†е†…еЅ•е€¶ UI
- ж¶€жЃЇж°”жіЎе†…ж’­ж”ѕ UI
- дёЉдј жЋҐеЏЈпјљ`POST /messages/voice`

---

## ж¶€жЃЇе¤љйЂ‰

**ж–‡д»¶пјљ**
- зЉ¶жЂЃпјљ`src/pages/messages/MessagesPage.tsx`пј€`selectedMessages` зЉ¶жЂЃпј‰
- UIпјљйЂ‰ж‹©ж¶€жЃЇж—¶ењЁж¶€жЃЇе€—иЎЁдёЉж–№жѕз¤єе·Ґе…·ж Џ
- дёЉдё‹ж–‡иЏњеЌ•пјљ`src/components/chat/MessageContextMenu.tsx`

### еЉџиѓЅ

- **йЂ‰ж‹©и§¦еЏ‘пјљ** з‚№е‡»ж¶€жЃЇд»…ењЁе·Іе¤„дєЋе¤љйЂ‰жЁЎејЏж—¶йЂ‰ж‹©пј€й¦–ж¬ЎйЂ‰ж‹©ж“ЌдЅњеђЋпј‰
- **и§†и§‰еЏЌй¦€пјљ** йЂ‰дё­зљ„ж¶€жЃЇжѕз¤єе‹ѕеЏ·пј€з™Ѕи‰І/20 иѓЊж™ЇпјЊз™Ѕи‰Іиѕ№жЎ†пј‰
- **е·Ґе…·ж Џпјљ** е‡єзЋ°ењЁж¶€жЃЇеЊєеџџйЎ¶йѓЁпјЊжѕз¤єпјљйЂ‰дё­ж•°й‡Џ + е€ й™¤жЊ‰й’® + еЏ–ж¶€жЊ‰й’®
- **жё…й™¤йЂ‰ж‹©пјљ** е€‡жЌўиЃЉе¤©ж—¶и‡ЄеЉЁжё…й™¤пј€useEffectпј‰

### жќѓй™ђ

| иЃЉе¤©з±»ећ‹ | и§’и‰І | еЏЇз”Ёж“ЌдЅњ |
|----------|------|----------|
| з§ЃиЃЉ | - | йЂ‰ж‹©гЂЃе¤Ќе€¶гЂЃд»…дёєж€‘е€ й™¤гЂЃдёєж‰Ђжњ‰дєєе€ й™¤ |
| зѕ¤з»„ | - | йЂ‰ж‹©гЂЃе¤Ќе€¶гЂЃд»…дёєж€‘е€ й™¤гЂЃдёєж‰Ђжњ‰дєєе€ й™¤пј€д»…и‡Єе·±зљ„ж¶€жЃЇпј‰ |
| йў‘йЃ“ | еЏ‚дёЋиЂ… | д»…е¤Ќе€¶ |
| йў‘йЃ“ | з®Ўзђ†е‘ | е›ће¤ЌгЂЃе¤Ќе€¶ |
| йў‘йЃ“ | ж‰Ђжњ‰иЂ… | е›ће¤ЌгЂЃйЂ‰ж‹©гЂЃе¤Ќе€¶гЂЃдёєж‰Ђжњ‰дєєе€ й™¤ |

### ж‰№й‡Џе€ й™¤

- **жЋҐеЏЈпјљ** `POST /api/chats/:chatId/messages/bulk-delete`
- **иЇ·ж±‚дЅ“пјљ** `{ messageIds: string[], scope: "me" | "all" }`
- **й™ђе€¶пјљ** жЇЏж¬ЎжњЂе¤љ 100 жќЎж¶€жЃЇ
- **PostgreSQLпјљ** дЅїз”Ё `ANY($1::bigint[])` ж•°з»„иЇ­жі•

### зї»иЇ‘

ж–°еўћй”®еЂје€° `src/i18n/locales/`пјљ
- `messages.select` вЂ” "йЂ‰ж‹©"
- `messages.selected` вЂ” "е·ІйЂ‰ж‹©"
- `messages.deleteSelected` вЂ” "е€ й™¤е·ІйЂ‰ж‹©"
- `messages.deleteSelectedForMe` вЂ” "д»…дёєж€‘е€ й™¤"
- `messages.deleteSelectedForAll` вЂ” "дёєж‰Ђжњ‰дєєе€ й™¤"
- `messages.cancelSelection` вЂ” "еЏ–ж¶€йЂ‰ж‹©"
- `messages.maxSelectionError` вЂ” "жњЂе¤љеЏЇд»ҐйЂ‰ж‹©100жќЎж¶€жЃЇ"

---

## з›ёе…іж–‡жЎЈ

- [Overview](./OVERVIEW.cn.md)
- [Style System](./STYLE_SYSTEM.cn.md)
- [Groups UI](./GROUPS_UI.cn.md)

