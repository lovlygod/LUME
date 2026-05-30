const { ValidationError, NotFoundError, ForbiddenError } = require('../../errors');
const repo = require('../repositories/usernameMarketRepository');
const economyRepo = require('../repositories/economyRepository');

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

const validateUsernameHandle = (value) => {
  const raw = String(value || '').trim().replace(/^@+/, '');
  if (!raw) throw new ValidationError('username is required', { field: 'username' });
  if (raw.length < 3 || raw.length > 32) throw new ValidationError('INVALID_USERNAME', { code: 'INVALID_USERNAME' });
  if (!USERNAME_REGEX.test(raw)) throw new ValidationError('INVALID_USERNAME', { code: 'INVALID_USERNAME' });
  if (raw.includes('__')) throw new ValidationError('INVALID_USERNAME', { code: 'INVALID_USERNAME' });
  if (raw.endsWith('_')) throw new ValidationError('INVALID_USERNAME', { code: 'INVALID_USERNAME' });
  return raw;
};

const parsePriceCoinToMicro = (priceCoin) => {
  const raw = String(priceCoin ?? '').trim();
  if (!/^\d+(\.\d{1,3})?$/.test(raw)) {
    throw new ValidationError('Invalid price_coin format', { field: 'price_coin' });
  }
  const [whole, frac = ''] = raw.split('.');
  const micro = BigInt(whole) * 1000n + BigInt((frac + '000').slice(0, 3));
  if (micro <= 0n) throw new ValidationError('Price must be positive', { field: 'price_coin' });
  return micro;
};

const getMyUsernames = async (userId) => repo.getMyUsernames(userId);

const getUserUsernames = async (userId) => repo.getMyUsernames(userId);

const setMyUsernameVisibility = async ({ userId, usernameId, isVisible }) => {
  const result = await repo.setUsernameVisibility({ userId, usernameId, isVisible: !!isVisible });
  if (result?.error === 'USERNAME_NOT_FOUND') throw new NotFoundError('Username not found', 'USERNAME_NOT_FOUND');
  if (result?.error === 'PRIMARY_USERNAME_MUST_BE_VISIBLE') {
    throw new ValidationError('PRIMARY_USERNAME_MUST_BE_VISIBLE', { code: 'PRIMARY_USERNAME_MUST_BE_VISIBLE' });
  }
  return result;
};

const setMyUsernameDisplayOrder = async ({ userId, usernameId, displayOrder }) => {
  const result = await repo.setUsernameDisplayOrder({ userId, usernameId, displayOrder: Number(displayOrder) });
  if (result?.error === 'USERNAME_NOT_FOUND') throw new NotFoundError('Username not found', 'USERNAME_NOT_FOUND');
  if (result?.error === 'INVALID_DISPLAY_ORDER') throw new ValidationError('INVALID_DISPLAY_ORDER', { code: 'INVALID_DISPLAY_ORDER' });
  if (result?.error === 'PIN_LIMIT_REACHED') throw new ValidationError('PIN_LIMIT_REACHED', { code: 'PIN_LIMIT_REACHED' });
  if (result?.error === 'USERNAME_NOT_VISIBLE') throw new ValidationError('USERNAME_NOT_VISIBLE', { code: 'USERNAME_NOT_VISIBLE' });
  return result;
};

const clearMyUsernameDisplayOrder = async ({ userId, usernameId }) => {
  const result = await repo.clearUsernameDisplayOrder({ userId, usernameId });
  if (result?.error === 'USERNAME_NOT_FOUND') throw new NotFoundError('Username not found', 'USERNAME_NOT_FOUND');
  return result;
};

const listActiveListings = async ({ limit }) => {
  const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return repo.listActiveListings({ limit: parsedLimit });
};

const parseCoinToMicro = (value, field) => {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = String(value).trim();
  if (!/^\d+(\.\d{1,3})?$/.test(raw)) {
    throw new ValidationError(`Invalid ${field} format`, { field });
  }
  const [whole, frac = ''] = raw.split('.');
  return BigInt(whole) * 1000n + BigInt((frac + '000').slice(0, 3));
};

const listMarketListings = async ({ limit, cursor, q, sort, minPriceCoin, maxPriceCoin, onlyNew }) => {
  const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const parsedCursor = Number(cursor);
  const cursorValue = Number.isFinite(parsedCursor) && parsedCursor > 0 ? parsedCursor : undefined;
  const normalizedSort = ['new', 'price_asc', 'price_desc', 'expiring'].includes(String(sort || 'new'))
    ? String(sort)
    : 'new';

  const minPriceMicro = parseCoinToMicro(minPriceCoin, 'min_price_coin');
  const maxPriceMicro = parseCoinToMicro(maxPriceCoin, 'max_price_coin');
  if (typeof minPriceMicro === 'bigint' && typeof maxPriceMicro === 'bigint' && minPriceMicro > maxPriceMicro) {
    throw new ValidationError('min_price_coin must be less or equal max_price_coin', { code: 'INVALID_PRICE_RANGE' });
  }

  return repo.listActiveListings({
    limit: parsedLimit,
    cursor: cursorValue,
    q,
    sort: normalizedSort,
    minPriceMicro,
    maxPriceMicro,
    onlyNew: String(onlyNew || '').toLowerCase() === 'true',
  });
};

const getListingById = async ({ id }) => {
  const listing = await repo.getListingById(id);
  if (!listing) throw new NotFoundError('Listing not found', 'LISTING_NOT_FOUND');
  return listing;
};

const createListing = async ({ userId, usernameId, priceCoin }) => {
  const priceMicro = parsePriceCoinToMicro(priceCoin);
  const result = await repo.createListing({ sellerId: userId, usernameId, priceMicro, ttlDays: 90 });
  if (result?.error === 'USERNAME_NOT_FOUND') throw new NotFoundError('Username not found', 'USERNAME_NOT_FOUND');
  if (result?.error === 'USERNAME_NOT_OWNED') throw new ForbiddenError('USERNAME_NOT_OWNED', 'USERNAME_NOT_OWNED');
  if (result?.error === 'USERNAME_ALREADY_LISTED') throw new ValidationError('USERNAME_ALREADY_LISTED', { code: 'USERNAME_ALREADY_LISTED' });

  await economyRepo.createEconomyAuditEvent({
    eventType: 'market.username.listing.created',
    actorUserId: userId,
    targetType: 'username_listing',
    targetId: result.listing.id,
    payload: {
      usernameId,
      priceMicro: priceMicro.toString(),
    },
  });
  return result;
};

const cancelListing = async ({ userId, listingId }) => {
  const result = await repo.cancelListing({ sellerId: userId, listingId });
  if (result?.error === 'LISTING_NOT_FOUND') throw new NotFoundError('Listing not found', 'LISTING_NOT_FOUND');
  if (result?.error === 'FORBIDDEN') throw new ForbiddenError('FORBIDDEN', 'FORBIDDEN');
  if (result?.error === 'LISTING_NOT_ACTIVE') throw new ValidationError('LISTING_NOT_ACTIVE', { code: 'LISTING_NOT_ACTIVE' });

  await economyRepo.createEconomyAuditEvent({
    eventType: 'market.username.listing.cancelled',
    actorUserId: userId,
    targetType: 'username_listing',
    targetId: result.listing.id,
    payload: {},
  });
  return result;
};

const buyListing = async ({ userId, listingId, idempotencyKey }) => {
  if (!idempotencyKey || !String(idempotencyKey).trim()) {
    throw new ValidationError('idempotency_key is required', { field: 'idempotency_key' });
  }
  const result = await repo.buyListing({ buyerId: userId, listingId, idempotencyKey: String(idempotencyKey) });
  if (result?.error === 'LISTING_NOT_FOUND') throw new NotFoundError('Listing not found', 'LISTING_NOT_FOUND');
  if (result?.error === 'LISTING_NOT_ACTIVE') throw new ValidationError('LISTING_NOT_ACTIVE', { code: 'LISTING_NOT_ACTIVE' });
  if (result?.error === 'LISTING_EXPIRED') throw new ValidationError('LISTING_EXPIRED', { code: 'LISTING_EXPIRED' });
  if (result?.error === 'USERNAME_LIMIT_REACHED') throw new ValidationError('USERNAME_LIMIT_REACHED', { code: 'USERNAME_LIMIT_REACHED' });
  if (result?.error === 'INSUFFICIENT_BALANCE') throw new ValidationError('INSUFFICIENT_BALANCE', { code: 'INSUFFICIENT_BALANCE' });
  if (result?.error) throw new ValidationError(result.error, { code: result.error });

  await economyRepo.createEconomyAuditEvent({
    eventType: 'market.username.listing.sold',
    actorUserId: userId,
    targetType: 'username_listing',
    targetId: result.listingId,
    payload: {
      txHash: result.tx.tx_hash,
      username: result.username,
      priceMicro: result.priceMicro,
      sellerId: result.sellerId,
      buyerId: result.buyerId,
      idempotent: !!result.idempotent,
    },
  });
  return result;
};

module.exports = {
  validateUsernameHandle,
  getMyUsernames,
  getUserUsernames,
  setMyUsernameVisibility,
  setMyUsernameDisplayOrder,
  clearMyUsernameDisplayOrder,
  listActiveListings,
  listMarketListings,
  getListingById,
  createListing,
  cancelListing,
  buyListing,
};

