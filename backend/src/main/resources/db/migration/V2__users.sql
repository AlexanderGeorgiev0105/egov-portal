-- V2__users.sql
-- Users with approval flow (PENDING/ACTIVE) and strict checks based on Frontend validation

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE account_status AS ENUM ('PENDING', 'ACTIVE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Registration fields (from RegisterPage.jsx)
  full_name text NOT NULL,
  egn char(10) NOT NULL UNIQUE,
  gender varchar(20) NOT NULL,
  dob date NOT NULL,

  doc_number char(9) NOT NULL UNIQUE,
  doc_valid_until date NOT NULL,
  issued_at text NOT NULL,

  birth_place text NOT NULL,
  address text NOT NULL,

  phone varchar(10) NOT NULL UNIQUE,
  email varchar(254) NOT NULL UNIQUE,
  password_hash text NOT NULL,

  -- Approval flow
  account_status account_status NOT NULL DEFAULT 'PENDING',
  approved_at timestamptz NULL,
  approved_by_admin_id uuid NULL,

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints (match your Frontend rules)
  CONSTRAINT chk_users_egn_digits CHECK (egn ~ '^[0-9]{10}$'),
  CONSTRAINT chk_users_doc_number_digits CHECK (doc_number ~ '^[0-9]{9}$'),
  CONSTRAINT chk_users_phone_digits CHECK (phone ~ '^[0-9]{1,10}$'),

  CONSTRAINT fk_users_approved_by_admin
    FOREIGN KEY (approved_by_admin_id)
    REFERENCES admins(id)
    ON DELETE SET NULL
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
