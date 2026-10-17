BEGIN;

-- Отдельные балансы. Старые значения сохраняются.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS donation_balance_rub_kopecks BIGINT
    NOT NULL DEFAULT 0 CHECK (donation_balance_rub_kopecks >= 0),
  ADD COLUMN IF NOT EXISTS hp_balance BIGINT
    NOT NULL DEFAULT 0 CHECK (hp_balance >= 0);

-- Отдельные цены для двух магазинов.
-- NULL означает, что цену ещё нужно установить.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_rub_kopecks BIGINT
    CHECK (price_rub_kopecks IS NULL OR price_rub_kopecks >= 0),
  ADD COLUMN IF NOT EXISTS price_hp BIGINT
    CHECK (price_hp IS NULL OR price_hp >= 0);

-- История операций с донатным балансом.
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  actor_id UUID REFERENCES users(id),
  amount_rub_kopecks BIGINT NOT NULL CHECK (amount_rub_kopecks <> 0),
  balance_after_rub_kopecks BIGINT NOT NULL
    CHECK (balance_after_rub_kopecks >= 0),
  kind TEXT NOT NULL CHECK (
    kind IN ('purchase', 'payment_credit', 'refund', 'adjustment')
  ),
  reference_id UUID,
  reason TEXT NOT NULL DEFAULT '',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wallet_transactions_user_idx
  ON wallet_transactions(user_id, created_at DESC);

-- История операций с HP.
CREATE TABLE IF NOT EXISTS hp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  actor_id UUID REFERENCES users(id),
  amount_hp BIGINT NOT NULL CHECK (amount_hp <> 0),
  balance_after_hp BIGINT NOT NULL CHECK (balance_after_hp >= 0),
  kind TEXT NOT NULL CHECK (
    kind IN ('salary', 'purchase', 'adjustment', 'refund')
  ),
  reference_id UUID,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hp_transactions_user_idx
  ON hp_transactions(user_id, created_at DESC);

-- Снимки внешнего курса: один снимок хранит курс на момент получения.
CREATE TABLE IF NOT EXISTS fx_rate_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency VARCHAR(3) NOT NULL
    CHECK (base_currency IN ('KZT', 'RUB', 'EUR')),
  quote_currency VARCHAR(3) NOT NULL DEFAULT 'RUB'
    CHECK (quote_currency = 'RUB'),
  rate NUMERIC(24, 12) NOT NULL CHECK (rate > 0),
  source TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at > fetched_at)
);

CREATE INDEX IF NOT EXISTS fx_rate_snapshots_lookup_idx
  ON fx_rate_snapshots(base_currency, fetched_at DESC);

-- Будущие платёжные намерения. Сами платежи эта миграция не создаёт.
CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  source_currency VARCHAR(3) NOT NULL
    CHECK (source_currency IN ('KZT', 'RUB', 'EUR')),
  source_amount_minor BIGINT NOT NULL CHECK (source_amount_minor > 0),
  rub_amount_kopecks BIGINT NOT NULL CHECK (rub_amount_kopecks > 0),
  fx_snapshot_id UUID NOT NULL REFERENCES fx_rate_snapshots(id),
  fx_rate NUMERIC(24, 12) NOT NULL CHECK (fx_rate > 0),
  fx_source TEXT NOT NULL,
  fx_observed_at TIMESTAMPTZ NOT NULL,
  provider TEXT,
  provider_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'failed', 'cancelled', 'expired', 'refunded')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  UNIQUE (provider, provider_payment_id)
);

CREATE INDEX IF NOT EXISTS payment_intents_user_idx
  ON payment_intents(user_id, created_at DESC);

COMMIT;
