const crypto = require('crypto');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../errors');
const repo = require('../repositories/coinPurchaseRepository');
const economyRepo = require('../repositories/economyRepository');

const ADMIN_CONFIRM_USERNAME = 'zxclovly';

const toMicro = (amountCoin) => {
  const raw = String(amountCoin ?? '').trim();
  if (!/^\d+(\.\d{1,3})?$/.test(raw)) throw new ValidationError('Invalid amount_coin', { field: 'amount_coin' });
  const [whole, frac = ''] = raw.split('.');
  const micro = BigInt(whole) * 1000n + BigInt((frac + '000').slice(0, 3));
  if (micro <= 0n) throw new ValidationError('amount_coin must be positive', { field: 'amount_coin' });
  return micro;
};

const createOrder = async ({ buyerId, provider, amountCoin }) => {
  const requestedCoinsMicro = toMicro(amountCoin);
  const paidFiatMinor = (requestedCoinsMicro * 23n) / 10n;
  const order = await repo.createPurchaseOrder({
    buyerId,
    provider: provider || 'card_manual',
    requestedCoinsMicro,
    paidFiatMinor,
  });

  await economyRepo.createEconomyAuditEvent({
    eventType: 'economy.coin.purchase.order.created',
    actorUserId: buyerId,
    targetType: 'coin_purchase_order',
    targetId: order.id,
    payload: {
      requestedCoinsMicro: requestedCoinsMicro.toString(),
      paidFiatMinor: paidFiatMinor.toString(),
      fiat: 'RUB',
    },
  });

  return order;
};

const getOrderForUser = async ({ orderId, buyerId }) => {
  const order = await repo.getUserPurchaseOrderById({ id: orderId, buyerId });
  if (!order) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');
  return order;
};

const confirmOrderPaidByAdmin = async ({ orderId, adminUser, idempotencyKey, providerPaymentId }) => {
  if (!idempotencyKey || !String(idempotencyKey).trim()) {
    throw new ValidationError('idempotency_key is required', { field: 'idempotency_key' });
  }
  const adminName = String(adminUser?.username || '').toLowerCase();
  if (adminName !== ADMIN_CONFIRM_USERNAME) {
    throw new ForbiddenError('FORBIDDEN', 'FORBIDDEN');
  }

  const result = await repo.confirmPurchaseOrderPaid({
    orderId,
    actorUserId: adminUser.userId,
    idempotencyKey: String(idempotencyKey),
    providerPaymentId: providerPaymentId || null,
  });

  if (result?.error === 'ORDER_NOT_FOUND') throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');
  if (result?.error === 'ORDER_ALREADY_PAID') throw new ValidationError('ORDER_ALREADY_PAID', { code: 'ORDER_ALREADY_PAID' });
  if (result?.error === 'ORDER_STATUS_INVALID') throw new ValidationError('ORDER_STATUS_INVALID', { code: 'ORDER_STATUS_INVALID' });
  if (result?.error === 'TREASURY_INSUFFICIENT') throw new ValidationError('INSUFFICIENT_BALANCE', { code: 'INSUFFICIENT_BALANCE' });
  if (result?.error) throw new ValidationError(result.error, { code: result.error });

  await economyRepo.createEconomyAuditEvent({
    eventType: 'economy.coin.purchase.confirmed',
    actorUserId: adminUser.userId,
    targetType: 'coin_purchase_order',
    targetId: orderId,
    payload: {
      txHash: result.tx.tx_hash,
      idempotent: !!result.idempotent,
      providerPaymentId: providerPaymentId || null,
    },
  });

  return result;
};

const verifyWebhookSignature = ({ provider, signature, payload, secret }) => {
  const key = String(secret || '').trim();
  if (!key) return false;
  const body = JSON.stringify(payload || {});
  const digest = crypto.createHmac('sha256', key).update(`${provider}:${body}`).digest('hex');
  return digest === String(signature || '').trim();
};

module.exports = {
  createOrder,
  getOrderForUser,
  confirmOrderPaidByAdmin,
  verifyWebhookSignature,
};

