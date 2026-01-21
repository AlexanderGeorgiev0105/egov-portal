-- V8__property_requests.sql
-- Unified requests table for Property module (admin approvals)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_request_kind') THEN
    CREATE TYPE property_request_kind AS ENUM (
      'ADD_PROPERTY',
      'REMOVE_PROPERTY',
      'TAX_ASSESSMENT',
      'SKETCH'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_request_status') THEN
    CREATE TYPE property_request_status AS ENUM (
      'PENDING',
      'APPROVED',
      'REJECTED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS property_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,
  property_id uuid NULL, -- NULL for ADD_PROPERTY, set for other kinds

  kind property_request_kind NOT NULL,
  status property_request_status NOT NULL DEFAULT 'PENDING',

  -- Request-specific data (varies per kind; mirrors frontend storages)
  payload jsonb NOT NULL,

  -- Admin workflow
  admin_note text NULL,
  decided_at timestamptz NULL,
  decided_by_admin_id uuid NULL,

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_property_requests_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_property_requests_property
    FOREIGN KEY (property_id)
    REFERENCES properties(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_property_requests_decided_by_admin
    FOREIGN KEY (decided_by_admin_id)
    REFERENCES admins(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_property_requests_status_kind
  ON property_requests(status, kind);

CREATE INDEX IF NOT EXISTS idx_property_requests_user_id
  ON property_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_property_requests_property_id
  ON property_requests(property_id);

CREATE INDEX IF NOT EXISTS idx_property_requests_created_at
  ON property_requests(created_at);

-- Prevent duplicates: only one PENDING request of a given type per property
CREATE UNIQUE INDEX IF NOT EXISTS uq_prop_req_pending_tax_per_property
  ON property_requests(property_id)
  WHERE status = 'PENDING' AND kind = 'TAX_ASSESSMENT' AND property_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_prop_req_pending_sketch_per_property
  ON property_requests(property_id)
  WHERE status = 'PENDING' AND kind = 'SKETCH' AND property_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_prop_req_pending_remove_per_property
  ON property_requests(property_id)
  WHERE status = 'PENDING' AND kind = 'REMOVE_PROPERTY' AND property_id IS NOT NULL;

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_property_requests_set_updated_at ON property_requests;

CREATE TRIGGER trg_property_requests_set_updated_at
BEFORE UPDATE ON property_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
