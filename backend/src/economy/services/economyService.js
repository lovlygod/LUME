const crypto = require('crypto');
const {
  DAILY_TRANSFER_LIMIT_MICRO,
} = require('../constants');
const { ValidationError, NotFoundError } = require('../../errors');
const { InsufficientBalanceError, IdempotencyConflictError } = require('../errors');
const repo = require('../repositories/economyRepository');
const walletE2eeService = require('./walletE2eeService');
const {
  parseAmountCoinToMicro,
  calcTransferFeeMicro,
  calcTransferFeeSplit,
} = require('../math');

const resolveRecipientWallet = async (to) => {
  const value = String(to || '').trim();
  if (!value) throw new ValidationError('to is required', { field: 'to' });

  const byAddress = await repo.getWalletByAddress(value);
  if (byAddress) return byAddress;
  const byUsername = await repo.getWalletByUsername(value);
  if (byUsername) return byUsername;
  throw new NotFoundError('Recipient wallet not found', 'RECIPIENT_NOT_FOUND');
};

const previewRecipient = async (to) => {
  const value = String(to || '').trim();
  if (!value) throw new ValidationError('to is required', { field: 'to' });

  const isExplicitUsername = value.startsWith('@');
  const isExplicitAddress = /^lume_/i.test(value);
  let wallet = null;

  if (isExplicitUsername) {
    wallet = await repo.getWalletByUsername(value);
  } else if (isExplicitAddress) {
    wallet = await repo.getWalletByAddress(value);
  } else {
    wallet = await repo.getWalletByAddress(value);
    if (!wallet) wallet = await repo.getWalletByUsername(value);
  }

  if (!wallet) {
    if (isExplicitUsername) {
      throw new NotFoundError('User not found', 'RECIPIENT_USERNAME_NOT_FOUND');
    }
    if (isExplicitAddress) {
      throw new NotFoundError('Wallet address not found', 'RECIPIENT_ADDRESS_NOT_FOUND');
    }
    throw new NotFoundError('Recipient not found', 'RECIPIENT_NOT_FOUND');
  }

  const preview = await repo.getRecipientPreviewByWalletId(wallet.id);
  return {
    wallet_id: wallet.id,
    address: wallet.address,
    user_id: preview?.user_id || null,
    username: preview?.username || null,
    name: preview?.name || null,
    avatar: preview?.avatar || null,
  };
};

const getWallet = async (userId) => {
  const wallet = await repo.getWalletByUserId(userId);
  if (wallet) return wallet;

  const created = await repo.createWalletForUser(userId);
  if (!created) throw new NotFoundError('Wallet not found', 'WALLET_NOT_FOUND');
  return created;
};

const getWalletTransactions = async (userId, { cursor, limit, type }) => {
  const wallet = await getWallet(userId);
  const rows = await repo.listWalletTransactions(wallet.id, {
    cursor: cursor || null,
    limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
    type: type || null,
  });
  return rows;
};

const getWalletStats = async (userId) => {
  const wallet = await getWallet(userId);
  const stats = await repo.getWalletStats(wallet.id);
  return {
    wallet_id: wallet.id,
    income_micro: Number(stats?.income_micro || 0),
    expense_micro: Number(stats?.expense_micro || 0),
    fees_micro: Number(stats?.fees_micro || 0),
    sent_amount_micro: Number(stats?.sent_amount_micro || 0),
    transfer_count: Number(stats?.transfer_count || 0),
  };
};

const getExplorerTransactions = async ({ cursor, limit, type }) => {
  return repo.listExplorerTransactions({
    cursor: cursor || null,
    limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
    type: type || null,
  });
};

const transferCoin = async ({ actorUserId, to, amountCoin, idempotencyKey, metadata, encrypted }) => {
  if (!idempotencyKey || !String(idempotencyKey).trim()) {
    throw new ValidationError('idempotency_key is required', { field: 'idempotency_key' });
  }

  const existing = await repo.getTxByIdempotency(String(idempotencyKey), actorUserId);
  let amountMicro;
  try {
    amountMicro = parseAmountCoinToMicro(amountCoin);
  } catch (error) {
    throw new ValidationError(error.message, { code: error.code || 'INVALID_AMOUNT', field: 'amount_coin' });
  }
  const feeMicro = calcTransferFeeMicro(amountMicro);
  const { reserveFeeMicro, burnFeeMicro } = calcTransferFeeSplit(feeMicro);

  if (existing) {
    const sameAmount = BigInt(existing.amount_micro) === amountMicro;
    if (!sameAmount) {
      throw new IdempotencyConflictError({ existingTxHash: existing.tx_hash });
    }
    return { tx: existing, idempotentReplay: true };
  }

  const recipientWallet = await resolveRecipientWallet(to);
  const senderWallet = await getWallet(actorUserId);
  if (Number(recipientWallet.id) === Number(senderWallet.id)) {
    throw new ValidationError('Cannot transfer to self', { code: 'INVALID_RECIPIENT' });
  }

  const dailyUsedMicro = await repo.getDailyTransferVolume(actorUserId);
  const totalDebit = amountMicro + feeMicro;
  if (dailyUsedMicro + totalDebit > DAILY_TRANSFER_LIMIT_MICRO) {
    throw new ValidationError('Daily transfer limit exceeded', { code: 'TRANSFER_DAILY_LIMIT_EXCEEDED' });
  }

  const result = await repo.executeTransfer({
    fromUserId: actorUserId,
    toWalletId: recipientWallet.id,
    amountMicro,
    feeMicro,
    reserveFeeMicro,
    burnFeeMicro,
    idempotencyKey: String(idempotencyKey),
    metadata: {
      ...metadata,
      request_id: crypto.randomUUID(),
    },
  });

  if (result?.error === 'INSUFFICIENT_BALANCE') {
    throw new InsufficientBalanceError({ totalDebitMicro: totalDebit.toString() });
  }
  if (result?.error) {
    throw new ValidationError('Transfer execution failed', { code: result.error });
  }

  await repo.createEconomyAuditEvent({
    eventType: 'economy.transfer.completed',
    actorUserId,
    targetType: 'wallet',
    targetId: recipientWallet.id,
    payload: {
      txHash: result.tx.tx_hash,
      amountMicro: amountMicro.toString(),
      feeMicro: feeMicro.toString(),
      burnFeeMicro: burnFeeMicro.toString(),
      reserveFeeMicro: reserveFeeMicro.toString(),
    },
  });

  if (encrypted && recipientWallet.user_id) {
    await walletE2eeService.attachEncryptedTransfer({
      actorUserId,
      tx: result.tx,
      recipientUserId: recipientWallet.user_id,
      encrypted,
    });
  }

  return {
    tx: result.tx,
    idempotentReplay: false,
    recipientUserId: recipientWallet.user_id ? String(recipientWallet.user_id) : null,
  };
};

const getWalletEncryptedSync = async ({ userId, deviceId, afterId, limit }) => {
  return walletE2eeService.syncEncryptedWalletEnvelopes({ userId, deviceId, afterId, limit });
};

const ackWalletEncryptedEnvelope = async ({ userId, envelopeId, deviceId, status }) => {
  return walletE2eeService.ackWalletEnvelope({ userId, envelopeId, deviceId, status });
};

module.exports = {
  parseAmountCoinToMicro,
  calcTransferFeeMicro,
  calcTransferFeeSplit,
  getWallet,
  getWalletStats,
  getWalletTransactions,
  getExplorerTransactions,
  getWalletEncryptedSync,
  ackWalletEncryptedEnvelope,
  transferCoin,
  previewRecipient,
};

