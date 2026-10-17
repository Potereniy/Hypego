CREATE TABLE IF NOT EXISTS trainee_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  minecraft_username VARCHAR(24) NOT NULL
    CHECK (minecraft_username ~ '^[A-Za-z0-9_]{3,24}$'),
  age SMALLINT NOT NULL CHECK (age BETWEEN 13 AND 100),
  experience TEXT NOT NULL CHECK (length(trim(experience)) BETWEEN 10 AND 2000),
  hours_per_day NUMERIC(4,1) NOT NULL CHECK (hours_per_day BETWEEN 0.5 AND 24),
  days_per_week SMALLINT NOT NULL CHECK (days_per_week BETWEEN 1 AND 7),
  motivation VARCHAR(2000) NOT NULL CHECK (length(trim(motivation)) BETWEEN 10 AND 2000),
  additional_info VARCHAR(2000),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  curator_comment VARCHAR(1000),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS trainee_applications_one_pending_per_user
  ON trainee_applications(user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS trainee_applications_created_at_idx
  ON trainee_applications(created_at DESC);
