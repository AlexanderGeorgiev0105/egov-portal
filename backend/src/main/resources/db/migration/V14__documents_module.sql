-- V14__documents_module.sql
-- Documents module: approved documents + admin-reviewed document requests (ADD / REMOVE)
-- Uses existing files + file_links tables for the 2 photos per document/request.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
    CREATE TYPE document_type AS ENUM (
      'ID_CARD',
      'PASSPORT',
      'DRIVER_LICENSE'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_request_kind') THEN
    CREATE TYPE document_request_kind AS ENUM (
      'ADD_DOCUMENT',
      'REMOVE_DOCUMENT'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_request_status') THEN
    CREATE TYPE document_request_status AS ENUM (
      'PENDING',
      'APPROVED',
      'REJECTED'
    );
  END IF;
END $$;

-- -----------------------------
-- Approved documents
-- -----------------------------
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,

  type document_type NOT NULL,

  first_name  text NOT NULL,
  middle_name text NOT NULL,
  last_name   text NOT NULL,

  egn varchar(10) NOT NULL,
  gender varchar(20) NOT NULL,
  dob date NOT NULL,

  -- ✅ FIX: was char(9) -> Hibernate expects varchar(9)
  doc_number varchar(9) NOT NULL,

  valid_until date NOT NULL,
  issued_at text NOT NULL,

  birth_place text NOT NULL,
  address text NOT NULL,

  -- Only for DRIVER_LICENSE; store as JSON array for flexibility
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_documents_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_documents_egn_digits CHECK (egn ~ '^[0-9]{10}$'),
  CONSTRAINT chk_documents_doc_number_digits CHECK (doc_number ~ '^[0-9]{9}$'),
  CONSTRAINT chk_documents_categories_is_array CHECK (jsonb_typeof(categories) = 'array')
);

-- One approved document per type per user (matches Frontend rule)
CREATE UNIQUE INDEX IF NOT EXISTS uq_documents_user_type
  ON documents(user_id, type);

CREATE INDEX IF NOT EXISTS idx_documents_user_id
  ON documents(user_id);

CREATE INDEX IF NOT EXISTS idx_documents_egn
  ON documents(egn);

CREATE INDEX IF NOT EXISTS idx_documents_doc_number
  ON documents(doc_number);

DROP TRIGGER IF EXISTS trg_documents_set_updated_at ON documents;
CREATE TRIGGER trg_documents_set_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- -----------------------------
-- Document requests (admin reviewed)
-- -----------------------------
CREATE TABLE IF NOT EXISTS document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,

  kind document_request_kind NOT NULL,
  status document_request_status NOT NULL DEFAULT 'PENDING',

  -- Helper fields for filtering + enforcing "only one pending" rules
  document_type document_type NULL,  -- used for ADD_DOCUMENT
  document_id uuid NULL,             -- used for REMOVE_DOCUMENT (points to documents.id)

  -- Full request payload (ADD: document data; REMOVE: reason + snapshot)
  payload jsonb NOT NULL,

  admin_note text NULL,

  decided_at timestamptz NULL,
  decided_by_admin_id uuid NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_document_requests_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_document_requests_decided_by_admin
    FOREIGN KEY (decided_by_admin_id)
    REFERENCES admins(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_document_requests_document
    FOREIGN KEY (document_id)
    REFERENCES documents(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_document_requests_payload_is_object CHECK (jsonb_typeof(payload) = 'object'),

  -- Ensure kind matches helper fields
  CONSTRAINT chk_document_requests_kind_fields CHECK (
    (kind = 'ADD_DOCUMENT' AND document_type IS NOT NULL AND document_id IS NULL)
    OR
    (kind = 'REMOVE_DOCUMENT' AND document_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_document_requests_user_id
  ON document_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_document_requests_status_kind
  ON document_requests(status, kind);

CREATE INDEX IF NOT EXISTS idx_document_requests_created_at
  ON document_requests(created_at);

-- Enforce FE rule: only one pending ADD per user+type
CREATE UNIQUE INDEX IF NOT EXISTS uq_document_requests_pending_add_user_type
  ON document_requests(user_id, document_type)
  WHERE status = 'PENDING' AND kind = 'ADD_DOCUMENT';

-- Enforce FE rule: only one pending REMOVE per user+document
CREATE UNIQUE INDEX IF NOT EXISTS uq_document_requests_pending_remove_user_document
  ON document_requests(user_id, document_id)
  WHERE status = 'PENDING' AND kind = 'REMOVE_DOCUMENT' AND document_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_document_requests_set_updated_at ON document_requests;
CREATE TRIGGER trg_document_requests_set_updated_at
BEFORE UPDATE ON document_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
