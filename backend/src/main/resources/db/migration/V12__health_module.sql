-- V12__health_module.sql
-- Health module tables (doctors, profiles, requests, referrals, appointments)
-- Designed to match the Health Backend Entities/Services.

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'health_request_kind') THEN
    CREATE TYPE health_request_kind AS ENUM (
      'ADD_PERSONAL_DOCTOR',
      'REMOVE_PERSONAL_DOCTOR',
      'ADD_REFERRAL'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'health_request_status') THEN
    CREATE TYPE health_request_status AS ENUM (
      'PENDING',
      'APPROVED',
      'REJECTED'
    );
  END IF;
END $$;

-- 1) Doctors directory (managed by Admin)
CREATE TABLE IF NOT EXISTS health_doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  first_name text NOT NULL,
  last_name  text NOT NULL,

  practice_number varchar(10) NOT NULL UNIQUE,
  rzok_no        text NULL,
  health_region  text NULL,

  -- Frontend uses "1" / "2" (string). Keep same for parity.
  shift smallint NOT NULL,

  mobile text NOT NULL,

  oblast text NOT NULL,
  city   text NOT NULL,
  street text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_health_doctors_practice_digits CHECK (practice_number ~ '^[0-9]{10}$'),
    CONSTRAINT chk_health_doctors_shift CHECK (shift IN (1, 2))
);

CREATE INDEX IF NOT EXISTS idx_health_doctors_practice_number ON health_doctors(practice_number);

DROP TRIGGER IF EXISTS trg_health_doctors_set_updated_at ON health_doctors;
CREATE TRIGGER trg_health_doctors_set_updated_at
BEFORE UPDATE ON health_doctors
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 2) Per-user health profile (holds current personal doctor snapshot)
CREATE TABLE IF NOT EXISTS health_user_profiles (
  user_id uuid PRIMARY KEY,

  personal_doctor_practice_number varchar(10) NULL,
  personal_doctor_snapshot jsonb NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_health_user_profiles_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_health_user_profiles_practice_digits CHECK (
    personal_doctor_practice_number IS NULL OR personal_doctor_practice_number ~ '^[0-9]{10}$'
  )
);

CREATE INDEX IF NOT EXISTS idx_health_user_profiles_practice_number
  ON health_user_profiles(personal_doctor_practice_number);

DROP TRIGGER IF EXISTS trg_health_user_profiles_set_updated_at ON health_user_profiles;
CREATE TRIGGER trg_health_user_profiles_set_updated_at
BEFORE UPDATE ON health_user_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 3) Health requests (like property requests)
CREATE TABLE IF NOT EXISTS health_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,

  kind   health_request_kind NOT NULL,
  status health_request_status NOT NULL DEFAULT 'PENDING',

  payload jsonb NOT NULL DEFAULT '{}'::jsonb,

  admin_note text NULL,
  decided_at timestamptz NULL,
  decided_by_admin_id uuid NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_health_requests_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_health_requests_decided_by_admin
    FOREIGN KEY (decided_by_admin_id)
    REFERENCES admins(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_health_requests_user_created_at ON health_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_requests_status_created_at ON health_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_requests_user_kind_status ON health_requests(user_id, kind, status);
CREATE INDEX IF NOT EXISTS idx_health_requests_kind ON health_requests(kind);

DROP TRIGGER IF EXISTS trg_health_requests_set_updated_at ON health_requests;
CREATE TRIGGER trg_health_requests_set_updated_at
BEFORE UPDATE ON health_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4) Referrals (created after APPROVE of ADD_REFERRAL)
CREATE TABLE IF NOT EXISTS health_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,
  title text NOT NULL,

  source_request_id uuid NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_health_referrals_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_health_referrals_source_request
    FOREIGN KEY (source_request_id)
    REFERENCES health_requests(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_health_referrals_user_created_at ON health_referrals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_referrals_source_request_id ON health_referrals(source_request_id);

DROP TRIGGER IF EXISTS trg_health_referrals_set_updated_at ON health_referrals;
CREATE TRIGGER trg_health_referrals_set_updated_at
BEFORE UPDATE ON health_referrals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 5) Appointments
CREATE TABLE IF NOT EXISTS health_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,

  doctor_practice_number varchar(10) NOT NULL,
  doctor_name text NOT NULL,

  appt_date date NOT NULL,
  appt_time varchar(5) NOT NULL, -- "HH:MM"

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_health_appointments_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_health_appointments_practice_digits CHECK (doctor_practice_number ~ '^[0-9]{10}$'),
  CONSTRAINT chk_health_appointments_time_format CHECK (appt_time ~ '^[0-9]{2}:[0-9]{2}$'),

  -- One slot per doctor per day/time
  CONSTRAINT uq_health_appointments_doctor_slot UNIQUE (doctor_practice_number, appt_date, appt_time),

  -- Optional but useful: user can't book two different doctors same day/time
  CONSTRAINT uq_health_appointments_user_slot UNIQUE (user_id, appt_date, appt_time)
);

CREATE INDEX IF NOT EXISTS idx_health_appointments_user_date ON health_appointments(user_id, appt_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_appointments_doctor_date ON health_appointments(doctor_practice_number, appt_date DESC);

DROP TRIGGER IF EXISTS trg_health_appointments_set_updated_at ON health_appointments;
CREATE TRIGGER trg_health_appointments_set_updated_at
BEFORE UPDATE ON health_appointments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
