-- V11__property_debts.sql
-- Optional but recommended: persist "debts" for a property (frontend shows annual tax + trash fee with paid status)

CREATE TABLE IF NOT EXISTS property_debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  property_id uuid NOT NULL,
  year integer NOT NULL,

  due_date date NOT NULL,

  yearly_tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  yearly_tax_is_paid boolean NOT NULL DEFAULT false,
  yearly_tax_paid_at timestamptz NULL,

  trash_fee_amount numeric(12,2) NOT NULL DEFAULT 0,
  trash_fee_is_paid boolean NOT NULL DEFAULT false,
  trash_fee_paid_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_property_debts_property
    FOREIGN KEY (property_id)
    REFERENCES properties(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_property_debts_property_year UNIQUE (property_id, year),

  CONSTRAINT chk_property_debts_year_reasonable CHECK (
    year BETWEEN 1900 AND (EXTRACT(YEAR FROM now())::int + 10)
  ),
  CONSTRAINT chk_property_debts_amounts_non_negative CHECK (
    yearly_tax_amount >= 0 AND trash_fee_amount >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_property_debts_property_id ON property_debts(property_id);
CREATE INDEX IF NOT EXISTS idx_property_debts_year ON property_debts(year);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_property_debts_set_updated_at ON property_debts;

CREATE TRIGGER trg_property_debts_set_updated_at
BEFORE UPDATE ON property_debts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
