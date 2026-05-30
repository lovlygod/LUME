const crypto = require('crypto');
const db = require('../../db');

let preferencesSchemaEnsured = false;

const toBooleanLike = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
};

const toDisplayOrderLike = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeUsernameRow = (row) => ({
  ...row,
  is_primary: toBooleanLike(row?.is_primary, false),
  is_visible: toBooleanLike(row?.is_visible, true),
  display_order: toDisplayOrderLike(row?.display_order),
});

const ensureUsernamePreferencesSchema = async () => {
  if (preferencesSchemaEnsured) return;
  await db.query(`ALTER TABLE usernames ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE`);
  await db.query(`ALTER TABLE usernames ADD COLUMN IF NOT EXISTS display_order INTEGER NULL`);
  await db.query(`UPDATE usernames SET is_visible = TRUE WHERE is_visible IS NULL`);
  preferencesSchemaEnsured = true;
};

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

const ensureLegacyPrimaryUsername = async (client, userId) => {
  const { rows: existingRows } = await client.query(
    'SELECT id FROM usernames WHERE owner_id = $1 ORDER BY created_at ASC LIMIT 1',
    [userId],
  );
  if (existingRows[0]) return;

  const { rows: userRows } = await client.query(
    'SELECT username FROM users WHERE id = $1 LIMIT 1',
    [userId],
  );
  const legacyUsername = String(userRows[0]?.username || '').trim();
  if (!legacyUsername) return;

  const normalized = legacyUsername.toLowerCase();
  const { rows: insertedRows } = await client.query(
    `INSERT INTO usernames (username, normalized_username, owner_id, is_primary, is_market_acquired, created_at, updated_at)
     VALUES ($1, $2, $3, TRUE, FALSE, NOW(), NOW())
     ON CONFLICT (normalized_username) DO NOTHING
     RETURNING id`,
    [legacyUsername, normalized, userId],
  );

  if (insertedRows[0]?.id) {
    await client.query('UPDATE users SET main_username_id = $1 WHERE id = $2', [insertedRows[0].id, userId]);
  }
};

const getUsernamesCount = async (client, userId) => {
  const { rows } = await client.query('SELECT COUNT(*)::int AS c FROM usernames WHERE owner_id = $1', [userId]);
  return Number(rows[0]?.c || 0);
};

const syncUserVisibleUsername = async (client, userId) => {
  const { rows } = await client.query(
    `SELECT u.id, u.username
     FROM usernames u
     LEFT JOIN username_market_listings l
       ON l.username_id = u.id
      AND l.status = 'ACTIVE'
      AND l.expires_at > NOW()
     WHERE u.owner_id = $1
       AND l.id IS NULL
     ORDER BY u.is_primary DESC, u.created_at ASC
     LIMIT 1`,
    [userId],
  );

  const visible = rows[0] || null;
  if (!visible) {
    await client.query('UPDATE users SET main_username_id = NULL, username = NULL WHERE id = $1', [userId]);
    return;
  }

  await client.query('UPDATE usernames SET is_primary = FALSE WHERE owner_id = $1', [userId]);
  await client.query('UPDATE usernames SET is_primary = TRUE WHERE id = $1', [visible.id]);
  await client.query('UPDATE users SET main_username_id = $1, username = $2 WHERE id = $3', [visible.id, visible.username, userId]);
};

const getMyUsernames = async (userId) => {
  return withTransaction(async (client) => {
    await ensureUsernamePreferencesSchema();
    await ensureLegacyPrimaryUsername(client, userId);
    const { rows } = await client.query(
      `SELECT id, username, normalized_username, is_primary, is_market_acquired, market_acquired_at, market_purchase_price_micro, market_purchase_tx_id,
              is_visible, display_order
       FROM usernames
       WHERE owner_id = $1
       ORDER BY
         CASE WHEN display_order BETWEEN 1 AND 10 THEN 0 ELSE 1 END ASC,
         CASE WHEN display_order BETWEEN 1 AND 10 THEN display_order ELSE NULL END ASC,
         created_at ASC`,
      [userId],
    );
    console.log('[usernameMarketRepository.getMyUsernames] userId=%s sqlRows=%o', String(userId), rows);
    return rows.map(normalizeUsernameRow);
  });
};

const setUsernameVisibility = async ({ userId, usernameId, isVisible }) => {
  return withTransaction(async (client) => {
    await ensureUsernamePreferencesSchema();
    const { rows } = await client.query(
      'SELECT id FROM usernames WHERE id = $1 AND owner_id = $2 LIMIT 1 FOR UPDATE',
      [usernameId, userId],
    );
    if (!rows[0]) return { error: 'USERNAME_NOT_FOUND' };

    const { rows: primaryRows } = await client.query(
      'SELECT is_primary FROM usernames WHERE id = $1 LIMIT 1',
      [usernameId],
    );
    if (primaryRows[0]?.is_primary && !isVisible) return { error: 'PRIMARY_USERNAME_MUST_BE_VISIBLE' };

    const visible = toBooleanLike(isVisible, false);
    const { rows: updatedRows } = await client.query(
      `UPDATE usernames
       SET is_visible = $1,
           display_order = CASE WHEN $1 = FALSE THEN NULL ELSE display_order END,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, normalized_username, is_primary, is_market_acquired, market_acquired_at, market_purchase_price_micro, market_purchase_tx_id,
                 is_visible, display_order`,
      [visible, usernameId],
    );

    return { username: normalizeUsernameRow(updatedRows[0]) };
  });
};

const setUsernameDisplayOrder = async ({ userId, usernameId, displayOrder }) => {
  return withTransaction(async (client) => {
    await ensureUsernamePreferencesSchema();
    const desired = Number(displayOrder);
    if (!Number.isInteger(desired) || desired < 1 || desired > 10) return { error: 'INVALID_DISPLAY_ORDER' };

    const { rows: targetRows } = await client.query(
      `SELECT id, is_visible
       FROM usernames
       WHERE id = $1 AND owner_id = $2
       LIMIT 1
       FOR UPDATE`,
      [usernameId, userId],
    );
    const target = targetRows[0];
    if (!target) return { error: 'USERNAME_NOT_FOUND' };
    if (!target.is_visible) return { error: 'USERNAME_NOT_VISIBLE' };

    const { rows: ownerRows } = await client.query(
      `SELECT id, display_order
       FROM usernames
       WHERE owner_id = $1
         AND is_visible = TRUE
         AND display_order BETWEEN 1 AND 10
       ORDER BY display_order ASC
       FOR UPDATE`,
      [userId],
    );

    if (!ownerRows.some((r) => Number(r.id) === Number(usernameId)) && ownerRows.length >= 10) {
      return { error: 'PIN_LIMIT_REACHED' };
    }

    const occupied = ownerRows.find((r) => Number(r.display_order) === desired && Number(r.id) !== Number(usernameId));
    if (occupied) {
      await client.query(
        `UPDATE usernames
         SET display_order = CASE WHEN id = (SELECT main_username_id FROM users WHERE id = $2) THEN 1 ELSE NULL END,
             updated_at = NOW()
         WHERE id = $1`,
        [occupied.id, userId],
      );
    }

    const { rows: updatedRows } = await client.query(
      `UPDATE usernames
       SET display_order = $1,
           is_visible = TRUE,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, normalized_username, is_primary, is_market_acquired, market_acquired_at, market_purchase_price_micro, market_purchase_tx_id,
                 is_visible, display_order`,
      [desired, usernameId],
    );
    return { username: normalizeUsernameRow(updatedRows[0]) };
  });
};

const clearUsernameDisplayOrder = async ({ userId, usernameId }) => {
  return withTransaction(async (client) => {
    await ensureUsernamePreferencesSchema();
    const { rows } = await client.query(
      `UPDATE usernames
       SET display_order = NULL,
           updated_at = NOW()
       WHERE id = $1 AND owner_id = $2
       RETURNING id, username, normalized_username, is_primary, is_market_acquired, market_acquired_at, market_purchase_price_micro, market_purchase_tx_id,
                 is_visible, display_order`,
      [usernameId, userId],
    );
    if (!rows[0]) return { error: 'USERNAME_NOT_FOUND' };
    return { username: normalizeUsernameRow(rows[0]) };
  });
};

const listActiveListings = async ({
  limit = 50,
  cursor,
  q,
  sort = 'new',
  minPriceMicro,
  maxPriceMicro,
  onlyNew = false,
}) => {
  const where = ["l.status = 'ACTIVE'", 'l.expires_at > NOW()'];
  const params = [];

  if (cursor) {
    params.push(cursor);
    where.push(`l.id < $${params.length}`);
  }

  if (q && String(q).trim()) {
    params.push(`%${String(q).trim().toLowerCase()}%`);
    where.push(`u.normalized_username LIKE $${params.length}`);
  }

  if (typeof minPriceMicro === 'bigint' && minPriceMicro > 0n) {
    params.push(minPriceMicro.toString());
    where.push(`l.price_micro >= $${params.length}`);
  }

  if (typeof maxPriceMicro === 'bigint' && maxPriceMicro > 0n) {
    params.push(maxPriceMicro.toString());
    where.push(`l.price_micro <= $${params.length}`);
  }

  if (onlyNew) {
    where.push("l.created_at >= NOW() - INTERVAL '24 hours'");
  }

  let orderBy = 'l.created_at DESC, l.id DESC';
  if (sort === 'price_asc') orderBy = 'l.price_micro ASC, l.id DESC';
  else if (sort === 'price_desc') orderBy = 'l.price_micro DESC, l.id DESC';
  else if (sort === 'expiring') orderBy = 'l.expires_at ASC, l.id DESC';

  params.push(limit);
  const { rows } = await db.query(
    `SELECT l.*, u.username, u.normalized_username, seller.username AS seller_username
     FROM username_market_listings l
     JOIN usernames u ON u.id = l.username_id
     JOIN users seller ON seller.id = l.seller_id
     WHERE ${where.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT $${params.length}`,
    params,
  );
  return rows;
};

const getListingById = async (id) => {
  const { rows } = await db.query(
    `SELECT l.*, u.username, u.normalized_username
     FROM username_market_listings l
     JOIN usernames u ON u.id = l.username_id
     WHERE l.id = $1
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

const createListing = async ({ sellerId, usernameId, priceMicro, ttlDays }) => {
  return withTransaction(async (client) => {
    await ensureLegacyPrimaryUsername(client, sellerId);

    const { rows: usernameRows } = await client.query(
      'SELECT * FROM usernames WHERE id = $1 FOR UPDATE',
      [usernameId],
    );
    const username = usernameRows[0];
    if (!username) return { error: 'USERNAME_NOT_FOUND' };
    if (Number(username.owner_id) !== Number(sellerId)) return { error: 'USERNAME_NOT_OWNED' };

    const { rows: activeRows } = await client.query(
      `SELECT id FROM username_market_listings
       WHERE username_id = $1 AND status = 'ACTIVE'
       LIMIT 1 FOR UPDATE`,
      [usernameId],
    );
    if (activeRows[0]) return { error: 'USERNAME_ALREADY_LISTED' };

    const { rows } = await client.query(
      `INSERT INTO username_market_listings
       (username_id, seller_id, price_micro, status, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'ACTIVE', NOW() + ($4::text || ' days')::interval, NOW(), NOW())
       RETURNING *`,
      [usernameId, sellerId, priceMicro.toString(), String(ttlDays || 90)],
    );

    await syncUserVisibleUsername(client, sellerId);

    return { listing: rows[0], username };
  });
};

const cancelListing = async ({ sellerId, listingId }) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      'SELECT * FROM username_market_listings WHERE id = $1 FOR UPDATE',
      [listingId],
    );
    const listing = rows[0];
    if (!listing) return { error: 'LISTING_NOT_FOUND' };
    if (Number(listing.seller_id) !== Number(sellerId)) return { error: 'FORBIDDEN' };
    if (listing.status !== 'ACTIVE') return { error: 'LISTING_NOT_ACTIVE' };

    const { rows: updated } = await client.query(
      `UPDATE username_market_listings
       SET status = 'CANCELLED', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [listingId],
    );

    await syncUserVisibleUsername(client, sellerId);

    return { listing: updated[0] };
  });
};

const buyListing = async ({ buyerId, listingId, idempotencyKey }) => {
  return withTransaction(async (client) => {
    const { rows: existingTxRows } = await client.query(
      `SELECT * FROM ledger_transactions
       WHERE idempotency_key = $1
         AND created_by_user_id = $2
         AND type = 'USERNAME_PURCHASE'
       ORDER BY id DESC
       LIMIT 1`,
      [idempotencyKey, buyerId],
    );
    if (existingTxRows[0]) return { idempotent: true, tx: existingTxRows[0] };

    const { rows: listingRows } = await client.query(
      'SELECT * FROM username_market_listings WHERE id = $1 FOR UPDATE',
      [listingId],
    );
    const listing = listingRows[0];
    if (!listing) return { error: 'LISTING_NOT_FOUND' };
    if (listing.status !== 'ACTIVE') return { error: 'LISTING_NOT_ACTIVE' };
    if (new Date(listing.expires_at).getTime() <= Date.now()) return { error: 'LISTING_EXPIRED' };

    const { rows: usernameRows } = await client.query(
      'SELECT * FROM usernames WHERE id = $1 FOR UPDATE',
      [listing.username_id],
    );
    const username = usernameRows[0];
    if (!username) return { error: 'USERNAME_NOT_FOUND' };
    if (Number(username.owner_id) !== Number(listing.seller_id)) return { error: 'USERNAME_NOT_OWNED' };

    const buyerNamesCount = await getUsernamesCount(client, buyerId);
    if (buyerNamesCount >= 1000) return { error: 'USERNAME_LIMIT_REACHED' };

    const [walletA, walletB] = [Number(buyerId), Number(listing.seller_id)].sort((a, b) => a - b);
    const { rows: walletsRows } = await client.query(
      `SELECT *
       FROM wallets
       WHERE user_id IN ($1, $2)
       ORDER BY id ASC
       FOR UPDATE`,
      [walletA, walletB],
    );
    const buyerWallet = walletsRows.find((w) => Number(w.user_id) === Number(buyerId));
    const sellerWallet = walletsRows.find((w) => Number(w.user_id) === Number(listing.seller_id));
    if (!buyerWallet || !sellerWallet) return { error: 'WALLET_NOT_FOUND' };

    const { rows: reserveRows } = await client.query(
      `SELECT * FROM wallets WHERE system_code = 'DEVELOPER_RESERVE' FOR UPDATE`,
    );
    const reserveWallet = reserveRows[0];
    if (!reserveWallet) return { error: 'SYSTEM_WALLET_NOT_FOUND' };

    const price = BigInt(listing.price_micro);
    const sellerGet = (price * 80n) / 100n;
    const reserveFee = price - sellerGet;

    if (BigInt(buyerWallet.balance_micro) < price) return { error: 'INSUFFICIENT_BALANCE' };

    const txHash = createTxHash();
    const { rows: txRows } = await client.query(
      `INSERT INTO ledger_transactions
      (tx_hash, type, status, from_wallet_id, to_wallet_id, amount_micro, fee_micro, burn_micro, currency_code, idempotency_key, metadata_json, created_by_user_id, created_at, completed_at)
      VALUES ($1, 'USERNAME_PURCHASE', 'COMPLETED', $2, $3, $4, $5, 0, 'LUX', $6, $7::jsonb, $8, NOW(), NOW())
      RETURNING *`,
      [txHash, buyerWallet.id, sellerWallet.id, price.toString(), reserveFee.toString(), idempotencyKey, JSON.stringify({ listingId }), buyerId],
    );
    const tx = txRows[0];

    await client.query('UPDATE wallets SET balance_micro = balance_micro - $1, updated_at = NOW() WHERE id = $2', [price.toString(), buyerWallet.id]);
    await client.query('UPDATE wallets SET balance_micro = balance_micro + $1, updated_at = NOW() WHERE id = $2', [sellerGet.toString(), sellerWallet.id]);
    await client.query('UPDATE wallets SET balance_micro = balance_micro + $1, updated_at = NOW() WHERE id = $2', [reserveFee.toString(), reserveWallet.id]);

    await client.query('INSERT INTO ledger_entries (transaction_id, wallet_id, direction, amount_micro) VALUES ($1, $2, $3, $4)', [tx.id, buyerWallet.id, 'DEBIT', price.toString()]);
    await client.query('INSERT INTO ledger_entries (transaction_id, wallet_id, direction, amount_micro) VALUES ($1, $2, $3, $4)', [tx.id, sellerWallet.id, 'CREDIT', sellerGet.toString()]);
    await client.query('INSERT INTO ledger_entries (transaction_id, wallet_id, direction, amount_micro) VALUES ($1, $2, $3, $4)', [tx.id, reserveWallet.id, 'CREDIT', reserveFee.toString()]);

    await client.query(
      `UPDATE usernames
       SET owner_id = $1,
           is_primary = FALSE,
           is_market_acquired = TRUE,
           market_acquired_at = NOW(),
           market_purchase_price_micro = $2,
           market_purchase_tx_id = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [buyerId, price.toString(), tx.id, username.id],
    );

    await client.query(
      `UPDATE username_market_listings
       SET status = 'SOLD', buyer_id = $1, sale_tx_id = $2, sold_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [buyerId, tx.id, listing.id],
    );

    await syncUserVisibleUsername(client, listing.seller_id);
    await syncUserVisibleUsername(client, buyerId);

    return { tx, listingId: listing.id, username: username.username, priceMicro: price.toString(), sellerId: listing.seller_id, buyerId };
  });
};

module.exports = {
  getMyUsernames,
  setUsernameVisibility,
  setUsernameDisplayOrder,
  clearUsernameDisplayOrder,
  listActiveListings,
  getListingById,
  createListing,
  cancelListing,
  buyListing,
};

