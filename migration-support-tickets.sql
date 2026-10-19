ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

ALTER TABLE tickets
  DROP CONSTRAINT IF EXISTS tickets_category_check;

ALTER TABLE tickets
  ADD CONSTRAINT tickets_category_check
  CHECK (category IN (
    'account',
    'payments',
    'privileges',
    'server',
    'player_complaint',
    'staff_complaint',
    'other'
  ));

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body VARCHAR(4000) NOT NULL CHECK (length(trim(body)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ticket_messages_thread_idx
  ON ticket_messages(ticket_id, created_at ASC);

CREATE INDEX IF NOT EXISTS tickets_status_updated_idx
  ON tickets(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS tickets_assigned_idx
  ON tickets(assigned_to, status, updated_at DESC);

DELETE FROM role_permissions
WHERE permission_id = 'tickets.manage'
  AND role_id IN ('moderator', 'trainee');
