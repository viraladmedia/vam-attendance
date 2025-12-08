-- SQL Migration: Create VAM Attendance Database Schema
-- This file contains all necessary tables and relationships for the VAM Attendance system

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  location text,
  bio text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  department text,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  program text,
  duration_weeks integer,
  sessions_per_week integer,
  class_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  title text,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone,
  class_name text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  notes text,
  noted_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(session_id, student_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_starts_at ON sessions(starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_noted_at ON attendance(noted_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table (users can only view their own data)
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for teachers table (public read, authenticated users can create/update)
CREATE POLICY "Teachers are viewable by everyone"
  ON teachers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create teachers"
  ON teachers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Teachers can update their own records"
  ON teachers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for students table (public read, authenticated can create/update)
CREATE POLICY "Students are viewable by everyone"
  ON students FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create students"
  ON students FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update students"
  ON students FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for sessions table (public read, authenticated can create/update)
CREATE POLICY "Sessions are viewable by everyone"
  ON sessions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Teachers can update their sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = teacher_id OR auth.role() = 'admin')
  WITH CHECK (auth.uid() = teacher_id OR auth.role() = 'admin');

-- RLS Policies for attendance table (public read, authenticated can create/update)
CREATE POLICY "Attendance records are viewable by everyone"
  ON attendance FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can record attendance"
  ON attendance FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Teachers can update attendance for their sessions"
  ON attendance FOR UPDATE
  USING (
    auth.uid() = (
      SELECT user_id FROM teachers
      WHERE id = (
        SELECT teacher_id FROM sessions WHERE id = attendance.session_id
      )
    )
    OR auth.role() = 'admin'
  )
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM teachers
      WHERE id = (
        SELECT teacher_id FROM sessions WHERE id = attendance.session_id
      )
    )
    OR auth.role() = 'admin'
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: Apply this migration in Supabase using the SQL Editor in the dashboard
-- 1. Go to your Supabase project
-- 2. Navigate to the "SQL Editor" tab
-- 3. Click "New Query"
-- 4. Copy and paste this entire script
-- 5. Click "Run" button
-- 6. The schema will be created with all tables, indexes, and RLS policies
