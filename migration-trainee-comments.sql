CREATE TABLE IF NOT EXISTS trainee_application_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL
    REFERENCES trainee_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL
    CHECK (length(trim(message)) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trainee_application_messages_order_idx
  ON trainee_application_messages(application_id, created_at, id);
