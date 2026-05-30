const express = require('express');
const { createRateLimiter } = require('../rateLimiter');
const { asyncHandler } = require('../errors');
const economyService = require('../economy/services/economyService');
const usernameMarketService = require('../economy/services/usernameMarketService');
const coinPurchaseService = require('../economy/services/coinPurchaseService');

const parseBooleanLike = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
};

const marketBuyUserCounters = new Map();

const marketBuyLimiter = (req, _res, next) => {
  const userId = String(req.user?.userId || '');
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
  const now = Date.now();
  const minute = 60 * 1000;

  const userBucket = marketBuyUserCounters.get(userId) || { count: 0, resetAt: now + minute };
  if (now > userBucket.resetAt) {
    userBucket.count = 0;
    userBucket.resetAt = now + minute;
  }
  userBucket.count += 1;
  marketBuyUserCounters.set(userId, userBucket);

  req._marketIp = ip;
  if (userBucket.count > 50) {
    const error = new Error('Rate limit exceeded');
    error.statusCode = 429;
    error.code = 'RATE_LIMIT_EXCEEDED';
    error.details = { retryAfter: Math.ceil((userBucket.resetAt - now) / 1000) };
    return next(error);
  }

  return next();
};

module.exports = ({ authenticateToken }) => {
  const router = express.Router();

  router.get('/economy/wallet', authenticateToken, asyncHandler(async (req, res) => {
    const wallet = await economyService.getWallet(req.user.userId);
    res.json({ wallet });
  }));

  router.get('/economy/wallet/stats', authenticateToken, asyncHandler(async (req, res) => {
    const stats = await economyService.getWalletStats(req.user.userId);
    res.json({ stats });
  }));

  router.get('/economy/wallet/transactions', authenticateToken, asyncHandler(async (req, res) => {
    const rows = await economyService.getWalletTransactions(req.user.userId, {
      cursor: req.query.cursor,
      limit: req.query.limit,
      type: req.query.type,
    });
    res.json({ transactions: rows });
  }));

  router.get('/economy/wallet/explorer/public', authenticateToken, asyncHandler(async (req, res) => {
    const rows = await economyService.getExplorerTransactions({
      cursor: req.query.cursor,
      limit: req.query.limit,
      type: req.query.type,
    });
    res.json({ transactions: rows });
  }));

  router.post('/economy/coin/transfers', authenticateToken, createRateLimiter('economy_transfer'), asyncHandler(async (req, res) => {
    const result = await economyService.transferCoin({
      actorUserId: req.user.userId,
      to: req.body?.to,
      amountCoin: req.body?.amount_coin,
      idempotencyKey: req.body?.idempotency_key,
      encrypted: req.body?.encrypted || null,
      metadata: {
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
        userAgent: req.get('user-agent') || null,
      },
    });

    const sendToUser = req.app.get('sendToUser');
    const actorUserId = String(req.user.userId);
    if (typeof sendToUser === 'function') {
      const eventPayload = {
        type: 'economy:wallet_updated',
        data: {
          reason: 'transfer',
          txHash: result?.tx?.tx_hash || null,
          amountMicro: result?.tx?.amount_micro || null,
          feeMicro: result?.tx?.fee_micro || null,
          at: new Date().toISOString(),
        },
      };

      sendToUser(actorUserId, eventPayload);
      if (result?.recipientUserId && String(result.recipientUserId) !== actorUserId) {
        sendToUser(String(result.recipientUserId), eventPayload);
      }
    }

    res.status(result.idempotentReplay ? 200 : 201).json(result);
  }));

  router.get('/economy/wallet/e2ee/sync', authenticateToken, asyncHandler(async (req, res) => {
    const result = await economyService.getWalletEncryptedSync({
      userId: req.user.userId,
      deviceId: String(req.query.deviceId || ''),
      afterId: req.query.afterId,
      limit: req.query.limit,
    });
    res.json(result);
  }));

  router.post('/economy/wallet/e2ee/envelopes/:id/ack', authenticateToken, asyncHandler(async (req, res) => {
    const result = await economyService.ackWalletEncryptedEnvelope({
      userId: req.user.userId,
      envelopeId: Number(req.params.id),
      deviceId: String(req.body?.deviceId || ''),
      status: String(req.body?.status || ''),
    });
    res.json(result);
  }));

  router.get('/economy/coin/recipient-preview', authenticateToken, asyncHandler(async (req, res) => {
    const recipient = await economyService.previewRecipient(req.query?.to);
    res.json({ recipient });
  }));

  router.get('/economy/usernames/my', authenticateToken, asyncHandler(async (req, res) => {
    const usernames = await usernameMarketService.getMyUsernames(req.user.userId);
    console.log('[economy/usernames/my] userId=%s usernames=%o', String(req.user.userId), usernames);
    res.json({ usernames });
  }));

  router.get('/economy/users/:userId/usernames', authenticateToken, asyncHandler(async (req, res) => {
    const targetUserId = Number(req.params.userId);
    const usernames = await usernameMarketService.getUserUsernames(targetUserId);
    console.log('[economy/users/:userId/usernames] userId=%s usernames=%o', String(targetUserId), usernames);
    res.json({ usernames });
  }));

  router.patch('/economy/usernames/:id/visibility', authenticateToken, asyncHandler(async (req, res) => {
    const result = await usernameMarketService.setMyUsernameVisibility({
      userId: req.user.userId,
      usernameId: Number(req.params.id),
      isVisible: parseBooleanLike(req.body?.is_visible, false),
    });
    res.json(result);
  }));

  router.patch('/economy/usernames/:id/display-order', authenticateToken, asyncHandler(async (req, res) => {
    const result = await usernameMarketService.setMyUsernameDisplayOrder({
      userId: req.user.userId,
      usernameId: Number(req.params.id),
      displayOrder: Number(req.body?.display_order),
    });
    res.json(result);
  }));

  router.delete('/economy/usernames/:id/display-order', authenticateToken, asyncHandler(async (req, res) => {
    const result = await usernameMarketService.clearMyUsernameDisplayOrder({
      userId: req.user.userId,
      usernameId: Number(req.params.id),
    });
    res.json(result);
  }));

  router.post('/economy/usernames/listings', authenticateToken, asyncHandler(async (req, res) => {
    const result = await usernameMarketService.createListing({
      userId: req.user.userId,
      usernameId: Number(req.body?.username_id),
      priceCoin: req.body?.price_coin,
    });

    const broadcast = req.app.get('broadcast');
    if (typeof broadcast === 'function') {
      broadcast({
        type: 'market.username.listing.created',
        data: {
          listingId: result?.listing?.id || null,
          username: result?.username?.username || null,
          priceMicro: result?.listing?.price_micro || null,
          createdAt: new Date().toISOString(),
        },
      });
    }

    res.status(201).json(result);
  }));

  router.get('/economy/usernames/listings', authenticateToken, asyncHandler(async (req, res) => {
    const listings = await usernameMarketService.listMarketListings({
      limit: req.query.limit,
      cursor: req.query.cursor,
      q: req.query.q,
      sort: req.query.sort,
      minPriceCoin: req.query.min_price_coin,
      maxPriceCoin: req.query.max_price_coin,
      onlyNew: req.query.only_new,
    });
    res.json({ listings });
  }));

  router.get('/economy/usernames/listings/:id', authenticateToken, asyncHandler(async (req, res) => {
    const listing = await usernameMarketService.getListingById({
      id: Number(req.params.id),
    });
    res.json({ listing });
  }));

  router.post('/economy/usernames/listings/:id/cancel', authenticateToken, asyncHandler(async (req, res) => {
    const result = await usernameMarketService.cancelListing({
      userId: req.user.userId,
      listingId: Number(req.params.id),
    });

    const broadcast = req.app.get('broadcast');
    if (typeof broadcast === 'function') {
      broadcast({
        type: 'market.username.listing.updated',
        data: {
          listingId: result?.listing?.id || null,
          status: 'CANCELLED',
          updatedAt: new Date().toISOString(),
        },
      });
    }

    res.json(result);
  }));

  router.post('/economy/usernames/listings/:id/buy', authenticateToken, createRateLimiter('market_buy_ip'), marketBuyLimiter, asyncHandler(async (req, res) => {
    const result = await usernameMarketService.buyListing({
      userId: req.user.userId,
      listingId: Number(req.params.id),
      idempotencyKey: req.body?.idempotency_key,
      clientRequestMs: req.body?.client_request_ms,
    });

    const broadcast = req.app.get('broadcast');
    const sendToUser = req.app.get('sendToUser');
    if (typeof broadcast === 'function') {
      broadcast({
        type: 'market.username.listing.sold',
        data: {
          listingId: result?.listingId || null,
          username: result?.username || null,
          buyerId: result?.buyerId || null,
          sellerId: result?.sellerId || null,
          priceMicro: result?.priceMicro || null,
          txHash: result?.tx?.tx_hash || null,
          soldAt: new Date().toISOString(),
          winnerBy: 'db_row_lock_first_commit',
          serverReceivedAtMs: Date.now(),
        },
      });
    }

    if (typeof sendToUser === 'function') {
      const payload = {
        type: 'economy:wallet_updated',
        data: {
          reason: 'username_market_buy',
          listingId: result?.listingId || null,
          txHash: result?.tx?.tx_hash || null,
          at: new Date().toISOString(),
        },
      };
      if (result?.buyerId) sendToUser(String(result.buyerId), payload);
      if (result?.sellerId) sendToUser(String(result.sellerId), payload);
    }

    res.status(result.idempotent ? 200 : 201).json(result);
  }));

  router.post('/economy/coin/purchase-orders', authenticateToken, asyncHandler(async (req, res) => {
    const order = await coinPurchaseService.createOrder({
      buyerId: req.user.userId,
      provider: req.body?.provider || 'card_manual',
      amountCoin: req.body?.amount_coin,
    });
    res.status(201).json({ order });
  }));

  router.get('/economy/coin/purchase-orders/:id', authenticateToken, asyncHandler(async (req, res) => {
    const order = await coinPurchaseService.getOrderForUser({
      orderId: Number(req.params.id),
      buyerId: req.user.userId,
    });
    res.json({ order });
  }));

  router.post('/economy/admin/coin/purchase-orders/:id/confirm', authenticateToken, asyncHandler(async (req, res) => {
    const result = await coinPurchaseService.confirmOrderPaidByAdmin({
      orderId: Number(req.params.id),
      adminUser: req.user,
      idempotencyKey: req.body?.idempotency_key,
      providerPaymentId: req.body?.provider_payment_id,
    });
    res.status(result.idempotent ? 200 : 201).json(result);
  }));

  router.post('/economy/coin/webhooks/:provider', asyncHandler(async (req, res) => {
    const signature = req.headers['x-provider-signature'];
    const ok = coinPurchaseService.verifyWebhookSignature({
      provider: req.params.provider,
      signature,
      payload: req.body,
      secret: process.env.ECONOMY_WEBHOOK_SECRET,
    });
    if (!ok) {
      return res.status(400).json({
        error: {
          code: 'PAYMENT_VERIFICATION_FAILED',
          message: 'Webhook signature verification failed',
          details: {},
        },
      });
    }

    return res.json({ accepted: true, mode: 'contract_only' });
  }));

  return router;
};

