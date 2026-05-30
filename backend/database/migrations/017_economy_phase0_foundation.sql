-- Phase 0: Economy foundation (LUX)
-- Spec source: LUX-coin.md (priority section 29)

BEGIN;

-- 1) wallets
CREATE TABLE IF NOT EXISTS wallets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NULL REFERENCES users(id) ON DELETE CASCADE,
  system_code TEXT NULL CHECK (system_code IN ('TREASURY', 'DEVELOPER_RESERVE', 'BURN_WALLET', 'PAYMENT_CLEARING')),
  address TEXT,
  balance_micro BIGINT NOT NULL DEFAULT 0 CHECK (balance_micro >= 0),
  locked_balance_micro BIGINT NOT NULL DEFAULT 0 CHECK (locked_balance_micro >= 0),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((user_id IS NOT NULL) <> (system_code IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS wallets_user_id_unique ON wallets(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS wallets_system_code_unique ON wallets(system_code) WHERE system_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS wallets_address_unique ON wallets(address) WHERE address IS NOT NULL;

-- 2) ledger core
CREATE TABLE IF NOT EXISTS ledger_transactions (
  id BIGSERIAL PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
  from_wallet_id BIGINT REFERENCES wallets(id),
  to_wallet_id BIGINT REFERENCES wallets(id),
  amount_micro BIGINT NOT NULL CHECK (amount_micro > 0),
  fee_micro BIGINT NOT NULL DEFAULT 0 CHECK (fee_micro >= 0),
  burn_micro BIGINT NOT NULL DEFAULT 0 CHECK (burn_micro >= 0),
  currency_code TEXT NOT NULL DEFAULT 'LUX',
  idempotency_key TEXT NULL,
  external_provider TEXT NULL,
  external_tx_id TEXT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ledger_transactions_created_at_desc ON ledger_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_type_created_at_desc ON ledger_transactions(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_from_wallet_created_at_desc ON ledger_transactions(from_wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_to_wallet_created_at_desc ON ledger_transactions(to_wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_idempotency_key_not_null ON ledger_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
  wallet_id BIGINT NOT NULL REFERENCES wallets(id),
  direction TEXT NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
  amount_micro BIGINT NOT NULL CHECK (amount_micro > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_wallet_id_created_at_desc ON ledger_entries(wallet_id, created_at DESC);

-- 3) supply state
CREATE TABLE IF NOT EXISTS coin_supply_state (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  total_supply_micro BIGINT NOT NULL CHECK (total_supply_micro >= 0),
  circulating_supply_micro BIGINT NOT NULL CHECK (circulating_supply_micro >= 0),
  burned_supply_micro BIGINT NOT NULL DEFAULT 0 CHECK (burned_supply_micro >= 0),
  sold_supply_micro BIGINT NOT NULL DEFAULT 0 CHECK (sold_supply_micro >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (id = 1),
  CHECK (burned_supply_micro + circulating_supply_micro <= total_supply_micro),
  CHECK (sold_supply_micro <= circulating_supply_micro)
);

-- 4) usernames subsystem
CREATE TABLE IF NOT EXISTS usernames (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  normalized_username TEXT NOT NULL,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_market_acquired BOOLEAN NOT NULL DEFAULT FALSE,
  market_acquired_at TIMESTAMPTZ,
  market_purchase_price_micro BIGINT,
  market_purchase_tx_id BIGINT REFERENCES ledger_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(normalized_username),
  CHECK (normalized_username = lower(normalized_username))
);

CREATE INDEX IF NOT EXISTS idx_usernames_owner_id_created_at_desc ON usernames(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usernames_normalized_username ON usernames(normalized_username);

CREATE TABLE IF NOT EXISTS user_username_slots (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_count INT NOT NULL DEFAULT 0 CHECK (total_count >= 0 AND total_count <= 1000),
  visible_count_limit INT NOT NULL DEFAULT 10 CHECK (visible_count_limit > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS main_username_id BIGINT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'users'
      AND constraint_name = 'users_main_username_id_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_main_username_id_fkey
      FOREIGN KEY (main_username_id)
      REFERENCES usernames(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 5) username marketplace
CREATE TABLE IF NOT EXISTS username_market_listings (
  id BIGSERIAL PRIMARY KEY,
  username_id BIGINT NOT NULL REFERENCES usernames(id) ON DELETE CASCADE,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price_micro BIGINT NOT NULL CHECK (price_micro > 0),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'SOLD', 'CANCELLED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sold_at TIMESTAMPTZ,
  buyer_id BIGINT REFERENCES users(id),
  sale_tx_id BIGINT REFERENCES ledger_transactions(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_username_market_active_listing
  ON username_market_listings(username_id)
  WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_username_market_listings_status_expires ON username_market_listings(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_username_market_listings_seller_status_created_desc ON username_market_listings(seller_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_username_market_listings_price_created_desc ON username_market_listings(price_micro, created_at DESC);

CREATE TABLE IF NOT EXISTS username_market_bids (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES username_market_listings(id) ON DELETE CASCADE,
  bidder_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_micro BIGINT NOT NULL CHECK (amount_micro > 0),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'OUTBID', 'WON', 'CANCELLED', 'REFUNDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6) coin purchase
CREATE TABLE IF NOT EXISTS coin_purchase_orders (
  id BIGSERIAL PRIMARY KEY,
  buyer_id BIGINT NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,
  provider_order_id TEXT NOT NULL,
  provider_payment_id TEXT,
  requested_coins_micro BIGINT NOT NULL CHECK (requested_coins_micro > 0),
  paid_fiat_minor BIGINT NOT NULL CHECK (paid_fiat_minor >= 0),
  fiat_currency TEXT NOT NULL DEFAULT 'RUB',
  rate_snapshot_numerator INT NOT NULL,
  rate_snapshot_denominator INT NOT NULL CHECK (rate_snapshot_denominator > 0),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  credited_tx_id BIGINT REFERENCES ledger_transactions(id),
  UNIQUE(provider, provider_order_id)
);

CREATE INDEX IF NOT EXISTS idx_coin_purchase_orders_buyer_created_desc ON coin_purchase_orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_purchase_orders_status_created_desc ON coin_purchase_orders(status, created_at DESC);

-- 7) settings and audit
CREATE TABLE IF NOT EXISTS settings_economy (
  key TEXT PRIMARY KEY,
  value_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_economy_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_user_id BIGINT REFERENCES users(id),
  target_type TEXT,
  target_id BIGINT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_economy_events_created_at_desc ON audit_economy_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_economy_events_actor_created_desc ON audit_economy_events(actor_user_id, created_at DESC);

-- 8) Explorer public view (privacy-safe)
CREATE OR REPLACE VIEW explorer_public_transactions AS
SELECT
  tx_hash,
  type,
  amount_micro,
  status,
  fee_micro,
  burn_micro,
  created_at,
  completed_at
FROM ledger_transactions;

-- 9) Bootstrap settings (section 29 priority)
INSERT INTO settings_economy (key, value_json)
VALUES
  ('economy_enabled', 'true'::jsonb),
  ('coin_purchase_enabled', 'true'::jsonb),
  ('username_market_enabled', 'true'::jsonb),
  ('explorer_public_enabled', 'true'::jsonb),
  ('transfer_fee_bps', '50'::jsonb),
  ('transfer_fee_split', '{"reserve_bps":30,"burn_bps":20}'::jsonb),
  ('username_sale_fee_bps', '2000'::jsonb),
  ('listing_ttl_days', '90'::jsonb),
  ('max_usernames_per_user', '1000'::jsonb),
  ('max_visible_usernames', '10'::jsonb),
  ('coin_code', '"LUX"'::jsonb),
  ('coin_scale', '1000'::jsonb),
  ('rub_per_coin_num', '23'::jsonb),
  ('rub_per_coin_den', '10'::jsonb),
  ('transfer_daily_limit_coin', '100000'::jsonb),
  ('transfer_min_micro', '1'::jsonb),
  ('manual_confirm_admin_username', '"zxclovly"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 10) System wallets + supply state
INSERT INTO wallets (system_code, balance_micro, locked_balance_micro, status)
VALUES
  ('TREASURY', 333000000000, 0, 'ACTIVE'),
  ('DEVELOPER_RESERVE', 0, 0, 'ACTIVE'),
  ('BURN_WALLET', 0, 0, 'ACTIVE'),
  ('PAYMENT_CLEARING', 0, 0, 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO coin_supply_state (id, total_supply_micro, circulating_supply_micro, burned_supply_micro, sold_supply_micro)
VALUES (1, 333000000000, 333000000000, 0, 0)
ON CONFLICT (id) DO NOTHING;

COMMIT;
