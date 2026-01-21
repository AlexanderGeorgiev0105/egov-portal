-- V5__seed_admin.sql
-- Seed exactly ONE admin (admin / admin123).
-- IMPORTANT: Store only BCrypt hash, never plain password.

-- BCrypt hash for "admin123" (example)
-- If you want to generate your own:
-- in Spring: new BCryptPasswordEncoder().encode("admin123")
-- and replace the value below.

INSERT INTO admins (id, username, password_hash, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  '$2b$10$BW8tlzgFa33jQ5YbOdaIju.xrvWCQW5s3clXjnjDMeJSr6xYy/Yim',
  true
)
ON CONFLICT (username) DO NOTHING;
