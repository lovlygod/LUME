# Stickers

**Last update:** 2026-03-18

This document covers the sticker system end-to-end: UI components, data model, backend endpoints, storage, and runtime behavior.

---

## Overview

Stickers are sent as dedicated message type (`sticker`). The client loads sticker packs, allows users to pick a sticker, and sends it as a message. Stickers are stored as assets in the frontend repo and synced into the backend database at startup. Users can also create packs through the Sticker Bot and share them via deep links.

---

## UI Components

- [`src/components/stickers/StickerPicker.tsx`](../src/components/stickers/StickerPicker.tsx:1)
  - Main popover used in the message composer.
  - Supports two tabs: **My** (user-owned packs) and **LUME** (catalog packs).
  - Shows pack selector; when a pack is selected it lazily loads stickers and caches them in memory.

- [`src/components/stickers/StickerPackTabs.tsx`](../src/components/stickers/StickerPackTabs.tsx:1)
  - Tab switcher for My/LUME views.

- [`src/components/stickers/StickerGrid.tsx`](../src/components/stickers/StickerGrid.tsx:1)
  - Grid of sticker buttons with hover/tap animations.

- [`src/components/stickers/StickerCanvas.tsx`](../src/components/stickers/StickerCanvas.tsx:1)
  - Renders PNG on a canvas with smoothing enabled (better visual quality for scaled assets).

- [`src/components/stickers/StickerMessage.tsx`](../src/components/stickers/StickerMessage.tsx:1)
  - Sticker display inside message list; clickable to open preview modal.

- [`src/components/stickers/StickerModal.tsx`](../src/components/stickers/StickerModal.tsx:1)
  - Preview modal showing the sticker and pack metadata.
  - Allows adding the pack to the user’s collection.

---

## UX Flow

1. User opens the sticker picker in the message composer.
2. User switches between **My** and **LUME** packs.
3. User selects a pack (dropdown). Stickers are loaded via API and cached in `stickersByPack`.
4. Selecting a sticker sends a `sticker` message.
5. Clicking a sticker in a message opens the preview modal with a button to add the pack.

Empty state: if **My** has no packs, the picker shows a placeholder and a **Browse packs** action.

---

## Data Model

Types are defined in [`src/types/stickers.ts`](../src/types/stickers.ts:1):

```ts
export interface Sticker {
  id: string;
  name?: string | null;
  filePath?: string | null;
  url?: string | null;
  packId?: string | null;
}

export interface StickerPack {
  id: string;
  name: string;
  description?: string | null;
  author?: string | null;
  createdAt?: string | null;
  stickerCount?: number;
}
```

Messages with stickers have:
- `type: "sticker"`
- `sticker_id` in DB (nullable for non-sticker messages)

---

## Asset Storage

Sticker assets live in:

```
src/assets/stickers/<PackName>/<StickerName>.png
```

Sticker Bot uploads are stored in Cloudinary and persisted in the database (no local `backend/sticker-uploads/`).

---

## Backend: Schema & Sync

The backend ensures tables and syncs assets on startup (see [`backend/src/api.js`](../backend/src/api.js:89)):

- `sticker_packs` — pack metadata
- `stickers` — sticker records with `file_path`
- `user_sticker_packs` — many-to-many between users and packs
- `messages.sticker_id` — foreign key to `stickers`
- `sticker_bot_sessions` — state machine for bot-driven pack creation

The sync process:
1. Scan asset directories
2. Create missing packs
3. Insert missing stickers

---

## Backend API

Endpoints are implemented in [`backend/src/api.js`](../backend/src/api.js:783):

### List all packs
`GET /api/stickers/packs`

Returns all packs with sticker counts.

### Get pack with stickers
`GET /api/stickers/packs/:id`

Returns pack metadata and stickers, each with `url` to the PNG endpoint.

### Get pack by slug (public)
`GET /api/stickers/public/slug/:slug`

Used for deep link previews without authentication.

### Get pack by slug (auth)
`GET /api/stickers/slug/:slug`

Used for authenticated flows.

### Get user packs
`GET /api/stickers/mine`

Returns packs the user has added.

### Add pack to user
`POST /api/stickers/add-pack`

Body:
```json
{ "packId": "123" }
```

### Sticker PNG
`GET /api/stickers/:id`

Returns the PNG file. Includes caching and CSP headers to prevent content sniffing.

### Sticker Bot session
`GET /api/stickers/bot/session`

### Sticker Bot start
`POST /api/stickers/bot/start`

### Sticker Bot upload
`POST /api/stickers/bot/upload`

Multipart field: `stickers` (PNG/WEBP/GIF, max 512KB each, max 60 files).

---

## Frontend Integration

- Message composer integration: [`src/pages/messages/components/MessageComposer.tsx`](../src/pages/messages/components/MessageComposer.tsx:1)
- Message list rendering: [`src/pages/messages/components/MessageList.tsx`](../src/pages/messages/components/MessageList.tsx:1)
- Data loading and state: [`src/pages/messages/MessagesPage.tsx`](../src/pages/messages/MessagesPage.tsx:1)
- Deep link page: [`src/pages/stickers/AddStickerPackPage.tsx`](../src/pages/stickers/AddStickerPackPage.tsx:1)
- Sticker bot panel (preview + upload): [`src/pages/stickers/StickerBotPanel.tsx`](../src/pages/stickers/StickerBotPanel.tsx:1)

Key behaviors:
- Sticker packs are fetched when the picker opens.
- Sticker lists are loaded lazily per pack and cached.
- Adding a pack refreshes the user pack list.

Deep link UX:
- URL: `/addstickers/:packSlug`
- Shows pack name, description, sticker grid, and Add button.
- After adding, navigates to `/messages?addStickerPack=<id>` which opens the preview modal.

Sticker bot UX:
- Chat with user `@stickers` (ID `999`).
- `/newpack` → set pack name
- `/upload` → get upload endpoint
- Upload files (PNG/WEBP/GIF)
- `/publish` → creates pack and replies with deep link

---

## Related Files

- [`backend/scripts/stickers-sync.js`](../backend/scripts/stickers-sync.js:1) — manual sync helper.
- [`src/assets/stickers/`](../src/assets/stickers/:1) — sticker assets.
