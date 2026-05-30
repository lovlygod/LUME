# Стек Economy Wallet (Frontend + Backend)

Расширенная документация по полной реализации кошелька, переводов, рынка username и realtime-синхронизации.

## Область и источники

Документ описывает полный добавленный стек economy/wallet на backend и frontend.

Ключевые файлы:

- [`economyRoutes.js`](backend/src/routes/economyRoutes.js)
- [`economyService.js`](backend/src/economy/services/economyService.js)
- [`economyRepository.js`](backend/src/economy/repositories/economyRepository.js)
- [`usernameMarketService.js`](backend/src/economy/services/usernameMarketService.js)
- [`usernameMarketRepository.js`](backend/src/economy/repositories/usernameMarketRepository.js)
- [`walletE2eeService.js`](backend/src/economy/services/walletE2eeService.js)
- [`api.ts`](src/services/api.ts)
- [`WalletPage.tsx`](src/pages/wallet/WalletPage.tsx)
- [`WalletMarketPage.tsx`](src/pages/wallet/WalletMarketPage.tsx)
- [`WalletHistoryPage.tsx`](src/pages/wallet/WalletHistoryPage.tsx)
- [`WalletSectionNav.tsx`](src/pages/wallet/WalletSectionNav.tsx)
- [`useWalletData.ts`](src/pages/wallet/useWalletData.ts)
- [`websocket.ts`](src/services/websocket.ts)

## 1) Архитектура backend

### Routes

[`economyRoutes.js`](backend/src/routes/economyRoutes.js) является HTTP-входом домена economy и включает:

1. чтение кошелька/транзакций/статистики,
2. перевод монет,
3. E2EE sync/ack,
4. username market (create/list/cancel/buy),
5. операции покупки монет,
6. websocket fanout после критичных мутаций.

### Services

[`economyService.js`](backend/src/economy/services/economyService.js) реализует бизнес-правила:

- резолв получателя,
- preview получателя,
- idempotency + валидации,
- перевод и пост-обработку,
- интеграцию E2EE attach.

[`usernameMarketService.js`](backend/src/economy/services/usernameMarketService.js) реализует:

- валидацию и нормализацию цены,
- список/поиск/фильтры листингов,
- операции create/cancel/buy,
- аудит событий маркета.

### Repositories

[`economyRepository.js`](backend/src/economy/repositories/economyRepository.js) обеспечивает:

- операции чтения/создания кошельков,
- транзакционную мутацию балансов,
- запись ledger-записей,
- idempotency lookup,
- audit insert.

[`usernameMarketRepository.js`](backend/src/economy/repositories/usernameMarketRepository.js) обеспечивает:

- username preferences,
- операции с маркет-лотами,
- атомарную покупку с переносом ownership.

## 2) Архитектура frontend

### Данные и API

Контракты economy определены в [`api.ts`](src/services/api.ts), включая:

- [`api.economy.transfer()`](src/services/api.ts:341)
- [`api.economy.getWalletE2EESync()`](src/services/api.ts:347)
- [`api.economy.ackWalletE2EEEnvelope()`](src/services/api.ts:354)
- market-методы create/cancel/buy/list

### Экраны

- [`WalletPage`](src/pages/wallet/WalletPage.tsx): баланс, перевод, preview получателя, realtime обновления.
- [`WalletMarketPage`](src/pages/wallet/WalletMarketPage.tsx): рынок username (лента, фильтры, операции).
- [`WalletHistoryPage`](src/pages/wallet/WalletHistoryPage.tsx): отдельный экран истории.

### Навигация

Раздел wallet навигируется через [`WalletSectionNav`](src/pages/wallet/WalletSectionNav.tsx:6), маршруты зарегистрированы в [`App.tsx`](src/App.tsx).

## 3) Сквозной пайплайн перевода

1. UI отправляет форму через [`api.economy.transfer()`](src/services/api.ts:341).
2. [`resolveRecipientWallet()`](backend/src/economy/services/economyService.js:15) определяет получателя.
3. [`transferCoin()`](backend/src/economy/services/economyService.js:104) выполняет валидации и idempotency.
4. [`executeTransfer()`](backend/src/economy/repositories/economyRepository.js:205) делает атомарные списания/зачисления.
5. Роут отправляет websocket событие обновления кошелька.
6. При наличии `encrypted` выполняется attach E2EE payload.

## 4) Preview и проверка получателя

Preview-логика на backend: [`previewRecipient()`](backend/src/economy/services/economyService.js:26).

В [`WalletPage`](src/pages/wallet/WalletPage.tsx) реализованы:

- blur/submit проверка,
- предпросмотр avatar/username,
- дифференцированные ошибки (username/address not found).

## 5) Realtime через WebSocket

Событие отправляется в [`economyRoutes.js`](backend/src/routes/economyRoutes.js:94), клиент подписывается через [`WebSocketService`](src/services/websocket.ts:17), обработчик в [`WalletPage`](src/pages/wallet/WalletPage.tsx:200) вызывает reload и обновляет UI без перезагрузки страницы.

## 6) Username Market — функциональный контур

### Backend контур

- create listing,
- list active listings,
- cancel listing,
- buy listing,
- audit + broadcast.

Ключевая транзакция: [`buyListing()`](backend/src/economy/repositories/usernameMarketRepository.js:366), где одновременно согласуются средства и ownership username.

### Frontend контур

[`WalletMarketPage`](src/pages/wallet/WalletMarketPage.tsx) реализует:

1. отображение рыночной ленты,
2. фильтрацию/сортировку,
3. создание листинга,
4. управление своими лотами,
5. подтверждение покупки,
6. обработку API-ошибок.

## 7) Форматирование и утилиты

- формат монет: [`formatCoin()`](src/pages/wallet/format.ts:1)
- оценка комиссии: [`estimateFeeMicro()`](src/pages/wallet/format.ts:12)
- avatar/url нормализация:
  - [`normalizeImageUrl()`](src/lib/utils.ts:14)
  - [`getUserAvatar()`](src/lib/utils.ts:34)

## 8) Локализация

Основные файлы:

- [`en.json`](src/i18n/locales/en.json)
- [`ru.json`](src/i18n/locales/ru.json)

Ключевые namespaces: `economy.wallet.*`, `economy.market.*`, `economy.history.*`.

## 9) Безопасность и корректность

1. Idempotency защищает от повторного финансового применения.
2. Транзакционность БД исключает частичные изменения баланса.
3. Rate limiting уменьшает риск abuse.
4. Audit trail обеспечивает трассируемость действий.
5. Replay-защита E2EE дополняет финансовую безопасность.

## 10) Эксплуатационный чеклист

1. Проверить, что миграции economy/E2EE применены.
2. Проверить duplicate submit с тем же idempotency key.
3. Проверить preview-валидацию получателя.
4. Проверить получение `economy:wallet_updated` на активной сессии.
5. Проверить create/cancel/buy в маркете и audit/broadcast след.

## 11) Точки связности

1. Transfer связывает economy и wallet E2EE.
2. Market buy связывает balances и username ownership.
3. Wallet UI зависит от комбинации HTTP fetch + WS updates.

При изменениях схемы балансов, ledger или usernames нужно синхронно обновлять repository/service/API/UI слои.

