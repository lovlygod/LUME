const crypto = require('crypto');
const db = require('../../db');

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

const createPurchaseOrder = async ({ buyerId, provider, requestedCoinsMicro, paidFiatMinor }) => {
  const providerOrderId = crypto.randomUUID();
  const { rows } = await db.query(
    `INSERT INTO coin_purchase_orders
     (buyer_id, provider, provider_order_id, requested_coins_micro, paid_fiat_minor, fiat_currency, rate_snapshot_numerator, rate_snapshot_denominator, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'RUB', 23, 10, 'PENDING', NOW(), NOW())
     RETURNING *`,
    [buyerId, provider, providerOrderId, requestedCoinsMicro.toString(), paidFiatMinor.toString()],
  );
  return rows[0];
};

const getPurchaseOrderById = async (id) => {
  const { rows } = await db.query('SELECT * FROM coin_purchase_orders WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
};

const getUserPurchaseOrderById = async ({ id, buyerId }) => {
  const { rows } = await db.query('SELECT * FROM coin_purchase_orders WHERE id = $1 AND buyer_id = $2 LIMIT 1', [id, buyerId]);
  return rows[0] || null;
};

const confirmPurchaseOrderPaid = async ({ orderId, actorUserId, idempotencyKey, providerPaymentId }) => {
  return withTransaction(async (client) => {
    const { rows: existingTxRows } = await client.query(
      `SELECT *
       FROM ledger_transactions
       WHERE idempotency_key = $1
         AND created_by_user_id = $2
         AND type = 'COIN_PURCHASE'
       ORDER BY id DESC
       LIMIT 1`,
      [idempotencyKey, actorUserId],
    );
    if (existingTxRows[0]) return { idempotent: true, tx: existingTxRows[0] };

    const { rows: orderRows } = await client.query(
      'SELECT * FROM coin_purchase_orders WHERE id = $1 FOR UPDATE',
      [orderId],
    );
    const order = orderRows[0];
    if (!order) return { error: 'ORDER_NOT_FOUND' };
    if (order.status === 'PAID' && order.credited_tx_id) return { error: 'ORDER_ALREADY_PAID' };
    if (order.status !== 'PENDING') return { error: 'ORDER_STATUS_INVALID' };

    const { rows: buyerWalletRows } = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [order.buyer_id]);
    const { rows: treasuryRows } = await client.query("SELECT * FROM wallets WHERE system_code = 'TREASURY' FOR UPDATE");
    const buyerWallet = buyerWalletRows[0];
    const treasuryWallet = treasuryRows[0];
    if (!buyerWallet || !treasuryWallet) return { error: 'WALLET_NOT_FOUND' };

    const amountMicro = BigInt(order.requested_coins_micro);
    if (BigInt(treasuryWallet.balance_micro) < amountMicro) return { error: 'TREASURY_INSUFFICIENT' };

    const txHash = createTxHash();
    const { rows: txRows } = await client.query(
      `INSERT INTO ledger_transactions
       (tx_hash, type, status, from_wallet_id, to_wallet_id, amount_micro, fee_micro, burn_micro, currency_code, idempotency_key, external_provider, external_tx_id, metadata_json, created_by_user_id, created_at, completed_at)
       VALUES ($1, 'COIN_PURCHASE', 'COMPLETED', $2, $3, $4, 0, 0, 'LUX', $5, $6, $7, $8::jsonb, $9, NOW(), NOW())
       RETURNING *`,
      [
        txHash,
        treasuryWallet.id,
        buyerWallet.id,
        amountMicro.toString(),
        idempotencyKey,
        order.provider,
        providerPaymentId || null,
        JSON.stringify({ orderId: order.id, manualConfirm: true }),
        actorUserId,
      ],
    );
    const tx = txRows[0];

    await client.query('UPDATE wallets SET balance_micro = balance_micro - $1, updated_at = NOW() WHERE id = $2', [amountMicro.toString(), treasuryWallet.id]);
    await client.query('UPDATE wallets SET balance_micro = balance_micro + $1, updated_at = NOW() WHERE id = $2', [amountMicro.toString(), buyerWallet.id]);

    await client.query('INSERT INTO ledger_entries (transaction_id, wallet_id, direction, amount_micro) VALUES ($1, $2, $3, $4)', [tx.id, treasuryWallet.id, 'DEBIT', amountMicro.toString()]);
    await client.query('INSERT INTO ledger_entries (transaction_id, wallet_id, direction, amount_micro) VALUES ($1, $2, $3, $4)', [tx.id, buyerWallet.id, 'CREDIT', amountMicro.toString()]);

    await client.query(
      `UPDATE coin_purchase_orders
       SET status = 'PAID',
           provider_payment_id = COALESCE($1, provider_payment_id),
           credited_tx_id = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [providerPaymentId || null, tx.id, order.id],
    );

    await client.query(
      `UPDATE coin_supply_state
       SET sold_supply_micro = sold_supply_micro + $1,
           updated_at = NOW()
       WHERE id = 1`,
      [amountMicro.toString()],
    );

    return { orderId: order.id, tx, idempotent: false };
  });
};

module.exports = {
  createPurchaseOrder,
  getPurchaseOrderById,
  getUserPurchaseOrderById,
  confirmPurchaseOrderPaid,
};

