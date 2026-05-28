# LUME еЉџиѓЅжё…еЌ•

дё­ж–‡ | [Р СѓСЃСЃРєРёР№](../docs-ru/FEATURES_INVENTORY.ru.md) | [English](../docs/FEATURES_INVENTORY.md)

**жњЂеђЋж›ґж–°пјљ** 2026-05-19
**зЉ¶жЂЃпјљ** вњ… жњЂж–°

д»Ґдё‹е€—е‡єзљ„жЇ LUME йЎ№з›®дё­**е·Іе®ћй™…е®ћзЋ°**зљ„еЉџиѓЅгЂ‚

---

## рџЏ  Landing & Public Pages

### Landing Page
- **и·Їз”±пјљ** `/`
- **ж–‡д»¶пјљ** `src/pages/LandingPage.tsx`, `src/layouts/LandingLayout.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **иЇґжЋпјљ** йќўеђ‘е…¬дј—зљ„й¦–йЎµпјЊе±•з¤єдё»и¦ЃеЉџиѓЅ
- **з»„д»¶пјљ**
  - Hero еЊєеџџдёЋ CTA жЊ‰й’®
  - Feature cardsпј€6 дёЄеЌЎз‰‡пј‰
  - Footer й“ѕжЋҐеЊє

### йќ™жЂЃйЎµйќў
- **и·Їз”±пјљ** `/faq`, `/rules`, `/support`, `/status`, `/contacts`
- **ж–‡д»¶пјљ** `src/pages/FAQPage.tsx`, `RulesPage.tsx`, `SupportPage.tsx`, `StatusPage.tsx`, `ContactsPage.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **иЇґжЋпјљ** дїЎжЃЇз±»йЎµйќў

---

## рџ“њ Legal & Compliance

### жі•еѕ‹йЎµйќў
- **и·Їз”±пјљ** `/privacy-policy`, `/terms-of-service`, `/cookie-policy`
- **ж–‡д»¶пјљ** `src/pages/PrivacyPolicy.tsx`, `src/pages/TermsOfService.tsx`, `src/pages/CookiePolicy.tsx`, `src/pages/LegalPageLayout.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **иЇґжЋпјљ** е…¬е…±жі•еѕ‹йЎµйќўпј€ж”їз­–дёЋжќЎж¬ѕпј‰

### Cookie еђЊж„ЏжЁЄе№…
- **ж–‡д»¶пјљ** `src/components/ui/CookieBanner.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ** Accept/DeclineгЂЃжЊ‡еђ‘ Cookie Policy зљ„й“ѕжЋҐгЂЃйЂ‰ж‹©жЊЃд№…еЊ–пј€`src/lib/cookieConsent.ts`пј‰

---

## рџ“° Feed & Posts

### еЉЁжЂЃдїЎжЃЇжµЃпј€Feedпј‰
- **и·Їз”±пјљ** `/feed`
- **ж–‡д»¶пјљ** `src/pages/Index.tsx`, `src/components/feed/PostComposer.tsx`, `src/components/feed/FeedHeader.tsx`, `src/components/post/Post.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ**
  - дё¤дёЄж ‡з­ѕйЎµпјљвЂњFor YouвЂќпј€recommendedпј‰дёЋвЂњFollowingвЂќпј€followingпј‰
  - жњЂй•ї 420 е­—зљ„ж–‡жњ¬ + е›ѕз‰‡
  - вЂњResonanceвЂќпј€з‚№иµћпј‰
  - иЎЁжѓ…иЇ„и®є
  - иЅ¬еЏ‘
  - зЅ®йЎ¶её–е­ђ
  - WebSocket е®ћж—¶ж›ґж–°
  - жЇЏ 30 з§’и‡ЄеЉЁе€·ж–°
  - ж–°её–е­ђжЏђй†’

### её–е­ђз»„д»¶
- **ж–‡д»¶пјљ** `src/components/post/Post.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ**
  - ж–‡жњ¬дёЋе›ѕз‰‡е±•з¤є
  - Resonanceпј€з‚№иµћпј‰и®Ўж•°
  - иЇ„и®єж•°
  - е›ће¤ЌжЊ‰й’®
  - Emoji picker еЏЌеє”
  - дёЉдё‹ж–‡иЏњеЌ•пј€е€ й™¤гЂЃдёѕжЉҐгЂЃзЅ®йЎ¶пј‰
  - Image viewer ж”ѕе¤§
  - Link previewпј€Open Graphпј‰

---

## рџ’¬ Messages & Chat

### ж¶€жЃЇзі»з»џ
- **и·Їз”±пјљ** `/messages`, `/messages/:chatId`
- **ж–‡д»¶пјљ** `src/pages/Messages.tsx`, `src/pages/messages/MessagesPage.tsx`, `src/pages/messages/components/ChatList.tsx`, `src/pages/messages/components/ChatPanel.tsx`, `src/pages/messages/components/MessageList.tsx`, `src/pages/messages/components/MessageComposer.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ**
  - иЃЉе¤©е€—иЎЁдёЋжњЂеђЋж¶€жЃЇ
  - жњЄиЇ»и®Ўж•°
  - з§ЃиЃЉпј€дёЂеЇ№дёЂпј‰
  - ж–‡д»¶дёЋе›ѕз‰‡й™„д»¶
  - е›ће¤Ќпј€replyпј‰
  - е€ й™¤ж¶€жЃЇпј€д»…и‡Єе·±/еЏЊж–№пј‰
  - зЉ¶жЂЃпјљењЁзєїгЂЃдёЉж¬ЎењЁзєїгЂЃж­ЈењЁиѕ“е…Ґ
  - Read receiptsпј€е·ІиЇ»зЉ¶жЂЃпј‰
  - е€ й™¤зљ„дёЉдё‹ж–‡иЏњеЌ•
  - Image viewer ж”ѕе¤§

### Momentsпј€ж¶€е¤±з…§з‰‡пј‰
- **ж–‡д»¶пјљ** `src/pages/messages/MessagesPage.tsx`пј€е†…зЅ®пј‰
- **зЉ¶жЂЃпјљ** вљ пёЏ йѓЁе€†е®ћзЋ°
- **еЉџиѓЅпјљ**
  - TTL 24 е°Џж—¶зљ„ж¶€е¤±з…§з‰‡
  - з‚№е‡»жџҐзњ‹
  - з¦Ѓж­ўдё‹иЅЅ
  - зј©з•Ґе›ѕйў„и§€
  - е·ІиЇ»ж ‡и®°
- е€‡жЌўж ‡з­ѕйЎµи‡ЄеЉЁе…ій—­

### NPM Package Previewпј€NPM еЊ…йў„и§€пј‰
- **ж–‡д»¶пјљ** `backend/src/npm.js`, `src/components/npm/NpmPackageCard.tsx`, `src/utils/npmDetector.ts`
- **зЉ¶жЂЃ:** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ**
  - и‡ЄеЉЁиЇ†е€«ж¶€жЃЇдё­зљ„ npm е‘Ѕд»¤пј€`npm react`гЂЃ`npm express`гЂЃ`npm @types/node`пј‰
  - з«Їз‚№пјљ`GET /api/npm/:packageName` вЂ” д»Ћ npm Registry иЋ·еЏ–еЊ…ж•°жЌ®
  - UI еЌЎз‰‡жѕз¤єеЊ…еђЌгЂЃз‰€жњ¬гЂЃжЏЏиї°е’Њ npmjs.com й“ѕжЋҐ
  - LUME йЈЋж јзљ„ Glass UI и®ѕи®Ў
  - еЉ иЅЅж—¶жѕз¤єйЄЁжћ¶е±Џ
  - й”™иЇЇе¤„зђ†пј€жњЄж‰ѕе€°еЊ…ж—¶жѕз¤є fallbackпј‰
  - е“Ќеє”зј“е­пј€е†…е­дё­пјЊ15 е€†й’џпј‰

### е›ѕиЎЁжёІжџ“пј€Mermaidпј‰
- **ж–‡д»¶пјљ** `backend/src/routes/diagramRoutes.js`, `src/components/chat/DiagramMessage.tsx`
- **ж–‡жЎЈпјљ** [DIAGRAM_RENDERING.cn.md](DIAGRAM_RENDERING.cn.md)
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ**
  - и‡ЄеЉЁжЈЂжµ‹ Mermaid е›ѕиЎЁпј€graph TD/BT/LR/RL, flowchart TD/LR, pie, gitGraphпј‰
  - з«Їз‚№пјљ`POST /api/diagram/render` вЂ” йЂљиї‡ Kroki API жёІжџ“пј€`https://kroki.io/mermaid/svg`пј‰
  - Redis зј“е­пј€SHA256 е“€еёЊпјЊTTL: 1е°Џж—¶пј‰
  - SVG жёІжџ“её¦жё…зђ†пј€е®‰е…ЁжЂ§пј‰
  - жЊ‰й’®пјље¤Ќе€¶д»Јз ЃгЂЃдё‹иЅЅ SVGпј€её¦е‹ѕеЏ·еЉЁз”»пј‰
  - еЉ иЅЅж—¶жѕз¤єйЄЁжћ¶е±Џ
  - еЏ‘йЂЃеђЋи‡ЄеЉЁж»љеЉЁиЃЉе¤©

### Reply Bar
- **ж–‡д»¶пјљ** `src/components/chat/ReplyBar.tsx`
- **зЉ¶жЂЃ:** вњ… е·Іе®ћзЋ°
- **иЇґжЋпјљ** ж¶€жЃЇе›ће¤ЌжќЎз»„д»¶

---

## рџ‘Ґ Groups & Channels (Chats)

### зѕ¤з»„дёЋйў‘йЃ“пј€иЃЉе¤©пј‰
- **и·Їз”±пјљ** `/messages`, `/messages/:chatId`
- **ж–‡д»¶пјљ** `src/pages/Messages.tsx`, `src/pages/messages/MessagesPage.tsx`, `src/pages/messages/components/ChatList.tsx`, `src/pages/messages/components/ChatPanel.tsx`, `src/pages/messages/components/ChatSettingsModal.tsx`, `src/pages/messages/components/CreateChatModal.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ**
  - иЃЉе¤©з±»ећ‹пјљ`group`гЂЃ`channel`гЂЃ`private`
  - е€›е»єзѕ¤з»„/йў‘йЃ“
  - е…¬ејЂйў‘йЃ“зљ„жђњзґўдёЋеЉ е…Ґ
  - еЉ е…Ґз”іиЇ·пј€approve/rejectпј‰
  - ж€ђе‘дёЋи§’и‰Із®Ўзђ†

---

## рџ‘¤ Profile & Users

### дёЄдєєиµ„ж–™пј€ж€‘зљ„пј‰
- **и·Їз”±пјљ** `/profile`
- **ж–‡д»¶пјљ** `src/pages/Profile.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ**
  - е¤ґеѓЏдёЋжЁЄе№…
  - з»џи®ЎпјљзІ‰дёќгЂЃе…іжіЁгЂЃеё–е­ђ
  - зј–иѕ‘иµ„ж–™пј€bioгЂЃcityгЂЃwebsiteпј‰
  - зЅ®йЎ¶её–е­ђ
  - её–е­ђеЋ†еЏІ
  - е…іжіЁжЊ‰й’®пј€д»–дєєпј‰

### з”Ёж€·иµ„ж–™
- **и·Їз”±пјљ** `/profile/:userId`
- **ж–‡д»¶пјљ** `src/pages/UserProfile.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ**
  - жџҐзњ‹д»–дєєиµ„ж–™
  - е…іжіЁ/еЏ‘ж¶€жЃЇжЊ‰й’®
  - и®¤иЇЃзЉ¶жЂЃ

### Follow Modal
- **ж–‡д»¶пјљ** `src/components/profile/FollowModal.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **иЇґжЋпјљ** е…іжіЁ/зІ‰дёќе€—иЎЁеј№зЄ—

---

## вњ… Verification

### и®¤иЇЃйЎµйќў
- **и·Їз”±пјљ** `/verified`
- **ж–‡д»¶пјљ** `src/pages/Verified.tsx`, `src/components/verification/VerificationHero.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ**
  - йЂљиї‡ TikTok и§†йў‘жЏђдє¤з”іиЇ·
  - жќЎд»¶пјљжіЁе†Њ в‰Ґ7 е¤©пјЊи§†йў‘ в‰Ґ2000 жµЏи§€
  - з®Ўзђ†е‘е®Ўж ё
  - йЂљиї‡еђЋжњ‰ж•€ 1 дёЄжњ€
  - еѕЅз« пјљVerifiedгЂЃDeveloperгЂЃCEO

---

## вљ™пёЏ Settings

### иґ¦еЏ·и®ѕзЅ®
- **и·Їз”±пјљ** `/settings`
- **ж–‡д»¶пјљ** `src/pages/Settings.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ**
  - дё»йўпј€жљ—и‰І/дє®и‰Іпј‰
  - иЇ­иЁЂпј€ru/enпј‰
  - й›ЄиЉ±ж•€жћњејЂе…і
  - её–е­ђйљђз§Ѓ
  - ж¶€жЃЇйљђз§Ѓ
  - е€ й™¤иґ¦еЏ·

### дјљиЇќз®Ўзђ†
- **и·Їз”±пјљ** `/settings/sessions`
- **ж–‡д»¶пјљ** `src/pages/settings/SessionsPage.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ** еЅ“е‰ЌдјљиЇќгЂЃжґ»и·ѓдјљиЇќе€—иЎЁгЂЃйЂЂе‡єи®ѕе¤‡гЂЃlogout all

---

## рџ›ЎпёЏ Admin Panel

### з®Ўзђ†йќўжќї
- **и·Їз”±пјљ** `/admin`
- **ж–‡д»¶пјљ** `src/pages/AdminPanel.tsx`, `src/components/AdminPanelModal.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°пј€и®їй—®еЏ–е†ідєЋжќѓй™ђпј‰
- **еЉџиѓЅпјљ**
  - и®¤иЇЃиЇ·ж±‚
  - з”Ёж€·е€—иЎЁ
  - её–е­ђдёѕжЉҐ
  - йЂљиї‡/ж‹’з»ќи®¤иЇЃ
  - е€ й™¤её–е­ђ
  - й©іе›ћдёѕжЉҐ

---

## рџ”ђ Authentication

### з™»еЅ• / жіЁе†Њ
- **и·Їз”±пјљ** `/login`, `/register`
- **ж–‡д»¶пјљ** `src/pages/auth/Login.tsx`, `src/pages/auth/Register.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ**
  - й‚®з®± + еЇ†з Ѓ
  - username ж ЎйЄЊпј€жњЂе°‘ 5 дёЄе­—з¬¦пјЊж‹‰дёЃе­—жЇЌ + ж•°е­—пј‰
  - httpOnly cookies е­е‚Ё token
  - CSRF дїќжЉ¤
  - Rate limiting

---

## рџ”Ќ Explore

### жђњзґўдёЋеЏ‘зЋ°
- **и·Їз”±пјљ** `/explore`
- **ж–‡д»¶пјљ** `src/pages/Explore.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **еЉџиѓЅпјљ**
  - з”Ёж€·жђњзґў
  - е…¬ејЂйў‘йЃ“/иЃЉе¤©жђњзґў
  - и¶‹еЉїпј€зѓ­й—ЁиЇќйўпј‰
  - жЋЁиЌђз”Ёж€·

---

## рџ”§ System Pages

### 404 Not Found
- **и·Їз”±пјљ** `*`
- **ж–‡д»¶пјљ** `src/pages/NotFound.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°

### Error Boundary
- **ж–‡д»¶пјљ** `src/components/ErrorBoundary.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **иЇґжЋпјљ** жёІжџ“й”™иЇЇжЌ•иЋ·

---

## рџЊђ Internationalization (i18n)

### зї»иЇ‘
- **ж–‡д»¶пјљ** `src/i18n/translations.ts`, `src/i18n/locales/ru.json`, `en.json`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **иЇ­иЁЂпјљ** Р СѓСЃСЃРєРёР№, English
- **и§„жЁЎпјљ** 1000+ иЎЊзї»иЇ‘

---

## рџЋЁ UI Components

### shadcn/ui з»„д»¶пј€50+пј‰
- **ж–‡д»¶пјљ** `src/components/ui/*.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **з¤єдѕ‹пјљ** button, input, dialog, dropdown-menu, toast, skeleton, avatar, badge, card, tabs, switch, slider, progress, table, tooltip, popover, etc.

### и‡Єе®љд№‰з»„д»¶
- **ж–‡д»¶пјљ** `src/components/*.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **з¤єдѕ‹пјљ**
  - `Avatar.tsx` вЂ” её¦й¦–е­—жЇЌзљ„е¤ґеѓЏ
  - `Presence.tsx` вЂ” ењЁзєї/з¦»зєїжЊ‡з¤є
  - `LinkPreview.tsx` вЂ” Open Graph йў„и§€
  - `NavLink.tsx` вЂ” еЉЁз”»еЇји€Є
  - `ImageViewer.tsx` вЂ” е…Ёе±ЏжџҐзњ‹
  - `SnowEffect.tsx` вЂ” й›ЄиЉ±ж•€жћњ
  - `LogoutModal.tsx` вЂ” з™»е‡єеј№зЄ—
  - `CookieBanner.tsx` вЂ” Cookie еђЊж„ЏжќЎ

### Layout з»„д»¶
- **ж–‡д»¶пјљ** `src/components/layout/*.tsx`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **з¤єдѕ‹пјљ**
  - `AppLayout.tsx` вЂ” дё»еёѓе±Ђ
  - `SidebarLeft.tsx` вЂ” е·¦дѕ§ж Џпј€260pxпј‰
  - `SidebarRight.tsx` вЂ” еЏідѕ§ж Џпј€340pxпј‰

---

## рџ”Њ WebSocket Features

### е®ћж—¶дє‹д»¶
- **ж–‡д»¶пјљ** `src/services/websocket.ts`
- **зЉ¶жЂЃпјљ** вњ… е·Іе®ћзЋ°
- **дє‹д»¶пјљ**
  - `new_post` вЂ” ж–°её–е­ђ
  - `post_resonance_updated` вЂ” з‚№иµћж›ґж–°
  - `new_comment` вЂ” ж–°иЇ„и®є
  - `new_message` вЂ” ж–°ж¶€жЃЇ
  - `typing:update` вЂ” иѕ“е…ҐзЉ¶жЂЃ
  - `chat:read_update` вЂ” е·ІиЇ»ж›ґж–°
  - `message:deleted` вЂ” ж¶€жЃЇе€ й™¤
  - `presence:update` вЂ” ењЁзєїзЉ¶жЂЃ
  - `chat:read_update`
  - `channel:new_message` вЂ” йў‘йЃ“ж¶€жЃЇ

---

## рџ“Љ Summary

| е€†з±» | е·Іе®ћзЋ° | йѓЁе€† | Placeholder | жЂ»и®Ў |
|------|--------|------|-------------|------|
| йЎµйќў | 26 | 0 | 0 | 26 |
| з»„д»¶ | 60+ | 0 | 0 | 60+ |
| API endpoints | 40+ | 0 | 0 | 40+ |
| WebSocket дє‹д»¶ | 12+ | 0 | 0 | 12+ |
| i18n иЇ­иЁЂ | 2 | 0 | 0 | 2 |

**жЂ»дЅ“зЉ¶жЂЃпјљ** вњ… Production-ready

---

## жњЂиї‘еЏж›ґ

### е·Іе€ й™¤пј€2026-03-05пј‰
- вќЊ `/lume` йЎµйќўпј€LumeAIпј‰вЂ” е·Іе€ й™¤
- вќЊ `/music` йЎµйќў вЂ” е·Іе€ й™¤
- вќЊ `/api/lume/chat` API вЂ” е·Іе€ й™¤
- вќЊ `backend/src/lume/` жЁЎеќ— вЂ” е·Іе€ й™¤
- вќЊ `lumeChatLimiter` й™ђжµЃе™Ё вЂ” е·Іе€ й™¤

### е·ІеЏж›ґ
- вњ… ж›ґж–°зї»иЇ‘пј€з§»й™¤ LUME/Music жЏђеЏЉпј‰
- вњ… ж›ґж–° SidebarLeftпј€з§»й™¤ LUME AIгЂЃMusic жЊ‰й’®пј‰
- вњ… ж›ґж–° App.tsxпј€з§»й™¤и·Їз”±пј‰

---

## з›ёе…іж–‡жЎЈ

- [Error Handling](./ERROR_HANDLING.cn.md)
- [Groups Module](./GROUPS_MODULE.cn.md)
- [Project UI](./PROJECT_UI/)
- [README](../README.cn.md)
