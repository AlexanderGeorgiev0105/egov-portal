-- V3__files.sql
-- File metadata table (actual bytes should be stored in filesystem/S3/MinIO; DB stores metadata + storage_key)

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_user_id uuid NULL,
  original_name text NOT NULL,
  mime_type varchar(100) NOT NULL,
  size_bytes bigint NOT NULL,
  storage_key text NOT NULL,
  sha256 varchar(64) NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_files_owner_user
    FOREIGN KEY (owner_user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_files_size_non_negative CHECK (size_bytes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_files_owner_user_id ON files(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
