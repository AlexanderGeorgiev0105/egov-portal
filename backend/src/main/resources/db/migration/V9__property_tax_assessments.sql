-- V9__property_tax_assessments.sql
-- Result entity after admin approves TAX_ASSESSMENT request

CREATE TABLE IF NOT EXISTS property_tax_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  property_id uuid NOT NULL,
  request_id uuid NOT NULL UNIQUE,

  -- Inputs (from frontend)
  neighborhood text NOT NULL,
  purpose text NOT NULL,
  purpose_other text NULL,
  has_adjoining_parts boolean NOT NULL DEFAULT false,

  -- Outputs / calculated numbers (can be filled by admin or calculated server-side)
  price numeric(12,2) NOT NULL DEFAULT 0,
  yearly_tax numeric(12,2) NOT NULL DEFAULT 0,
  trash_fee numeric(12,2) NOT NULL DEFAULT 0,

  approved_at timestamptz NOT NULL DEFAULT now(),
  approved_by_admin_id uuid NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_property_tax_assessments_property
    FOREIGN KEY (property_id)
    REFERENCES properties(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_property_tax_assessments_request
    FOREIGN KEY (request_id)
    REFERENCES property_requests(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_property_tax_assessments_admin
    FOREIGN KEY (approved_by_admin_id)
    REFERENCES admins(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_property_tax_assessments_non_negative CHECK (
    price >= 0 AND yearly_tax >= 0 AND trash_fee >= 0
  )
);

-- Typically a property has a single latest tax assessment (matches frontend expectations)
CREATE UNIQUE INDEX IF NOT EXISTS uq_property_tax_assessments_property
  ON property_tax_assessments(property_id);

CREATE INDEX IF NOT EXISTS idx_property_tax_assessments_created_at
  ON property_tax_assessments(created_at);
