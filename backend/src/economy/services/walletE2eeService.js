const { ValidationError } = require('../../errors');
const repo = require('../repositories/walletE2eeRepository');

const validateEncryptedTransferPayload = (payload) => {
  const senderDeviceId = String(payload?.sender_device_id || '').trim();
  const clientOperationId = String(payload?.client_operation_id || '').trim();
  const nonceB64 = String(payload?.nonce_b64 || '').trim();
  const ciphertextB64 = String(payload?.ciphertext_b64 || '').trim();
  const payloadSha256 = String(payload?.payload_sha256 || '').trim();
  const envelopes = Array.isArray(payload?.envelopes) ? payload.envelopes : [];

  if (!senderDeviceId) throw new ValidationError('sender_device_id is required', { field: 'sender_device_id' });
  if (!clientOperationId) throw new ValidationError('client_operation_id is required', { field: 'client_operation_id' });
  if (!nonceB64) throw new ValidationError('nonce_b64 is required', { field: 'nonce_b64' });
  if (!ciphertextB64) throw new ValidationError('ciphertext_b64 is required', { field: 'ciphertext_b64' });
  if (!payloadSha256) throw new ValidationError('payload_sha256 is required', { field: 'payload_sha256' });
  if (!envelopes.length) throw new ValidationError('envelopes are required', { field: 'envelopes' });

  return {
    senderDeviceId,
    clientOperationId,
    nonceB64,
    ciphertextB64,
    payloadSha256,
    cipherAlg: String(payload?.cipher_alg || 'xchacha20poly1305'),
    protocolVersion: Number(payload?.protocol_version || 1),
    aad: payload?.aad_json && typeof payload.aad_json === 'object' ? payload.aad_json : {},
    envelopes: envelopes.map((env) => ({
      recipientUserId: Number(env?.recipient_user_id),
      recipientDeviceId: String(env?.recipient_device_id || ''),
      wrappedKeyB64: String(env?.wrapped_key_b64 || ''),
      wrapAlg: String(env?.wrap_alg || 'x25519-hkdf'),
      envelope: env?.envelope_json && typeof env.envelope_json === 'object' ? env.envelope_json : {},
    })),
  };
};

const attachEncryptedTransfer = async ({ actorUserId, tx, recipientUserId, encrypted }) => {
  const safe = validateEncryptedTransferPayload(encrypted || {});

  const replay = await repo.reserveReplayNonce({
    actorUserId,
    senderDeviceId: safe.senderDeviceId,
    clientOperationId: safe.clientOperationId,
    nonceB64: safe.nonceB64,
  });
  if (!replay) {
    throw new ValidationError('Duplicate encrypted operation', { code: 'WALLET_E2EE_REPLAY_DETECTED' });
  }

  const msg = await repo.createWalletEncryptedMessage({
    txId: tx.id,
    txHash: tx.tx_hash,
    senderUserId: actorUserId,
    recipientUserId: Number(recipientUserId),
    senderDeviceId: safe.senderDeviceId,
    protocolVersion: safe.protocolVersion,
    cipherAlg: safe.cipherAlg,
    aad: {
      ...safe.aad,
      tx_hash: tx.tx_hash,
      tx_id: tx.id,
      actor_user_id: actorUserId,
      recipient_user_id: Number(recipientUserId),
    },
    ciphertextB64: safe.ciphertextB64,
    nonceB64: safe.nonceB64,
    payloadSha256: safe.payloadSha256,
    clientOperationId: safe.clientOperationId,
  });

  await repo.createWalletEncryptedEnvelopes(msg.id, safe.envelopes);
  return msg;
};

const syncEncryptedWalletEnvelopes = async ({ userId, deviceId, afterId, limit }) => {
  if (!deviceId) throw new ValidationError('deviceId is required', { field: 'deviceId' });
  const rows = await repo.listWalletEncryptedEnvelopes({ userId, deviceId, afterId, limit });
  const items = rows.map((row) => ({
    id: String(row.id),
    messageId: String(row.message_id),
    txHash: row.tx_hash,
    senderUserId: String(row.sender_user_id),
    recipientUserId: String(row.message_recipient_user_id),
    protocolVersion: row.protocol_version,
    cipherAlg: row.cipher_alg,
    wrappedKeyB64: row.wrapped_key_b64,
    wrapAlg: row.wrap_alg,
    envelope: row.envelope_json || {},
    aad: row.aad_json || {},
    ciphertextB64: row.ciphertext_b64,
    nonceB64: row.nonce_b64,
    payloadSha256: row.payload_sha256,
    createdAt: row.message_created_at,
  }));
  return { items, nextCursor: items.length ? items[items.length - 1].id : String(afterId || 0) };
};

const ackWalletEnvelope = async ({ userId, envelopeId, deviceId, status }) => {
  if (!['delivered', 'decrypted'].includes(String(status || ''))) {
    throw new ValidationError('Unsupported status', { field: 'status' });
  }
  if (status === 'delivered') {
    const ok = await repo.markWalletEnvelopeDelivered({ envelopeId, userId, deviceId });
    return { ok: Boolean(ok) };
  }
  const ok = await repo.markWalletEnvelopeDecrypted({ envelopeId, userId, deviceId });
  return { ok: Boolean(ok) };
};

module.exports = {
  attachEncryptedTransfer,
  syncEncryptedWalletEnvelopes,
  ackWalletEnvelope,
};

