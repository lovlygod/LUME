# E2EE-конверты переводов в кошельке

Подробная документация подсистемы зашифрованных конвертов для переводов в экономике.

## Область и источники

Документ охватывает полный цикл формирования, записи, синхронизации и подтверждения E2EE-конвертов на переводах.

Ключевые файлы:

- [`018_wallet_e2ee.sql`](backend/database/migrations/018_wallet_e2ee.sql)
- [`walletE2eeRepository.js`](backend/src/economy/repositories/walletE2eeRepository.js)
- [`walletE2eeService.js`](backend/src/economy/services/walletE2eeService.js)
- [`walletE2ee.ts`](src/services/walletE2ee.ts)
- [`transferCoin()`](backend/src/economy/services/economyService.js:104)
- [`api.economy.transfer()`](src/services/api.ts:341)
- [`api.economy.getWalletE2EESync()`](src/services/api.ts:347)
- [`api.economy.ackWalletE2EEEnvelope()`](src/services/api.ts:354)
- [`/economy/coin/e2ee/sync`](backend/src/routes/economyRoutes.js:115)
- [`/economy/coin/e2ee/envelopes/:id/ack`](backend/src/routes/economyRoutes.js:125)

## Назначение

Серверная часть поддерживает перенос зашифрованных метаданных перевода (ciphertext + envelopes по устройствам) без расшифровки полезной нагрузки на backend.

Подсистема должна гарантировать:

1. Строгую валидацию структуры `encrypted`.
2. Защиту от replay-атак через nonce-резервирование.
3. Надёжное хранение сообщения и fan-out конвертов.
4. Поэтапную синхронизацию по курсору `afterId`.
5. Управление состояниями доставки/дешифровки через ack.

## Архитектура

### Слои backend

- Роуты: [`economyRoutes.js`](backend/src/routes/economyRoutes.js)
- Сервисная логика: [`walletE2eeService.js`](backend/src/economy/services/walletE2eeService.js)
- Доступ к данным: [`walletE2eeRepository.js`](backend/src/economy/repositories/walletE2eeRepository.js)
- Интеграция в перевод: [`economyService.js`](backend/src/economy/services/economyService.js)

### Слой frontend

- Сборка payload: [`buildWalletEncryptedPayload()`](src/services/walletE2ee.ts:17)
- Контракты API: [`api.ts`](src/services/api.ts)

## Модель данных (Migration 018)

Миграция [`018_wallet_e2ee.sql`](backend/database/migrations/018_wallet_e2ee.sql) добавляет три логические сущности.

### 1) Резервирование replay nonce

Операция: [`reserveReplayNonce()`](backend/src/economy/repositories/walletE2eeRepository.js:5)

Назначение:

- исключить повторную запись одного и того же шифрованного события,
- отделить криптографическую replay-защиту от финансовой idempotency.

### 2) Каноническое зашифрованное сообщение

Операция: [`createWalletEncryptedMessage()`](backend/src/economy/repositories/walletE2eeRepository.js:16)

Содержит метаданные зашифрованного перевода, привязанные к транзакции.

### 3) Конверты для устройств получателя

Операция: [`createWalletEncryptedEnvelopes()`](backend/src/economy/repositories/walletE2eeRepository.js:53)

Один конверт = одна строка на целевое устройство, со статусными полями подтверждения.

## Сквозной поток обработки

### Шаг 1. Формирование payload на клиенте

Клиент строит payload через [`buildWalletEncryptedPayload()`](src/services/walletE2ee.ts:17) и передаёт его в `encrypted` поля запроса [`api.economy.transfer()`](src/services/api.ts:341).

### Шаг 2. Финансовый перевод

Сначала исполняется финансовая часть в [`transferCoin()`](backend/src/economy/services/economyService.js:104).

### Шаг 3. Подключение E2EE-данных

После успешного перевода вызывается [`attachEncryptedTransfer()`](backend/src/economy/services/walletE2eeService.js:38).

### Шаг 4. Валидация структуры

[`validateEncryptedTransferPayload()`](backend/src/economy/services/walletE2eeService.js:4) проверяет обязательные поля:

- `senderDeviceId`,
- `clientOperationId`,
- `nonceB64`,
- ciphertext/метаданные,
- непустой `envelopes`.

### Шаг 5. Replay-резервирование

[`reserveReplayNonce()`](backend/src/economy/repositories/walletE2eeRepository.js:5) фиксирует уникальный ключ операции.

Если ключ уже существует — отклонение как replay-конфликт.

### Шаг 6. Запись message + envelopes

- сообщение: [`createWalletEncryptedMessage()`](backend/src/economy/repositories/walletE2eeRepository.js:16)
- fan-out конвертов: [`createWalletEncryptedEnvelopes()`](backend/src/economy/repositories/walletE2eeRepository.js:53)

### Шаг 7. Sync на устройстве получателя

Клиент вызывает [`api.economy.getWalletE2EESync()`](src/services/api.ts:347), backend отдаёт данные через [`syncEncryptedWalletEnvelopes()`](backend/src/economy/services/walletE2eeService.js:76).

### Шаг 8. Ack статусов

Подтверждение идёт через [`api.economy.ackWalletE2EEEnvelope()`](src/services/api.ts:354) и [`ackWalletEnvelope()`](backend/src/economy/services/walletE2eeService.js:99):

- [`markWalletEnvelopeDelivered()`](backend/src/economy/repositories/walletE2eeRepository.js:95)
- [`markWalletEnvelopeDecrypted()`](backend/src/economy/repositories/walletE2eeRepository.js:108)

## API-контракты

### 1) Transfer с `encrypted`

Маршрут использует [`transferCoin()`](backend/src/economy/services/economyService.js:104), клиент — [`api.economy.transfer()`](src/services/api.ts:341).

### 2) Sync endpoint

Роут: [`economyRoutes.js`](backend/src/routes/economyRoutes.js:115)

Параметры:

- `deviceId` (required)
- `afterId` (optional)
- `limit` (optional)

### 3) Ack endpoint

Роут: [`economyRoutes.js`](backend/src/routes/economyRoutes.js:125)

Статусы:

- `delivered`
- `decrypted`

## Ошибки и валидация

Типовые категории ошибок:

1. Некорректный формат `encrypted`.
2. Пустой массив `envelopes`.
3. Replay-конфликт при резервировании nonce.
4. Неверный пользователь/устройство при ack.

## Безопасность

1. Backend не расшифровывает контент кошелька.
2. Replay-контроль отделён от idempotency финансов.
3. Envelope-ack привязан к user/device.
4. Курсорная синхронизация уменьшает риск дублей и потерь при возобновлении.

## Idempotency vs Replay

- Idempotency (перевод) защищает баланс от двойного списания.
- Replay reservation (E2EE) защищает шифрованный слой от повторной вставки.

Обе защиты обязательны и решают разные задачи.

## Эксплуатационный чеклист

### Клиент-отправитель

1. Генерировать новый nonce для каждой операции.
2. Использовать стабильный `clientOperationId` для retry.
3. Формировать envelopes для всех известных устройств получателя.

### Клиент-получатель

1. Синхронизировать по `afterId`.
2. Сначала локально сохранять envelope, потом отправлять ack.
3. Отправлять `decrypted` только после успешной расшифровки.

### Сервер

1. Мониторить replay-конфликты.
2. Следить за ростом backlog envelopes по устройствам.
3. Согласованно обновлять схему payload при релизах.

## Рекомендации по тестам

Минимум кейсов:

1. Валидный encrypted transfer создаёт message + envelopes.
2. Дубликат `(deviceId, operationId, nonce)` отклоняется.
3. Sync по `afterId` возвращает монотонный список.
4. Ack работает только для корректной пары user/device.
5. Перевод без `encrypted` не ломается.

## Ограничения

1. В модуле нет отдельного WS-стрима конвертов (используется pull sync).
2. Изменение формата требует синхронного обновления frontend/backend.
3. Большое число устройств получателя линейно увеличивает объём fan-out.

## Политика версионирования payload

При изменениях структуры:

1. Добавлять backward-compatible разбор в [`validateEncryptedTransferPayload()`](backend/src/economy/services/walletE2eeService.js:4).
2. Поддерживать старые клиенты на переходный период.
3. Версионировать схему в AAD/metadata.

## Быстрые ссылки

- Attach hook: [`attachEncryptedTransfer()`](backend/src/economy/services/walletE2eeService.js:38)
- Sync service: [`syncEncryptedWalletEnvelopes()`](backend/src/economy/services/walletE2eeService.js:76)
- Ack service: [`ackWalletEnvelope()`](backend/src/economy/services/walletE2eeService.js:99)
- Repository: [`walletE2eeRepository.js`](backend/src/economy/repositories/walletE2eeRepository.js)
- Client builder: [`buildWalletEncryptedPayload()`](src/services/walletE2ee.ts:17)

