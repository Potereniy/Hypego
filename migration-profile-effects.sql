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
  ADD CONSTRAINT users_avatar_frame_check CHECK (avatar_frame IN ('none', 'purple', 'neon', 'fire', 'electric', 'gold', 'red', 'blue', 'emerald', 'rgb', 'pulse', 'cosmic', 'anime_shadow_hood', 'anime_demon_king', 'anime_kitsune', 'anime_cyber_ronin', 'mlbb_abyss', 'mlbb_dragon', 'mlbb_celestial', 'mlbb_shadow_assassin', 'crysis_nanosuit', 'crysis_armor', 'crysis_cloak', 'metro_ranger', 'metro_tunnel', 'metro_nosalis', 'stalker_exoskeleton', 'stalker_zone', 'stalker_monolith', 'stalker_emission', 'minecraft_netherite', 'minecraft_warden', 'minecraft_ender', 'minecraft_wither', 'cs2_tactical', 'cs2_redline', 'cs2_smoke', 'cs2_ace'));
