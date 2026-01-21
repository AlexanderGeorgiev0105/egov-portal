-- V7__properties.sql
-- Properties module: approved/active properties for a user

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_user_id uuid NOT NULL,

  -- From frontend: AddPropertyRequestPage.jsx
  type text NOT NULL,
  oblast text NOT NULL,
  place text NOT NULL,
  address text NOT NULL,

  area_sqm integer NOT NULL,
  purchase_year integer NOT NULL,

  -- Soft delete (when REMOVE_PROPERTY request is approved)
  is_active boolean NOT NULL DEFAULT true,
  deactivated_at timestamptz NULL,

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_properties_owner_user
    FOREIGN KEY (owner_user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_properties_area_positive CHECK (area_sqm > 0),
  CONSTRAINT chk_properties_purchase_year_reasonable CHECK (
    purchase_year BETWEEN 1900 AND (EXTRACT(YEAR FROM now())::int + 1)
  )
);

CREATE INDEX IF NOT EXISTS idx_properties_owner_user_id ON properties(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_properties_set_updated_at ON properties;

CREATE TRIGGER trg_properties_set_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
