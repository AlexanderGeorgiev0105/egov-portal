-- V10__property_sketches.sql
-- Result entity after admin approves SKETCH request (actual PDF is stored via files + file_links)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_sketch_doc_type') THEN
    CREATE TYPE property_sketch_doc_type AS ENUM ('SKICA', 'SCHEMA');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS property_sketches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  property_id uuid NOT NULL,
  request_id uuid NOT NULL UNIQUE,

  doc_type property_sketch_doc_type NOT NULL,
  term_days integer NOT NULL,

  approved_at timestamptz NOT NULL DEFAULT now(),
  approved_by_admin_id uuid NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_property_sketches_property
    FOREIGN KEY (property_id)
    REFERENCES properties(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_property_sketches_request
    FOREIGN KEY (request_id)
    REFERENCES property_requests(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_property_sketches_admin
    FOREIGN KEY (approved_by_admin_id)
    REFERENCES admins(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_property_sketches_term_days CHECK (term_days IN (3, 7))
);

-- Typically a property has a single latest sketch (matches frontend expectations)
CREATE UNIQUE INDEX IF NOT EXISTS uq_property_sketches_property
  ON property_sketches(property_id);

CREATE INDEX IF NOT EXISTS idx_property_sketches_created_at
  ON property_sketches(created_at);
