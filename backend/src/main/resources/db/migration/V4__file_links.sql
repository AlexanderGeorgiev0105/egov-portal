-- V4__file_links.sql
-- Polymorphic links: attach a file to any entity (users, requests later, etc.)

CREATE TABLE IF NOT EXISTS file_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  file_id uuid NOT NULL,
  entity_type varchar(40) NOT NULL,
  entity_id uuid NOT NULL,
  tag varchar(40) NULL, -- e.g. PHOTO_1 / PHOTO_2 for registration

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_file_links_file
    FOREIGN KEY (file_id)
    REFERENCES files(id)
    ON DELETE CASCADE
);

-- Prevent accidental duplicates (useful for "2 registration photos")
CREATE UNIQUE INDEX IF NOT EXISTS uq_file_links_entity_tag
  ON file_links(entity_type, entity_id, COALESCE(tag, ''));

CREATE INDEX IF NOT EXISTS idx_file_links_entity
  ON file_links(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_file_links_file_id
  ON file_links(file_id);
