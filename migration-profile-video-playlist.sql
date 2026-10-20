ALTER TABLE profile_video_settings
ADD COLUMN IF NOT EXISTS video_ids TEXT[] NOT NULL DEFAULT '{}';
