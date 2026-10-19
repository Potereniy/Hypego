CREATE TABLE IF NOT EXISTS punishment_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  punishment_id UUID NOT NULL REFERENCES punishments(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video', 'link')),
  url TEXT NOT NULL,
  filename TEXT,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS punishment_evidence_punishment_id_idx
  ON punishment_evidence(punishment_id);
