-- V13__transport_module.sql
-- Transport module: vehicles, vehicle requests (admin approvals), vignettes, fines, vehicle tax payments

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_vehicle_request_kind') THEN
    CREATE TYPE transport_vehicle_request_kind AS ENUM (
      'ADD_VEHICLE',
      'TECH_INSPECTION'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_vehicle_request_status') THEN
    CREATE TYPE transport_vehicle_request_status AS ENUM (
      'PENDING',
      'APPROVED',
      'REJECTED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_vignette_type') THEN
    CREATE TYPE transport_vignette_type AS ENUM (
      'WEEKLY',
      'MONTHLY',
      'QUARTERLY',
      'YEARLY'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_fine_type') THEN
    CREATE TYPE transport_fine_type AS ENUM (
      'SPEED_UP_TO_10',
      'SPEED_11_20',
      'SPEED_21_30',
      'SPEED_31_40',
      'RED_LIGHT',
      'NO_SEATBELT',
      'PHONE_WHILE_DRIVING',
      'NO_INSURANCE',
      'NO_LICENSE',
      'PARKING_FORBIDDEN'
    );
  END IF;
END $$;

-- -----------------------------
-- Vehicles (approved)
-- -----------------------------
CREATE TABLE IF NOT EXISTS transport_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,
  owner_egn varchar(10) NOT NULL,

  reg_number text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  manufacture_year int NOT NULL,
  power_kw int NOT NULL,
  euro_category text NOT NULL,

  tech_inspection_date date NULL,
  tech_inspection_valid_until date NULL,
  tech_inspection_approved_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_transport_vehicles_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_transport_vehicles_owner_egn_digits CHECK (owner_egn ~ '^[0-9]{10}$'),
  CONSTRAINT chk_transport_vehicles_year CHECK (manufacture_year BETWEEN 1900 AND 2100),
  CONSTRAINT chk_transport_vehicles_kw CHECK (power_kw > 0 AND power_kw <= 2000)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_transport_vehicles_reg_number
  ON transport_vehicles (reg_number);

CREATE INDEX IF NOT EXISTS idx_transport_vehicles_user_id
  ON transport_vehicles(user_id);

CREATE INDEX IF NOT EXISTS idx_transport_vehicles_owner_egn
  ON transport_vehicles(owner_egn);

DROP TRIGGER IF EXISTS trg_transport_vehicles_set_updated_at ON transport_vehicles;
CREATE TRIGGER trg_transport_vehicles_set_updated_at
BEFORE UPDATE ON transport_vehicles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- -----------------------------
-- Vehicle tax payments (yearly)
-- -----------------------------
CREATE TABLE IF NOT EXISTS transport_vehicle_tax_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  vehicle_id uuid NOT NULL,
  tax_year int NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_at timestamptz NOT NULL DEFAULT now(),

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_transport_tax_vehicle
    FOREIGN KEY (vehicle_id)
    REFERENCES transport_vehicles(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_transport_tax_year CHECK (tax_year BETWEEN 1900 AND 2100),
  CONSTRAINT chk_transport_tax_amount CHECK (amount >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_transport_vehicle_tax_unique
  ON transport_vehicle_tax_payments(vehicle_id, tax_year);

CREATE INDEX IF NOT EXISTS idx_transport_vehicle_tax_vehicle_id
  ON transport_vehicle_tax_payments(vehicle_id);

-- -----------------------------
-- Vignettes
-- -----------------------------
CREATE TABLE IF NOT EXISTS transport_vignettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,
  owner_egn varchar(10) NOT NULL,
  vehicle_id uuid NOT NULL,

  type transport_vignette_type NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,

  valid_from date NOT NULL,
  valid_until date NOT NULL,

  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_transport_vignettes_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_transport_vignettes_vehicle
    FOREIGN KEY (vehicle_id)
    REFERENCES transport_vehicles(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_transport_vignettes_owner_egn_digits CHECK (owner_egn ~ '^[0-9]{10}$'),
  CONSTRAINT chk_transport_vignettes_valid_range CHECK (valid_until >= valid_from),
  CONSTRAINT chk_transport_vignettes_price CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_transport_vignettes_user_id
  ON transport_vignettes(user_id);

CREATE INDEX IF NOT EXISTS idx_transport_vignettes_vehicle_id
  ON transport_vignettes(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_transport_vignettes_valid_until
  ON transport_vignettes(valid_until);

-- -----------------------------
-- Fines
-- -----------------------------
CREATE TABLE IF NOT EXISTS transport_fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NULL, -- if user exists for this EGN
  egn varchar(10) NOT NULL,

  type transport_fine_type NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,

  issued_at timestamptz NOT NULL DEFAULT now(),

  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_transport_fines_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_transport_fines_egn_digits CHECK (egn ~ '^[0-9]{10}$'),
  CONSTRAINT chk_transport_fines_amount CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_transport_fines_egn
  ON transport_fines(egn);

CREATE INDEX IF NOT EXISTS idx_transport_fines_user_id
  ON transport_fines(user_id);

CREATE INDEX IF NOT EXISTS idx_transport_fines_paid
  ON transport_fines(paid);

DROP TRIGGER IF EXISTS trg_transport_fines_set_updated_at ON transport_fines;
CREATE TRIGGER trg_transport_fines_set_updated_at
BEFORE UPDATE ON transport_fines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- -----------------------------
-- Vehicle Requests (admin approvals)
-- -----------------------------
CREATE TABLE IF NOT EXISTS transport_vehicle_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,
  owner_egn varchar(10) NOT NULL,

  kind transport_vehicle_request_kind NOT NULL,
  status transport_vehicle_request_status NOT NULL DEFAULT 'PENDING',

  -- denormalized helper columns for uniqueness & easier admin filtering
  reg_number text NULL, -- for ADD_VEHICLE
  vehicle_id uuid NULL, -- for TECH_INSPECTION

  payload jsonb NOT NULL,

  admin_note text NULL,
  decided_at timestamptz NULL,
  decided_by_admin_id uuid NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_transport_vehicle_requests_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_transport_vehicle_requests_vehicle
    FOREIGN KEY (vehicle_id)
    REFERENCES transport_vehicles(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_transport_vehicle_requests_decided_by_admin
    FOREIGN KEY (decided_by_admin_id)
    REFERENCES admins(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_transport_vehicle_requests_owner_egn_digits CHECK (owner_egn ~ '^[0-9]{10}$')
);

CREATE INDEX IF NOT EXISTS idx_transport_vehicle_requests_status_kind
  ON transport_vehicle_requests(status, kind);

CREATE INDEX IF NOT EXISTS idx_transport_vehicle_requests_user_id
  ON transport_vehicle_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_transport_vehicle_requests_owner_egn
  ON transport_vehicle_requests(owner_egn);

CREATE INDEX IF NOT EXISTS idx_transport_vehicle_requests_created_at
  ON transport_vehicle_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_transport_vehicle_requests_vehicle_id
  ON transport_vehicle_requests(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_transport_vehicle_requests_reg_number
  ON transport_vehicle_requests(reg_number);

-- One pending ADD_VEHICLE per reg_number
CREATE UNIQUE INDEX IF NOT EXISTS uq_transport_pending_add_vehicle_per_reg
  ON transport_vehicle_requests (reg_number)
  WHERE status = 'PENDING' AND kind = 'ADD_VEHICLE' AND reg_number IS NOT NULL;

-- One pending TECH_INSPECTION per vehicle
CREATE UNIQUE INDEX IF NOT EXISTS uq_transport_pending_inspection_per_vehicle
  ON transport_vehicle_requests (vehicle_id)
  WHERE status = 'PENDING' AND kind = 'TECH_INSPECTION' AND vehicle_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_transport_vehicle_requests_set_updated_at ON transport_vehicle_requests;
CREATE TRIGGER trg_transport_vehicle_requests_set_updated_at
BEFORE UPDATE ON transport_vehicle_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
