const crypto = require('crypto');
const db = require('../../db');
const {
  SYSTEM_WALLET_CODES,
} = require('../constants');

const query = (text, params = []) => db.query(text, params);

const withTransaction = async (fn) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const createTxHash = () => crypto.randomBytes(24).toString('hex');

const createWalletAddress = () => `lume_${crypto.randomBytes(20).toString('hex')}`;

const getWalletByUserId = async (userId) => {
  const { rows } = await query(
    'SELECT * FROM wallets WHERE user_id = $1 LIMIT 1',
    [userId],
  );
  return rows[0] || null;
};

const createWalletForUser = async (userId) => {
  const address = createWalletAddress();
  const { rows } = await query(
    `INSERT INTO wallets (user_id, address, balance_micro, locked_balance_micro, status)
     VALUES ($1, $2, 0, 0, 'ACTIVE')
     ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId, address],
  );
  return rows[0] || null;
};

const getWalletByAddress = async (address) => {
  const { rows } = await query(
    'SELECT * FROM wallets WHERE address = $1 LIMIT 1',
    [address],
  );
  return rows[0] || null;
};

const getWalletByUsername = async (username) => {
  const normalized = String(username || '').trim().replace(/^@+/, '').toLowerCase();
  const { rows } = await query(
    `SELECT w.*
     FROM usernames un
     JOIN wallets w ON w.user_id = un.owner_id
     WHERE un.normalized_username = $1
     LIMIT 1`,
    [normalized],
  );
  if (rows[0]) return rows[0];

  const { rows: userRows } = await query(
    `SELECT w.*
     FROM users u
     JOIN wallets w ON w.user_id = u.id
     WHERE LOWER(u.username) = $1
     LIMIT 1`,
    [normalized],
  );
  return userRows[0] || null;
};

const getRecipientPreviewByWalletId = async (walletId) => {
  const { rows } = await query(
    `SELECT w.id AS wallet_id,
            w.address,
            w.user_id,
            u.username,
            u.name,
            u.avatar
     FROM wallets w
     LEFT JOIN users u ON u.id = w.user_id
     WHERE w.id = $1
     LIMIT 1`,
    [walletId],
  );
  return rows[0] || null;
};

const listWalletTransactions = async (walletId, { limit = 20, cursor = null, type = null }) => {
  const params = [walletId];
  const clauses = ['(lt.from_wallet_id = $1 OR lt.to_wallet_id = $1)'];

  if (cursor) {
    params.push(cursor);
    clauses.push(`lt.created_at < $${params.length}`);
  }
  if (type) {
    params.push(type);
    clauses.push(`lt.type = $${params.length}`);
  }
  params.push(limit);

  const { rows } = await query(
    `SELECT lt.*
     FROM ledger_transactions lt
     WHERE ${clauses.join(' AND ')}
     ORDER BY lt.created_at DESC
     LIMIT $${params.length}`,
    params,
  );
  return rows;
};

const listExplorerTransactions = async ({ limit = 20, cursor = null, type = null }) => {
  const params = [];
  const clauses = [];
  if (cursor) {
    params.push(cursor);
    clauses.push(`created_at < $${params.length}`);
  }
  if (type) {
    params.push(type);
    clauses.push(`type = $${params.length}`);
  }
  params.push(limit);
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT tx_hash, type, amount_micro, status, fee_micro, burn_micro, created_at, completed_at
     FROM explorer_public_transactions
     ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length}`,
    params,
  );
  return rows;
};

const getWalletStats = async (walletId) => {
  const { rows } = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN to_wallet_id = $1 AND type = 'TRANSFER' AND status = 'COMPLETED' THEN amount_micro ELSE 0 END), 0) AS income_micro,
       COALESCE(SUM(CASE WHEN from_wallet_id = $1 AND type = 'TRANSFER' AND status = 'COMPLETED' THEN amount_micro + fee_micro ELSE 0 END), 0) AS expense_micro,
       COALESCE(SUM(CASE WHEN from_wallet_id = $1 AND type = 'TRANSFER' AND status = 'COMPLETED' THEN fee_micro ELSE 0 END), 0) AS fees_micro,
       COALESCE(SUM(CASE WHEN from_wallet_id = $1 AND type = 'TRANSFER' AND status = 'COMPLETED' THEN amount_micro ELSE 0 END), 0) AS sent_amount_micro,
       COALESCE(SUM(CASE WHEN from_wallet_id = $1 AND type = 'TRANSFER' AND status = 'COMPLETED' THEN 1 ELSE 0 END), 0) AS transfer_count
     FROM ledger_transactions`,
    [walletId],
  );
  return rows[0] || null;
};

const getSystemWallet = async (client, code) => {
  const { rows } = await client.query('SELECT * FROM wallets WHERE system_code = $1 FOR UPDATE', [code]);
  return rows[0] || null;
};

const getUserWalletForUpdate = async (client, userId) => {
  const { rows } = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
  return rows[0] || null;
};

const getDailyTransferVolume = async (userId) => {
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount_micro + fee_micro), 0) AS total
     FROM ledger_transactions
     WHERE created_by_user_id = $1
       AND type = 'TRANSFER'
       AND status = 'COMPLETED'
       AND created_at >= date_trunc('day', NOW())`,
    [userId],
  );
  return BigInt(rows[0]?.total || 0);
};

const getTxByIdempotency = async (key, actorUserId) => {
  const { rows } = await query(
    `SELECT *
     FROM ledger_transactions
     WHERE idempotency_key = $1
       AND created_by_user_id = $2
       AND type = 'TRANSFER'
     ORDER BY id DESC
     LIMIT 1`,
    [key, actorUserId],
  );
  return rows[0] || null;
};

const createEconomyAuditEvent = async ({ eventType, actorUserId, targetType, targetId, payload }) => {
  await query(
    `INSERT INTO audit_economy_events (event_type, actor_user_id, target_type, target_id, payload_json)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [eventType, actorUserId || null, targetType || null, targetId || null, JSON.stringify(payload || {})],
  );
};

const executeTransfer = async ({ fromUserId, toWalletId, amountMicro, feeMicro, reserveFeeMicro, burnFeeMicro, idempotencyKey, metadata }) => {
  return withTransaction(async (client) => {
    const sender = await getUserWalletForUpdate(client, fromUserId);
    if (!sender) return { error: 'SENDER_WALLET_NOT_FOUND' };

    const { rows: receiverRows } = await client.query('SELECT * FROM wallets WHERE id = $1 FOR UPDATE', [toWalletId]);
    const receiver = receiverRows[0] || null;
    if (!receiver) return { error: 'RECEIVER_WALLET_NOT_FOUND' };

    const reserveWallet = await getSystemWallet(client, SYSTEM_WALLET_CODES.DEVELOPER_RESERVE);
    const burnWallet = await getSystemWallet(client, SYSTEM_WALLET_CODES.BURN_WALLET);
    if (!reserveWallet || !burnWallet) return { error: 'SYSTEM_WALLET_NOT_FOUND' };

    const senderBalance = BigInt(sender.balance_micro);
    const totalDebit = amountMicro + feeMicro;
    if (senderBalance < totalDebit) {
      return { error: 'INSUFFICIENT_BALANCE' };
    }

    const txHash = createTxHash();
    const { rows: txRows } = await client.query(
      `INSERT INTO ledger_transactions
       (tx_hash, type, status, from_wallet_id, to_wallet_id, amount_micro, fee_micro, burn_micro, currency_code, idempotency_key, metadata_json, created_by_user_id, created_at, completed_at)
       VALUES ($1, 'TRANSFER', 'COMPLETED', $2, $3, $4, $5, $6, 'LUX', $7, $8::jsonb, $9, NOW(), NOW())
       RETURNING *`,
      [
        txHash,
        sender.id,
        receiver.id,
        amountMicro.toString(),
        feeMicro.toString(),
        burnFeeMicro.toString(),
        idempotencyKey,
        JSON.stringify(metadata || {}),
        fromUserId,
      ],
    );
    const tx = txRows[0];

    await client.query('UPDATE wallets SET balance_micro = balance_micro - $1, updated_at = NOW() WHERE id = $2', [totalDebit.toString(), sender.id]);
    await client.query('UPDATE wallets SET balance_micro = balance_micro + $1, updated_at = NOW() WHERE id = $2', [amountMicro.toString(), receiver.id]);
    if (reserveFeeMicro > 0n) {
      await client.query('UPDATE wallets SET balance_micro = balance_micro + $1, updated_at = NOW() WHERE id = $2', [reserveFeeMicro.toString(), reserveWallet.id]);
    }
    if (burnFeeMicro > 0n) {
      await client.query('UPDATE wallets SET balance_micro = balance_micro + $1, updated_at = NOW() WHERE id = $2', [burnFeeMicro.toString(), burnWallet.id]);
    }

    const entries = [
      [tx.id, sender.id, 'DEBIT', amountMicro + feeMicro],
      [tx.id, receiver.id, 'CREDIT', amountMicro],
    ];
    if (reserveFeeMicro > 0n) entries.push([tx.id, reserveWallet.id, 'CREDIT', reserveFeeMicro]);
    if (burnFeeMicro > 0n) entries.push([tx.id, burnWallet.id, 'CREDIT', burnFeeMicro]);

    for (const [transactionId, walletId, direction, amount] of entries) {
      // eslint-disable-next-line no-await-in-loop
      await client.query(
        `INSERT INTO ledger_entries (transaction_id, wallet_id, direction, amount_micro)
         VALUES ($1, $2, $3, $4)`,
        [transactionId, walletId, direction, amount.toString()],
      );
    }

    return { tx };
  });
};

module.exports = {
  getWalletByUserId,
  createWalletForUser,
  getWalletByAddress,
  getWalletByUsername,
  getRecipientPreviewByWalletId,
  listWalletTransactions,
  listExplorerTransactions,
  getWalletStats,
  getDailyTransferVolume,
  getTxByIdempotency,
  createEconomyAuditEvent,
  executeTransfer,
};

