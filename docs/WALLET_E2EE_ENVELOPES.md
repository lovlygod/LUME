# Wallet E2EE Transfer Envelopes

Comprehensive technical documentation for wallet-transfer encrypted envelopes.

## Scope

This document covers only the E2EE envelope subsystem used by economy transfers and excludes removed product docs.

Source modules:

- [`018_wallet_e2ee.sql`](backend/database/migrations/018_wallet_e2ee.sql)
- [`walletE2eeRepository.js`](backend/src/economy/repositories/walletE2eeRepository.js)
- [`walletE2eeService.js`](backend/src/economy/services/walletE2eeService.js)
- [`walletE2ee.ts`](src/services/walletE2ee.ts)
- [`economyService.transferCoin()`](backend/src/economy/services/economyService.js:104)
- [`economyRoutes.js`](backend/src/routes/economyRoutes.js)
- [`api.economy.transfer()`](src/services/api.ts:341)
- [`api.economy.getWalletE2EESync()`](src/services/api.ts:347)
- [`api.economy.ackWalletE2EEEnvelope()`](src/services/api.ts:354)

## Why this exists

Encrypted transfer metadata allows sender/recipient clients to exchange cryptographic payloads per device while the backend remains transport/storage only.

Server guarantees:

1. Input validation for encrypted payload structure.
2. Replay nonce reservation per actor/device/operation.
3. Durable storage of encrypted message and per-device envelopes.
4. Cursor-based sync for recipient devices.
5. Status transitions (`delivered`, `decrypted`) via explicit ack.

## Architecture overview

### Backend layers

- Routing and auth entry: [`economyRoutes.js`](backend/src/routes/economyRoutes.js)
- Business logic: [`walletE2eeService.js`](backend/src/economy/services/walletE2eeService.js)
- Data access: [`walletE2eeRepository.js`](backend/src/economy/repositories/walletE2eeRepository.js)
- Transfer orchestration hook: [`transferCoin()`](backend/src/economy/services/economyService.js:104)

### Frontend layer

- Payload builder and hashing/base64 utilities: [`walletE2ee.ts`](src/services/walletE2ee.ts)
- HTTP contract calls: [`api.ts`](src/services/api.ts)

## Database model

Migration [`018_wallet_e2ee.sql`](backend/database/migrations/018_wallet_e2ee.sql) introduces three core entities.

### 1) Replay nonce reservation

Used by [`reserveReplayNonce()`](backend/src/economy/repositories/walletE2eeRepository.js:5).

Intent:

- block duplicate encrypted operations from retries/replays,
- decouple encrypted replay control from payment idempotency.

Logical key:

- `actor_user_id` + `sender_device_id` + `client_operation_id` + `nonce_b64`.

### 2) Encrypted message

Created by [`createWalletEncryptedMessage()`](backend/src/economy/repositories/walletE2eeRepository.js:16).

Contains canonical encrypted payload metadata tied to a concrete transfer transaction.

Typical data:

- sender identifiers,
- transfer linkage (`tx` / related id),
- ciphertext blob(s), algorithms/version/aad,
- recipient user ownership for sync authorization.

### 3) Encrypted envelopes

Created in batch by [`createWalletEncryptedEnvelopes()`](backend/src/economy/repositories/walletE2eeRepository.js:53).

One row per recipient device envelope:

- device-specific wrapped key/material,
- cursor id for incremental sync,
- ack timestamps/flags for delivery and decrypt milestones.

## End-to-end flow

### Step 1. Sender builds encrypted payload

Client calls [`buildWalletEncryptedPayload()`](src/services/walletE2ee.ts:17) and sends result in `encrypted` field of [`api.economy.transfer()`](src/services/api.ts:341).

### Step 2. Transfer succeeds

In [`transferCoin()`](backend/src/economy/services/economyService.js:104), financial state mutation is executed first.

### Step 3. Encrypted attachment

If `encrypted` is provided, [`attachEncryptedTransfer()`](backend/src/economy/services/walletE2eeService.js:38) executes.

### Step 4. Validation

[`validateEncryptedTransferPayload()`](backend/src/economy/services/walletE2eeService.js:4) enforces minimum shape:

- sender device id,
- client operation id,
- nonce,
- encrypted message content,
- non-empty per-device envelopes array.

### Step 5. Replay reservation

[`reserveReplayNonce()`](backend/src/economy/repositories/walletE2eeRepository.js:5) attempts unique reservation.

Failure path: replay conflict is thrown; duplicated encrypted side effects are prevented.

### Step 6. Persist message and envelopes

- message row via [`createWalletEncryptedMessage()`](backend/src/economy/repositories/walletE2eeRepository.js:16)
- envelopes via [`createWalletEncryptedEnvelopes()`](backend/src/economy/repositories/walletE2eeRepository.js:53)

### Step 7. Recipient sync

Recipient device requests [`api.economy.getWalletE2EESync()`](src/services/api.ts:347), mapped to [`syncEncryptedWalletEnvelopes()`](backend/src/economy/services/walletE2eeService.js:76) and [`listWalletEncryptedEnvelopes()`](backend/src/economy/repositories/walletE2eeRepository.js:77).

Supports:

- `afterId` cursor,
- `limit` bound,
- user/device scoping.

### Step 8. Ack state transitions

Recipient acknowledges with [`api.economy.ackWalletE2EEEnvelope()`](src/services/api.ts:354), mapped to [`ackWalletEnvelope()`](backend/src/economy/services/walletE2eeService.js:99).

Repository mutators:

- [`markWalletEnvelopeDelivered()`](backend/src/economy/repositories/walletE2eeRepository.js:95)
- [`markWalletEnvelopeDecrypted()`](backend/src/economy/repositories/walletE2eeRepository.js:108)

## HTTP/API contracts

### Transfer with encrypted payload

Client endpoint call: [`api.economy.transfer()`](src/services/api.ts:341)

Body contract (logical):

```json
{
  "to": "@recipient_or_wallet",
  "amount_coin": "1.25",
  "idempotency_key": "uuid-or-client-key",
  "encrypted": {
    "senderDeviceId": "device-A",
    "clientOperationId": "op-123",
    "nonceB64": "...",
    "ciphertextB64": "...",
    "aad": { "schema": "wallet-transfer-e2ee:v1" },
    "envelopes": [
      {
        "recipientDeviceId": "device-B",
        "sealedKeyB64": "...",
        "header": { "alg": "X25519+..." }
      }
    ]
  }
}
```

### Sync endpoint

Route implementation: [`economyRoutes.js`](backend/src/routes/economyRoutes.js:115)

Client call: [`api.economy.getWalletE2EESync()`](src/services/api.ts:347)

Parameters:

- `deviceId` (required),
- `afterId` (optional cursor),
- `limit` (optional page size).

### Ack endpoint

Route implementation: [`economyRoutes.js`](backend/src/routes/economyRoutes.js:125)

Client call: [`api.economy.ackWalletE2EEEnvelope()`](src/services/api.ts:354)

Ack status values:

- `delivered`
- `decrypted`

## Validation and errors

Validation is centralized in [`validateEncryptedTransferPayload()`](backend/src/economy/services/walletE2eeService.js:4).

Failure categories:

1. malformed payload (missing required fields),
2. empty envelope array,
3. replay nonce conflict from [`reserveReplayNonce()`](backend/src/economy/repositories/walletE2eeRepository.js:5),
4. unauthorized envelope access/ack by wrong user or device.

Recommendation: client should treat replay conflict as non-retriable for the same `(operationId, nonce)`.

## Security properties

1. Backend never decrypts wallet ciphertext.
2. Device-level fan-out keeps key material segmented per recipient device.
3. Replay controls are independent from transfer idempotency.
4. Ack operations are scoped by user/device to prevent cross-device corruption.
5. Cursor sync minimizes data over-fetch and enables stable resume.

## Idempotency vs replay protection

These controls solve different problems:

- Transfer idempotency (in economy transfer) protects financial mutation from duplicate client retries.
- E2EE replay reservation protects encrypted metadata insertion from duplicate/replay attempts.

Both are required for correct financial + cryptographic behavior.

## Operational runbook

### Sender side

1. Generate fresh nonce per operation.
2. Generate stable `clientOperationId` for retry-safe semantics.
3. Build envelopes for every known recipient device.

### Recipient side

1. Poll sync with small/medium `limit` and `afterId` checkpointing.
2. Store envelope locally before ack.
3. Send `delivered`, then `decrypted` when local decrypt succeeds.

### Server side

1. Monitor duplicate replay conflicts for abuse or client bugs.
2. Track envelope backlog growth by recipient/device.
3. Keep migration state aligned across environments before enabling feature flags.

## Testing guidance

Minimum scenarios:

1. valid transfer + encrypted payload persists message and envelopes,
2. duplicate `(senderDeviceId, clientOperationId, nonceB64)` is rejected,
3. sync pagination with `afterId` returns monotonic rows,
4. ack updates status only for rightful user/device,
5. encrypted payload omitted: transfer still succeeds.

## Known limitations

1. Envelope transport is currently pull-based sync (no dedicated realtime envelope WS stream in this module).
2. Schema evolution/versioning must be coordinated between [`walletE2ee.ts`](src/services/walletE2ee.ts) and [`walletE2eeService.js`](backend/src/economy/services/walletE2eeService.js).
3. Large recipient device fan-out increases row volume linearly.

## Versioning policy

When changing payload structure:

1. add backward-compatible parser support in [`validateEncryptedTransferPayload()`](backend/src/economy/services/walletE2eeService.js:4),
2. preserve old sync readers until all clients migrate,
3. introduce explicit schema marker in payload metadata/AAD.

## Quick reference

- Transfer attach hook: [`attachEncryptedTransfer()`](backend/src/economy/services/walletE2eeService.js:38)
- Sync service: [`syncEncryptedWalletEnvelopes()`](backend/src/economy/services/walletE2eeService.js:76)
- Ack service: [`ackWalletEnvelope()`](backend/src/economy/services/walletE2eeService.js:99)
- Repository module: [`walletE2eeRepository.js`](backend/src/economy/repositories/walletE2eeRepository.js)
- Client builder: [`buildWalletEncryptedPayload()`](src/services/walletE2ee.ts:17)

