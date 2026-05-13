module.exports = function registerE2EERoutes(router, deps) {
  const { db, authenticateToken, asyncHandler } = deps;
  const isSafeUrl = (value) => /^https?:\/\//i.test(String(value || ''));

  router.post('/e2ee/devices/register', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const {
      deviceId,
      deviceName,
      identityKey,
      identityKeyAlgo = 'x25519',
      signedPrekeyId,
      signedPrekeyPublic,
      signedPrekeySignature,
      signedPrekeyAlgo = 'x25519',
      registrationId = null,
      oneTimePrekeys = [],
    } = req.body || {};

    if (!deviceId || !identityKey || !signedPrekeyPublic || !signedPrekeySignature || !Number.isInteger(Number(signedPrekeyId))) {
      return res.status(400).json({ error: 'Invalid E2EE device bundle payload' });
    }

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO e2ee_devices
          (user_id, device_id, device_name, identity_key, identity_key_algo, signed_prekey_id, signed_prekey_public, signed_prekey_signature, signed_prekey_algo, registration_id, updated_at, revoked_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NULL)
         ON CONFLICT (user_id, device_id)
         DO UPDATE SET
           device_name = $3,
           identity_key = $4,
           identity_key_algo = $5,
           signed_prekey_id = $6,
           signed_prekey_public = $7,
           signed_prekey_signature = $8,
           signed_prekey_algo = $9,
           registration_id = $10,
           updated_at = NOW(),
           revoked_at = NULL`,
        [userId, String(deviceId), deviceName || null, identityKey, identityKeyAlgo, Number(signedPrekeyId), signedPrekeyPublic, signedPrekeySignature, signedPrekeyAlgo, registrationId],
        (err) => (err ? reject(err) : resolve())
      );
    });

    const safeKeys = Array.isArray(oneTimePrekeys)
      ? oneTimePrekeys
          .map((k) => ({ prekeyId: Number(k?.prekeyId), publicKey: k?.publicKey, keyAlgo: k?.keyAlgo || 'x25519' }))
          .filter((k) => Number.isInteger(k.prekeyId) && typeof k.publicKey === 'string' && k.publicKey.length > 0)
          .slice(0, 200)
      : [];

    for (const key of safeKeys) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        db.run(
          `INSERT INTO e2ee_one_time_prekeys (user_id, device_id, prekey_id, public_key, key_algo)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (user_id, device_id, prekey_id)
           DO UPDATE SET public_key = $4, key_algo = $5, used_at = NULL, used_by_user_id = NULL, used_by_device_id = NULL`,
          [userId, String(deviceId), key.prekeyId, key.publicKey, key.keyAlgo],
          () => resolve()
        );
      });
    }

    res.json({ ok: true });
  }));

  router.get('/e2ee/users/:userId/devices', authenticateToken, asyncHandler(async (req, res) => {
    const requesterUserId = req.user.userId;
    const targetUserId = Number(req.params.userId);
    const requesterDeviceId = String(req.query.deviceId || 'unknown');

    if (!Number.isInteger(targetUserId)) return res.status(400).json({ error: 'Invalid user id' });

    const devices = await new Promise((resolve, reject) => {
      db.all(
        `SELECT user_id, device_id, device_name, identity_key, identity_key_algo,
                signed_prekey_id, signed_prekey_public, signed_prekey_signature, signed_prekey_algo, registration_id
         FROM e2ee_devices
         WHERE user_id = $1 AND revoked_at IS NULL
         ORDER BY created_at ASC`,
        [targetUserId],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });

    const result = [];
    for (const device of devices) {
      // eslint-disable-next-line no-await-in-loop
      const oneTimePrekey = await new Promise((resolve) => {
        db.get(
          `SELECT id, prekey_id, public_key, key_algo
           FROM e2ee_one_time_prekeys
           WHERE user_id = $1 AND device_id = $2 AND used_at IS NULL
           ORDER BY prekey_id ASC
           LIMIT 1`,
          [targetUserId, device.device_id],
          (err, row) => {
            if (err || !row) return resolve(null);
            db.run(
              `UPDATE e2ee_one_time_prekeys
               SET used_at = NOW(), used_by_user_id = $1, used_by_device_id = $2
               WHERE id = $3 AND used_at IS NULL`,
              [requesterUserId, requesterDeviceId, row.id],
              function onUpdate(updateErr) {
                if (updateErr || this.changes === 0) return resolve(null);
                resolve({ prekeyId: row.prekey_id, publicKey: row.public_key, keyAlgo: row.key_algo });
              }
            );
          }
        );
      });

      result.push({
        userId: String(device.user_id),
        deviceId: device.device_id,
        deviceName: device.device_name,
        identityKey: device.identity_key,
        identityKeyAlgo: device.identity_key_algo,
        signedPrekey: {
          prekeyId: device.signed_prekey_id,
          publicKey: device.signed_prekey_public,
          signature: device.signed_prekey_signature,
          keyAlgo: device.signed_prekey_algo,
        },
        registrationId: device.registration_id,
        oneTimePrekey,
      });
    }

    res.json({ devices: result });
  }));

  router.post('/e2ee/messages', authenticateToken, asyncHandler(async (req, res) => {
    const senderUserId = req.user.userId;
    const {
      chatId,
      senderDeviceId,
      recipientUserId,
      recipientDeviceId,
      messageType = 'ciphertext',
      protocolVersion = 1,
      clientMessageId = null,
      sentAt = null,
      envelope,
    } = req.body || {};
    if (!chatId || !senderDeviceId || !recipientUserId || !recipientDeviceId || !envelope) {
      return res.status(400).json({ error: 'Invalid E2EE message payload' });
    }

    if (clientMessageId && String(clientMessageId).length > 120) {
      return res.status(400).json({ error: 'clientMessageId is too long' });
    }

    const messageId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO e2ee_messages
          (chat_id, sender_user_id, sender_device_id, recipient_user_id, recipient_device_id, message_type, protocol_version, client_message_id, sent_at, envelope_json)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          chatId,
          senderUserId,
          String(senderDeviceId),
          Number(recipientUserId),
          String(recipientDeviceId),
          messageType,
          Number(protocolVersion),
          clientMessageId ? String(clientMessageId) : null,
          sentAt || null,
          JSON.stringify(envelope),
        ],
        function(err) { if (err) reject(err); else resolve(this.lastID); }
      );
    });

    res.status(201).json({ ok: true, messageId: String(messageId) });
  }));

  router.get('/e2ee/messages/sync', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const deviceId = String(req.query.deviceId || '');
    const afterId = Number(req.query.afterId || 0);
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const rows = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, chat_id, sender_user_id, sender_device_id, recipient_user_id, recipient_device_id,
                message_type, protocol_version, client_message_id, sent_at, created_at, envelope_json
         FROM e2ee_messages
         WHERE recipient_user_id = $1
           AND recipient_device_id = $2
           AND id > $3
         ORDER BY id ASC
         LIMIT $4`,
        [userId, deviceId, afterId, limit],
        (err, result) => (err ? reject(err) : resolve(result || []))
      );
    });

    const items = rows.map((row) => ({
      id: String(row.id),
      chatId: String(row.chat_id),
      senderUserId: String(row.sender_user_id),
      senderDeviceId: row.sender_device_id,
      recipientUserId: String(row.recipient_user_id),
      recipientDeviceId: row.recipient_device_id,
      messageType: row.message_type,
      protocolVersion: row.protocol_version,
      clientMessageId: row.client_message_id,
      sentAt: row.sent_at,
      createdAt: row.created_at,
      envelope: (() => {
        try {
          return JSON.parse(row.envelope_json);
        } catch (_error) {
          return null;
        }
      })(),
    }));

    res.json({ items, nextCursor: items.length > 0 ? items[items.length - 1].id : String(afterId) });
  }));

  router.post('/e2ee/messages/:messageId/receipt', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const messageId = Number(req.params.messageId);
    const { deviceId, status = 'delivered' } = req.body || {};

    if (!Number.isInteger(messageId) || messageId <= 0) {
      return res.status(400).json({ error: 'Invalid message id' });
    }
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }
    if (!['delivered'].includes(String(status))) {
      return res.status(400).json({ error: 'Unsupported receipt status' });
    }

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE e2ee_messages
         SET delivered_at = NOW()
         WHERE id = $1 AND recipient_user_id = $2 AND recipient_device_id = $3`,
        [messageId, userId, String(deviceId)],
        function onUpdate(err) {
          if (err) return reject(err);
          if (this.changes === 0) return reject(new Error('NOT_FOUND'));
          resolve();
        }
      );
    }).catch((error) => {
      if (String(error?.message || '') === 'NOT_FOUND') {
        res.status(404).json({ error: 'Message not found for this recipient device' });
        return;
      }
      throw error;
    });

    if (res.headersSent) return;
    res.json({ ok: true });
  }));

  router.get('/e2ee/devices', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const rows = await new Promise((resolve, reject) => {
      db.all(
        `SELECT user_id, device_id, device_name, identity_key, identity_key_algo,
                signed_prekey_id, signed_prekey_public, signed_prekey_signature, signed_prekey_algo,
                registration_id, created_at, updated_at, revoked_at
         FROM e2ee_devices
         WHERE user_id = $1
         ORDER BY created_at ASC`,
        [userId],
        (err, result) => (err ? reject(err) : resolve(result || []))
      );
    });

    const devices = rows.map((row) => ({
      userId: String(row.user_id),
      deviceId: row.device_id,
      deviceName: row.device_name,
      identityKey: row.identity_key,
      identityKeyAlgo: row.identity_key_algo,
      signedPrekey: {
        prekeyId: row.signed_prekey_id,
        publicKey: row.signed_prekey_public,
        signature: row.signed_prekey_signature,
        keyAlgo: row.signed_prekey_algo,
      },
      registrationId: row.registration_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      revokedAt: row.revoked_at,
    }));

    res.json({ devices });
  }));

  router.post('/e2ee/devices/verify', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const {
      verifierDeviceId,
      targetUserId,
      targetDeviceId,
      status,
    } = req.body || {};

    if (!verifierDeviceId || !targetUserId || !targetDeviceId || !['trusted', 'untrusted'].includes(String(status))) {
      return res.status(400).json({ error: 'Invalid device verification payload' });
    }

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO e2ee_device_trust
          (user_id, verifier_device_id, target_user_id, target_device_id, status, verified_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
         ON CONFLICT (user_id, verifier_device_id, target_user_id, target_device_id)
         DO UPDATE SET status = $5, updated_at = NOW()`,
        [userId, String(verifierDeviceId), Number(targetUserId), String(targetDeviceId), String(status)],
        (err) => (err ? reject(err) : resolve())
      );
    });

    res.json({ ok: true });
  }));

  router.get('/e2ee/devices/trust', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const verifierDeviceId = String(req.query.verifierDeviceId || '');

    if (!verifierDeviceId) {
      return res.status(400).json({ error: 'verifierDeviceId is required' });
    }

    const rows = await new Promise((resolve, reject) => {
      db.all(
        `SELECT target_user_id, target_device_id, status, verified_at, updated_at
         FROM e2ee_device_trust
         WHERE user_id = $1 AND verifier_device_id = $2
         ORDER BY updated_at DESC`,
        [userId, verifierDeviceId],
        (err, result) => (err ? reject(err) : resolve(result || []))
      );
    });

    const trust = rows.map((row) => ({
      targetUserId: String(row.target_user_id),
      targetDeviceId: row.target_device_id,
      status: row.status,
      verifiedAt: row.verified_at,
      updatedAt: row.updated_at,
    }));

    res.json({ trust });
  }));

  router.post('/e2ee/attachments', authenticateToken, asyncHandler(async (req, res) => {
    const senderUserId = req.user.userId;
    const {
      messageId = null,
      senderDeviceId,
      recipientUserId,
      recipientDeviceId,
      storageUrl,
      mimeType = null,
      ciphertextSize = null,
      sha256Ciphertext = null,
      encryptedFileKey,
      encryptedFileNonce = null,
      protocolVersion = 1,
    } = req.body || {};

    if (!senderDeviceId || !recipientUserId || !recipientDeviceId || !storageUrl || !encryptedFileKey) {
      return res.status(400).json({ error: 'Invalid encrypted attachment payload' });
    }
    if (!isSafeUrl(storageUrl)) {
      return res.status(400).json({ error: 'storageUrl must be an absolute http(s) URL' });
    }
    if (ciphertextSize !== null && (!Number.isFinite(Number(ciphertextSize)) || Number(ciphertextSize) <= 0)) {
      return res.status(400).json({ error: 'ciphertextSize must be a positive number' });
    }
    if (sha256Ciphertext && !/^[a-f0-9]{64}$/i.test(String(sha256Ciphertext))) {
      return res.status(400).json({ error: 'sha256Ciphertext must be a 64-char hex digest' });
    }
    if (String(encryptedFileKey).length > 8192) {
      return res.status(400).json({ error: 'encryptedFileKey is too large' });
    }

    const attachmentId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO e2ee_encrypted_attachments
          (message_id, sender_user_id, sender_device_id, recipient_user_id, recipient_device_id,
           storage_url, mime_type, ciphertext_size, sha256_ciphertext, encrypted_file_key, encrypted_file_nonce, protocol_version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          messageId ? Number(messageId) : null,
          senderUserId,
          String(senderDeviceId),
          Number(recipientUserId),
          String(recipientDeviceId),
          String(storageUrl),
          mimeType,
          ciphertextSize !== null ? Number(ciphertextSize) : null,
          sha256Ciphertext,
          String(encryptedFileKey),
          encryptedFileNonce,
          Number(protocolVersion),
        ],
        function onInsert(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });

    res.status(201).json({ ok: true, attachmentId: String(attachmentId) });
  }));

  router.get('/e2ee/attachments/sync', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const deviceId = String(req.query.deviceId || '');
    const afterId = Number(req.query.afterId || 0);
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const rows = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, message_id, sender_user_id, sender_device_id, recipient_user_id, recipient_device_id,
                storage_url, mime_type, ciphertext_size, sha256_ciphertext, encrypted_file_key, encrypted_file_nonce,
                protocol_version, created_at
         FROM e2ee_encrypted_attachments
         WHERE recipient_user_id = $1
           AND recipient_device_id = $2
           AND id > $3
         ORDER BY id ASC
         LIMIT $4`,
        [userId, deviceId, afterId, limit],
        (err, result) => (err ? reject(err) : resolve(result || []))
      );
    });

    const items = rows.map((row) => ({
      id: String(row.id),
      messageId: row.message_id ? String(row.message_id) : null,
      senderUserId: String(row.sender_user_id),
      senderDeviceId: row.sender_device_id,
      recipientUserId: String(row.recipient_user_id),
      recipientDeviceId: row.recipient_device_id,
      storageUrl: row.storage_url,
      mimeType: row.mime_type,
      ciphertextSize: row.ciphertext_size,
      sha256Ciphertext: row.sha256_ciphertext,
      encryptedFileKey: row.encrypted_file_key,
      encryptedFileNonce: row.encrypted_file_nonce,
      protocolVersion: row.protocol_version,
      createdAt: row.created_at,
    }));

    res.json({ items, nextCursor: items.length > 0 ? items[items.length - 1].id : String(afterId) });
  }));
};

