-- V16__reports_module.sql
-- Reports module: problem reports (signals) submitted by users and reviewed by admins.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'problem_report_status') THEN
    CREATE TYPE problem_report_status AS ENUM (
      'IN_REVIEW',
      'RESOLVED',
      'REJECTED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS problem_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,

  -- denormalized snapshot for admin UI (matches frontend localStorage fields)
  user_egn varchar(10) NOT NULL,
  user_full_name text NOT NULL,

  category text NOT NULL,
  description text NOT NULL,

  status problem_report_status NOT NULL DEFAULT 'IN_REVIEW',

  admin_note text NULL,

  decided_at timestamptz NULL,
  decided_by_admin_id uuid NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_problem_reports_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_problem_reports_decided_by_admin
    FOREIGN KEY (decided_by_admin_id)
    REFERENCES admins(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_problem_reports_user_egn_digits CHECK (user_egn ~ '^[0-9]{10}$'),

  -- Categories from frontend: problemReportsModel.js
  CONSTRAINT chk_problem_reports_category CHECK (
    category IN (
      'road-infrastructure',
      'utilities',
      'public-order',
      'cleanliness-waste',
      'app-issue',
      'other'
    )
  ),

  -- Frontend validates minimum 10 chars
  CONSTRAINT chk_problem_reports_description_min_len CHECK (length(btrim(description)) >= 10)
);

CREATE INDEX IF NOT EXISTS idx_problem_reports_user_id
  ON problem_reports(user_id);

CREATE INDEX IF NOT EXISTS idx_problem_reports_status
  ON problem_reports(status);

CREATE INDEX IF NOT EXISTS idx_problem_reports_created_at
  ON problem_reports(created_at);

-- updated_at trigger (function set_updated_at() is created in V2__users.sql and reused across modules)
DROP TRIGGER IF EXISTS trg_problem_reports_set_updated_at ON problem_reports;
CREATE TRIGGER trg_problem_reports_set_updated_at
BEFORE UPDATE ON problem_reports
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
