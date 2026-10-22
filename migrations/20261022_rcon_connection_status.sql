BEGIN;

ALTER TABLE rcon_action_logs
  ADD COLUMN IF NOT EXISTS connection_status
  TEXT NOT NULL DEFAULT 'not_configured';

COMMIT;
