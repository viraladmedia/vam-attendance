-- SQL Migration: Multi-tenant schema with org-scoped RLS for VAM Attendance

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization memberships
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'teacher', 'student', 'viewer')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  seat_number int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- NOTE: These functions live in the public schema (not auth) to avoid permission issues.
CREATE OR REPLACE FUNCTION public.app_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt()->>'org_id', '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.app_has_org_role(check_org uuid, roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM memberships m
    WHERE m.org_id = check_org
      AND m.user_id = auth.uid()
      AND m.role = ANY (roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.app_is_org_member(check_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM memberships m
    WHERE m.org_id = check_org
      AND m.user_id = auth.uid()
  );
$$;

-- If legacy tables already exist, ensure org_id column is present before policies run.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE users ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teachers' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE teachers ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE students ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE sessions ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE attendance ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- Invitations
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'viewer')),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscriptions per org (Stripe-driven)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'inactive',
  plan text NOT NULL DEFAULT 'free',
  seats int NOT NULL DEFAULT 1,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  stripe_subscription_id text,
  stripe_price_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Users table (extends Supabase auth.users) with org scope
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  location text,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (org_id, email)
);

-- Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  department text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (org_id, email)
);

-- Courses / Programs
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  modality text NOT NULL CHECK (modality IN ('group', '1on1')),
  lead_teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  course_type text,
  duration_weeks integer,
  sessions_per_week integer,
  max_students int,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enrollments (student can join many courses)
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','dropped')),
  enrolled_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (org_id, student_id, course_id)
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  program text,
  duration_weeks integer,
  sessions_per_week integer,
  class_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (org_id, email)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  title text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  class_name text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  notes text,
  noted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (org_id, session_id, student_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_teachers_org_id ON teachers(org_id);
CREATE INDEX IF NOT EXISTS idx_students_org_id ON students(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org_id ON sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_attendance_org_id ON attendance(org_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org_user ON memberships(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_invites_org_email ON invites(org_id, email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_courses_org_id ON courses(org_id);
CREATE INDEX IF NOT EXISTS idx_courses_lead_teacher ON courses(lead_teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_org_student ON enrollments(org_id, student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_org_course ON enrollments(org_id, course_id);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Organizations are org-scoped readable by members"
  ON organizations FOR SELECT
  USING (
    id = public.app_org_id()
    AND (
      public.app_is_org_member(id)
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Organizations insert by owner"
  ON organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Organizations update by owner"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Organizations delete by owner"
  ON organizations FOR DELETE
  USING (owner_id = auth.uid());

-- Memberships policies
CREATE POLICY "Memberships are org-scoped readable by members"
  ON memberships FOR SELECT
  USING (
    org_id = public.app_org_id()
    AND public.app_is_org_member(org_id)
  );

CREATE POLICY "Memberships insert by org admins"
  ON memberships FOR INSERT
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  );

CREATE POLICY "Memberships update by org admins"
  ON memberships FOR UPDATE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  )
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  );

CREATE POLICY "Memberships delete by org admins"
  ON memberships FOR DELETE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  );

-- Invites policies
CREATE POLICY "Invites readable in org by members"
  ON invites FOR SELECT
  USING (
    org_id = public.app_org_id()
    AND public.app_is_org_member(org_id)
  );

CREATE POLICY "Invites insert by org admins"
  ON invites FOR INSERT
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  );

CREATE POLICY "Invites update by org admins"
  ON invites FOR UPDATE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  )
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  );

CREATE POLICY "Invites delete by org admins"
  ON invites FOR DELETE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  );

-- Subscriptions policies
CREATE POLICY "Subscriptions readable by org members"
  ON subscriptions FOR SELECT
  USING (
    org_id = public.app_org_id()
    AND public.app_is_org_member(org_id)
  );

CREATE POLICY "Subscriptions mutate by org admins"
  ON subscriptions FOR ALL
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  )
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  );

-- Audit logs policies (read admin+, insert any member via server)
CREATE POLICY "Audit logs readable by org admins"
  ON audit_logs FOR SELECT
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  );

CREATE POLICY "Audit logs insert by members"
  ON audit_logs FOR INSERT
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_is_org_member(org_id)
  );

-- Users policies (self within org)
CREATE POLICY "Users readable by self within org"
  ON users FOR SELECT
  USING (
    org_id = public.app_org_id()
    AND id = auth.uid()
  );

CREATE POLICY "Users update self within org"
  ON users FOR UPDATE
  USING (
    org_id = public.app_org_id()
    AND id = auth.uid()
  )
  WITH CHECK (
    org_id = public.app_org_id()
    AND id = auth.uid()
  );

-- Teachers policies
CREATE POLICY "Teachers readable by org members"
  ON teachers FOR SELECT
  USING (
    org_id = public.app_org_id()
    AND public.app_is_org_member(org_id)
  );

CREATE POLICY "Teachers insert by org admins"
  ON teachers FOR INSERT
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  );

CREATE POLICY "Teachers update by org admins"
  ON teachers FOR UPDATE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  )
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  );

CREATE POLICY "Teachers delete by org admins"
  ON teachers FOR DELETE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin'])
  );

-- Students policies
CREATE POLICY "Students readable by org members"
  ON students FOR SELECT
  USING (
    org_id = public.app_org_id()
    AND public.app_is_org_member(org_id)
  );

CREATE POLICY "Students insert by admins or teachers"
  ON students FOR INSERT
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

CREATE POLICY "Students update by admins or teachers"
  ON students FOR UPDATE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  )
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

CREATE POLICY "Students delete by admins or teachers"
  ON students FOR DELETE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

-- Sessions policies
CREATE POLICY "Sessions readable by org members"
  ON sessions FOR SELECT
  USING (
    org_id = public.app_org_id()
    AND public.app_is_org_member(org_id)
  );

CREATE POLICY "Sessions insert by admins or teachers"
  ON sessions FOR INSERT
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

CREATE POLICY "Sessions update by admins or teachers"
  ON sessions FOR UPDATE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  )
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

CREATE POLICY "Sessions delete by admins or teachers"
  ON sessions FOR DELETE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

-- Courses policies
CREATE POLICY "Courses readable by org members"
  ON courses FOR SELECT
  USING (
    org_id = public.app_org_id()
    AND public.app_is_org_member(org_id)
  );

CREATE POLICY "Courses insert by admins or teachers"
  ON courses FOR INSERT
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

CREATE POLICY "Courses update by admins or teachers"
  ON courses FOR UPDATE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  )
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

CREATE POLICY "Courses delete by admins or teachers"
  ON courses FOR DELETE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

-- Enrollments policies
CREATE POLICY "Enrollments readable by org members"
  ON enrollments FOR SELECT
  USING (
    org_id = public.app_org_id()
    AND public.app_is_org_member(org_id)
  );

CREATE POLICY "Enrollments insert by admins or teachers"
  ON enrollments FOR INSERT
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

CREATE POLICY "Enrollments update by admins or teachers"
  ON enrollments FOR UPDATE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  )
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

CREATE POLICY "Enrollments delete by admins or teachers"
  ON enrollments FOR DELETE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );
-- Attendance policies
CREATE POLICY "Attendance readable by org members"
  ON attendance FOR SELECT
  USING (
    org_id = public.app_org_id()
    AND public.app_is_org_member(org_id)
  );

CREATE POLICY "Attendance insert by admins or teachers"
  ON attendance FOR INSERT
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

CREATE POLICY "Attendance update by admins or teachers"
  ON attendance FOR UPDATE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  )
  WITH CHECK (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

CREATE POLICY "Attendance delete by admins or teachers"
  ON attendance FOR DELETE
  USING (
    org_id = public.app_org_id()
    AND public.app_has_org_role(org_id, ARRAY['owner','admin','teacher'])
  );

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (drop/create to avoid duplicates on re-run)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    DROP TRIGGER update_users_updated_at ON users;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_teachers_updated_at') THEN
    DROP TRIGGER update_teachers_updated_at ON teachers;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_students_updated_at') THEN
    DROP TRIGGER update_students_updated_at ON students;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sessions_updated_at') THEN
    DROP TRIGGER update_sessions_updated_at ON sessions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_attendance_updated_at') THEN
    DROP TRIGGER update_attendance_updated_at ON attendance;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_organizations_updated_at') THEN
    DROP TRIGGER update_organizations_updated_at ON organizations;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_memberships_updated_at') THEN
    DROP TRIGGER update_memberships_updated_at ON memberships;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invites_updated_at') THEN
    DROP TRIGGER update_invites_updated_at ON invites;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
    DROP TRIGGER update_subscriptions_updated_at ON subscriptions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_courses_updated_at') THEN
    DROP TRIGGER update_courses_updated_at ON courses;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_enrollments_updated_at') THEN
    DROP TRIGGER update_enrollments_updated_at ON enrollments;
  END IF;
END;
$$;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invites_updated_at BEFORE UPDATE ON invites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
