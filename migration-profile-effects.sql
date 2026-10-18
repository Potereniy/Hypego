ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nickname_effect TEXT NOT NULL DEFAULT 'none';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_frame TEXT NOT NULL DEFAULT 'none';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_nickname_effect_check;

ALTER TABLE users
  ADD CONSTRAINT users_nickname_effect_check
  CHECK (nickname_effect IN ('none', 'gradient', 'neon', 'rgb'));

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_avatar_frame_check;

ALTER TABLE users
  ADD CONSTRAINT users_avatar_frame_check
  CHECK (avatar_frame IN ('none', 'purple', 'neon', 'fire', 'electric'));
