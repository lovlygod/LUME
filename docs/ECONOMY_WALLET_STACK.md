# Economy Wallet Stack (Frontend + Backend)

Comprehensive documentation for the wallet/economy implementation that was added in this project.

## Scope

This document covers:

- Wallet API/service architecture.
- Frontend wallet data and UI behavior.
- Transfer flow (validation, idempotency, balance mutation).
- Recipient resolution and preview.
- Username market backend/frontend integration points.
- Realtime wallet updates over WebSocket.
- Localization keys used by economy screens.

Primary sources:

- [`backend/src/routes/economyRoutes.js`](backend/src/routes/economyRoutes.js)
- [`backend/src/economy/services/economyService.js`](backend/src/economy/services/economyService.js)
- [`backend/src/economy/repositories/economyRepository.js`](backend/src/economy/repositories/economyRepository.js)
- [`backend/src/economy/services/usernameMarketService.js`](backend/src/economy/services/usernameMarketService.js)
- [`backend/src/economy/repositories/usernameMarketRepository.js`](backend/src/economy/repositories/usernameMarketRepository.js)
- [`src/services/api.ts`](src/services/api.ts)
- [`src/pages/wallet/WalletPage.tsx`](src/pages/wallet/WalletPage.tsx)
- [`src/pages/wallet/WalletMarketPage.tsx`](src/pages/wallet/WalletMarketPage.tsx)
- [`src/pages/wallet/WalletHistoryPage.tsx`](src/pages/wallet/WalletHistoryPage.tsx)
- [`src/pages/wallet/WalletSectionNav.tsx`](src/pages/wallet/WalletSectionNav.tsx)
- [`src/pages/wallet/useWalletData.ts`](src/pages/wallet/useWalletData.ts)
- [`src/services/websocket.ts`](src/services/websocket.ts)

## 1. Backend module structure

Economy domain is split into route/service/repository layers.

### Route layer

[`economyRoutes.js`](backend/src/routes/economyRoutes.js) handles:

- wallet read endpoints,
- wallet transfer endpoint,
- E2EE sync/ack endpoints,
- username market create/list/cancel/buy endpoints,
- coin purchase order endpoints,
- WebSocket event fanout after key state changes.

### Service layer

[`economyService.js`](backend/src/economy/services/economyService.js) encapsulates:

- recipient resolution and preview,
- transfer business rules,
- fee/stat composition,
- optional E2EE attach integration.

[`usernameMarketService.js`](backend/src/economy/services/usernameMarketService.js) encapsulates:

- listing validation,
- coin price parsing,
- market list filtering/sorting,
- create/cancel/buy listing business actions,
- audit event generation for market actions.

### Repository layer

[`economyRepository.js`](backend/src/economy/repositories/economyRepository.js) performs:

- wallet lookup and creation,
- wallet transaction reads,
- explorer reads,
- transactional transfer mutation,
- idempotency key lookup,
- audit event inserts.

[`usernameMarketRepository.js`](backend/src/economy/repositories/usernameMarketRepository.js) performs:

- username preference schema bootstrap,
- visibility/display-order persistence,
- active listing queries,
- transactional listing lifecycle and ownership transfer on buy.

## 2. Wallet read model

Wallet data exposed to frontend includes:

- wallet identity (address/user binding),
- balances (micro-coin precision),
- recent transaction list,
- wallet statistics.

Frontend data loading is centralized in [`useWalletData()`](src/pages/wallet/useWalletData.ts:4), used by wallet screens to call API and refresh state.

## 3. Transfer pipeline

### Step 1: Frontend submit

Transfer submit is initiated in [`WalletPage`](src/pages/wallet/WalletPage.tsx) and sent using [`api.economy.transfer()`](src/services/api.ts:341) with:

- `to` (wallet address or username form),
- `amount_coin`,
- `idempotency_key`,
- optional `encrypted` payload for E2EE envelope attachment.

### Step 2: Recipient resolution

Backend resolver [`resolveRecipientWallet()`](backend/src/economy/services/economyService.js:15) supports:

- wallet address lookup,
- username lookup with fallback behavior via [`getWalletByUsername()`](backend/src/economy/repositories/economyRepository.js:56).

### Step 3: Rules + limits

Service [`transferCoin()`](backend/src/economy/services/economyService.js:104) applies:

- amount validation and micro conversion,
- idempotency lookup,
- daily/rate and business checks,
- fee calculation,
- transactional balance update through repository.

### Step 4: Commit + side effects

Repository transaction [`executeTransfer()`](backend/src/economy/repositories/economyRepository.js:205) updates balances and ledger entries atomically.

After commit:

- audit event is recorded,
- optional E2EE metadata is attached,
- route broadcasts wallet-updated events over WS.

## 4. Recipient preview and validation UX

Recipient pre-check API is wired through frontend helper [`getRecipientPreview()`](src/services/api.ts:347) (or equivalent economy preview method in current api section) and backend preview logic [`previewRecipient()`](backend/src/economy/services/economyService.js:26).

UI usage in [`WalletPage`](src/pages/wallet/WalletPage.tsx):

- validate on blur / before submit,
- render recipient avatar/name preview,
- show specific error class (username not found vs address not found).

This reduces accidental transfer failures and improves send-form clarity.

## 5. Realtime wallet updates (WebSocket)

Server emits wallet event payloads after transfer in [`economyRoutes.js`](backend/src/routes/economyRoutes.js:94).

Client websocket bus is in [`WebSocketService`](src/services/websocket.ts:17).

Wallet screen subscribes to wallet updates in [`WalletPage`](src/pages/wallet/WalletPage.tsx:200) and triggers reload, which keeps balance and transaction list in sync without full page refresh.

## 6. Username market implementation

### Backend

Routes in [`economyRoutes.js`](backend/src/routes/economyRoutes.js) map to [`usernameMarketService`](backend/src/economy/services/usernameMarketService.js):

- create listing,
- list active market,
- cancel listing,
- buy listing,
- optional listing lookup.

Repository [`buyListing()`](backend/src/economy/repositories/usernameMarketRepository.js:366) performs atomic purchase workflow:

- buyer/seller funds movement,
- username ownership transfer,
- listing state transition,
- idempotency safety.

### Frontend

[`WalletMarketPage`](src/pages/wallet/WalletMarketPage.tsx) includes:

- market feed rendering,
- filters/sorting and reload logic,
- create listing form,
- own listings management,
- buy confirmation dialog,
- API error parsing for user-readable state.

## 7. Wallet navigation and routing

Main route registration lives in [`App.tsx`](src/App.tsx).

Wallet section tab UI is in [`WalletSectionNav`](src/pages/wallet/WalletSectionNav.tsx:6), including animated active state and compact tab distribution.

History view is isolated in [`WalletHistoryPage`](src/pages/wallet/WalletHistoryPage.tsx).

## 8. Frontend formatting and utilities

- Coin formatting helpers: [`formatCoin()`](src/pages/wallet/format.ts:1)
- Fee estimation helper: [`estimateFeeMicro()`](src/pages/wallet/format.ts:12)
- Avatar/url normalization helpers used in recipient previews and profile surfaces:
  - [`normalizeImageUrl()`](src/lib/utils.ts:14)
  - [`getUserAvatar()`](src/lib/utils.ts:34)

## 9. Localization integration

Economy UI text keys are maintained in:

- [`src/i18n/locales/en.json`](src/i18n/locales/en.json)
- [`src/i18n/locales/ru.json`](src/i18n/locales/ru.json)

Wallet and market screens rely on `economy.wallet.*`, `economy.market.*`, and `economy.history.*` namespaces for button labels, placeholders, summaries, and error messaging.

## 10. Security and correctness controls

1. Transfer idempotency key prevents duplicate financial mutation.
2. Transactional DB updates avoid partial balance state.
3. Rate limits and buy limiter reduce abuse pressure.
4. Audit event writes preserve critical action traceability.
5. Optional E2EE envelope attach protects metadata confidentiality model.

## 11. Operational checklist

When validating this subsystem in staging/production:

1. Confirm DB migrations up to economy + E2EE version are applied.
2. Verify wallet transfer with same idempotency key is safe/replayed correctly.
3. Verify recipient preview success/error classes.
4. Verify WS `economy:wallet_updated` reception updates active wallet UI.
5. Verify market create/cancel/buy emits expected broadcast and audit trails.

## 12. Known coupling points

- Transfer flow couples economy and wallet E2EE services.
- Market buy couples username ownership and economy balances.
- Wallet UI depends on both HTTP fetch paths and WS updates for freshness.

Any schema-level changes in balances, transaction ledger, usernames, or envelope structures must be coordinated across repository, service, API client, and wallet pages.

