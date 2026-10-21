[1mdiff --git a/schema.sql b/schema.sql[m
[1mindex 070b13e..d688297 100644[m
[1m--- a/schema.sql[m
[1m+++ b/schema.sql[m
[36m@@ -3,7 +3,7 @@[m [mCREATE TABLE IF NOT EXISTS users ([m
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), username VARCHAR(24) NOT NULL UNIQUE, email VARCHAR(254) NOT NULL UNIQUE,[m
  password_hash TEXT NOT NULL, display_name VARCHAR(40), avatar_url TEXT, banner_url TEXT, vk_url TEXT, telegram_username VARCHAR(64),[m
  nickname_color VARCHAR(7) NOT NULL DEFAULT '#a78bfa' CHECK (nickname_color ~ '^#[0-9A-Fa-f]{6}$'),[m
[31m- bio VARCHAR(500) NOT NULL DEFAULT '', steam_id VARCHAR(80), birth_date DATE, balance_cents BIGINT NOT NULL DEFAULT 0 CHECK(balance_cents>=0),[m
[32m+[m[32m bio VARCHAR(500) NOT NULL DEFAULT '', birth_date DATE, balance_cents BIGINT NOT NULL DEFAULT 0 CHECK(balance_cents>=0),[m
  staff_salary BIGINT NOT NULL DEFAULT 0 CHECK(staff_salary>=0), is_banned BOOLEAN NOT NULL DEFAULT FALSE,[m
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()[m
 );[m
[36m@@ -24,6 +24,22 @@[m [mCREATE TABLE IF NOT EXISTS wall_posts (id UUID PRIMARY KEY DEFAULT gen_random_uu[m
 CREATE TABLE IF NOT EXISTS friendships (user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(user_id,friend_id), CHECK(user_id<>friend_id));[m
 CREATE TABLE IF NOT EXISTS unban_appeals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')), reviewed_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());[m
 CREATE TABLE IF NOT EXISTS audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_id UUID REFERENCES users(id), action TEXT NOT NULL, target_type TEXT, target_id TEXT, details JSONB NOT NULL DEFAULT '{}'::jsonb, ip_hash TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());[m
[32m+[m
[32m+[m[32mCREATE TABLE IF NOT EXISTS direct_messages ([m
[32m+[m[32m  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),[m
[32m+[m[32m  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,[m
[32m+[m[32m  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,[m
[32m+[m[32m  body VARCHAR(2000) NOT NULL CHECK (length(trim(body)) > 0),[m
[32m+[m[32m  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),[m
[32m+[m[32m  read_at TIMESTAMPTZ,[m
[32m+[m[32m  CHECK (sender_id <> recipient_id)[m
[32m+[m[32m);[m
[32m+[m[32mCREATE INDEX IF NOT EXISTS direct_messages_thread_idx[m
[32m+[m[32m  ON direct_messages(sender_id, recipient_id, created_at DESC);[m
[32m+[m[32mCREATE INDEX IF NOT EXISTS direct_messages_unread_idx[m
[32m+[m[32m  ON direct_messages(recipient_id, created_at DESC)[m
[32m+[m[32m  WHERE read_at IS NULL;[m
[32m+[m
 CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id,created_at DESC);[m
 CREATE INDEX IF NOT EXISTS privileges_user_idx ON privileges(user_id,status);[m
 CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);[m
