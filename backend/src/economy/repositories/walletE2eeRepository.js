const db = require('../../db');

const query = (text, params = []) => db.query(text, params);

const reserveReplayNonce = async ({ actorUserId, senderDeviceId, clientOperationId, nonceB64 }) => {
  const { rows } = await query(
    `INSERT INTO wallet_e2ee_replay_guard (actor_user_id, sender_device_id, client_operation_id, nonce_b64)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (actor_user_id, sender_device_id, client_operation_id) DO NOTHING
     RETURNING id`,
    [actorUserId, senderDeviceId, clientOperationId, nonceB64],
  );
  return rows[0] || null;
};

const createWalletEncryptedMessage = async ({
  txId,
  txHash,
  senderUserId,
  recipientUserId,
  senderDeviceId,
  protocolVersion,
  cipherAlg,
  aad,
  ciphertextB64,
  nonceB64,
  payloadSha256,
  clientOperationId,
}) => {
  const { rows } = await query(
    `INSERT INTO wallet_e2ee_messages
      (tx_id, tx_hash, sender_user_id, recipient_user_id, sender_device_id, protocol_version, cipher_alg, aad_json, ciphertext_b64, nonce_b64, payload_sha256, client_operation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12)
     RETURNING *`,
    [
      txId,
      txHash,
      senderUserId,
      recipientUserId,
      senderDeviceId,
      Number(protocolVersion || 1),
      String(cipherAlg || 'xchacha20poly1305'),
      JSON.stringify(aad || {}),
      ciphertextB64,
      nonceB64,
      payloadSha256,
      clientOperationId || null,
    ],
  );
  return rows[0] || null;
};

const createWalletEncryptedEnvelopes = async (messageId, envelopes) => {
  const inserted = [];
  for (const env of envelopes) {
    // eslint-disable-next-line no-await-in-loop
    const { rows } = await query(
      `INSERT INTO wallet_e2ee_envelopes
        (message_id, recipient_user_id, recipient_device_id, wrapped_key_b64, wrap_alg, envelope_json)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)
       ON CONFLICT (message_id, recipient_user_id, recipient_device_id) DO NOTHING
       RETURNING *`,
      [
        messageId,
        Number(env.recipientUserId),
        String(env.recipientDeviceId),
        String(env.wrappedKeyB64),
        String(env.wrapAlg || 'x25519-hkdf'),
        JSON.stringify(env.envelope || {}),
      ],
    );
    if (rows[0]) inserted.push(rows[0]);
  }
  return inserted;
};

const listWalletEncryptedEnvelopes = async ({ userId, deviceId, afterId = 0, limit = 100 }) => {
  const { rows } = await query(
    `SELECT e.id, e.message_id, e.recipient_user_id, e.recipient_device_id, e.wrapped_key_b64, e.wrap_alg, e.envelope_json,
            m.tx_hash, m.sender_user_id, m.recipient_user_id AS message_recipient_user_id,
            m.protocol_version, m.cipher_alg, m.aad_json, m.ciphertext_b64, m.nonce_b64, m.payload_sha256,
            m.created_at AS message_created_at
     FROM wallet_e2ee_envelopes e
     JOIN wallet_e2ee_messages m ON m.id = e.message_id
     WHERE e.recipient_user_id = $1
       AND e.recipient_device_id = $2
       AND e.id > $3
     ORDER BY e.id ASC
     LIMIT $4`,
    [userId, String(deviceId), Number(afterId) || 0, Math.min(Math.max(Number(limit) || 100, 1), 500)],
  );
  return rows;
};

const markWalletEnvelopeDelivered = async ({ envelopeId, userId, deviceId }) => {
  const { rows } = await query(
    `UPDATE wallet_e2ee_envelopes
     SET delivered_at = COALESCE(delivered_at, NOW())
     WHERE id = $1
       AND recipient_user_id = $2
       AND recipient_device_id = $3
     RETURNING id`,
    [Number(envelopeId), Number(userId), String(deviceId)],
  );
  return rows[0] || null;
};

const markWalletEnvelopeDecrypted = async ({ envelopeId, userId, deviceId }) => {
  const { rows } = await query(
    `UPDATE wallet_e2ee_envelopes
     SET decrypted_at = COALESCE(decrypted_at, NOW())
     WHERE id = $1
       AND recipient_user_id = $2
       AND recipient_device_id = $3
     RETURNING id`,
    [Number(envelopeId), Number(userId), String(deviceId)],
  );
  return rows[0] || null;
};

module.exports = {
  reserveReplayNonce,
  createWalletEncryptedMessage,
  createWalletEncryptedEnvelopes,
  listWalletEncryptedEnvelopes,
  markWalletEnvelopeDelivered,
  markWalletEnvelopeDecrypted,
};

