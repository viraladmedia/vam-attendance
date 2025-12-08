# Backend Integration Guide - Supabase Setup

## Overview
This guide walks you through setting up the VAM Attendance backend with Supabase, including authentication, database schema, and API integration.

## Prerequisites
- Supabase account (create at https://supabase.com)
- Next.js project (already set up)
- Node.js 18+

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: vam-attendance
   - **Database Password**: Create a strong password and save it
   - **Region**: Choose closest to your users
4. Wait for the project to initialize (2-5 minutes)

---

## Step 2: Get Your API Keys

1. In your Supabase project, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

---

## Step 3: Set Up Environment Variables

Create or update `.env.local` in your project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key...
```

Replace with your actual values from Supabase.

---

## Step 4: Create Database Schema

### Option A: Using SQL Editor (Recommended)

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `database/schema.sql`
4. Paste into the SQL editor
5. Click **Run**
6. Wait for the migration to complete

### Option B: Using Migrations (CLI)

If you have Supabase CLI installed:

```bash
supabase db push
```

---

## Step 5: Test the Connection

Create a test file to verify the connection:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Test the client in `lib/supabase/client.ts`:

```typescript
import { getBrowserSupabase } from "@/lib/supabase/client";

const supabase = getBrowserSupabase();
if (supabase) {
  console.log("✅ Supabase client initialized");
} else {
  console.error("❌ Supabase client not initialized");
}
```

---

## Step 6: Enable Authentication

1. In Supabase, go to **Authentication** → **Providers**
2. Enable **Email** (should be default)
3. (Optional) Enable **Google** or **GitHub** for OAuth

### Email Provider Settings
- Go to **Email Templates**
- Verify the confirmation email template
- Customize if needed

---

## Step 7: Test Authentication

1. Start your development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:3000/signup`
3. Create a test account
4. Check Supabase **Authentication** → **Users** to see the new user

---

## Step 8: Configure CORS (if needed)

If you're using a separate frontend URL:

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Add your domain to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://yourdomain.com/auth/callback
   ```

---

## API Usage Examples

### Authentication

```typescript
import { signUp, signIn, signOut, getCurrentUser } from "@/lib/supabase/auth";

// Sign up
const result = await signUp("user@example.com", "password123", {
  full_name: "John Doe"
});

// Sign in
const session = await signIn("user@example.com", "password123");

// Get current user
const user = await getCurrentUser();

// Sign out
await signOut();
```

### Database Operations

```typescript
import {
  createStudent,
  getStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
} from "@/lib/supabase/database";

// Create student
const student = await createStudent({
  name: "Jane Smith",
  email: "jane@example.com",
  class_name: "Class A",
});

// Get all students
const students = await getAllStudents();

// Get specific student
const one = await getStudent(studentId);

// Update student
await updateStudent(studentId, { class_name: "Class B" });

// Delete student
await deleteStudent(studentId);
```

### Attendance

```typescript
import {
  recordAttendance,
  getSessionAttendance,
  getStudentAttendance,
} from "@/lib/supabase/database";

// Record attendance
const record = await recordAttendance({
  session_id: sessionId,
  student_id: studentId,
  status: "present",
  notes: "On time",
});

// Get session attendance
const attendance = await getSessionAttendance(sessionId);

// Get student attendance
const records = await getStudentAttendance(studentId);
```

---

## Database Schema Overview

### Tables Created

1. **users** - Extended from Supabase auth.users
   - id, email, full_name, phone, location, bio, avatar_url

2. **teachers** - Teacher information
   - id, name, email, user_id, department, phone

3. **students** - Student information
   - id, name, email, program, duration_weeks, sessions_per_week, class_name

4. **sessions** - Class/training sessions
   - id, teacher_id, title, starts_at, ends_at, class_name, description

5. **attendance** - Attendance records
   - id, session_id, student_id, status (present/absent/late), notes, noted_at

### Relationships

```
users (1) ──→ (many) teachers
sessions ──→ teachers
sessions (1) ──→ (many) attendance
students (1) ──→ (many) attendance
```

---

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **Users**: Can only see their own data
- **Teachers**: Public read, authenticated can create/update own
- **Students**: Public read, authenticated can manage
- **Sessions**: Public read, teachers can manage their sessions
- **Attendance**: Public read, teachers can manage for their sessions

---

## Troubleshooting

### "Supabase client not initialized"
- Check `.env.local` has correct values
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart the development server

### "Table does not exist"
- Run the SQL migration from Step 4
- Check table names in Supabase Dashboard → **Table Editor**

### "Permission denied" errors
- Verify RLS policies are enabled
- Check user authentication status
- Review RLS policy rules in Security Editor

### CORS errors
- Add your frontend URL to **Authentication** → **URL Configuration**
- Check browser console for full error message

---

## Next Steps

1. **Test All Authentication Flows**
   - Login page
   - Signup page
   - Logout
   - Password reset

2. **Implement Dashboard Data**
   - Fetch real data in dashboard pages
   - Connect attendance recording
   - Create real-time updates

3. **Add Email Notifications**
   - Setup email service (SendGrid, Mailgun)
   - Create notification templates
   - Implement notification triggers

4. **Setup Stripe Payments** (if offering paid tiers)
   - Create Stripe account
   - Setup product tiers
   - Implement checkout flow

5. **Security Hardening**
   - Review and test RLS policies
   - Add rate limiting to API routes
   - Setup monitoring and logging

---

## Useful Supabase Resources

- [Supabase Docs](https://supabase.com/docs)
- [Database Docs](https://supabase.com/docs/guides/database)
- [Authentication Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [API Reference](https://supabase.com/docs/reference)

---

## Monitoring & Debugging

### View Logs
- Go to **Logs** in Supabase Dashboard
- Filter by table, user, or time range
- Check for errors and access patterns

### Monitor Performance
- Use **Database** → **Inspector** for slow queries
- Check **Statistics** for usage metrics
- Review **Backups** section

### Real-time Subscriptions
```typescript
// Listen for changes (optional feature)
const subscription = supabase
  .from("attendance")
  .on("*", (payload) => {
    console.log("Attendance changed:", payload);
  })
  .subscribe();
```

---

## Security Checklist

- [x] Environment variables set securely
- [ ] RLS policies reviewed and tested
- [ ] API routes have proper validation
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] Regular database backups enabled
- [ ] Audit logs monitored
- [ ] Service role key stored safely (backend only)

---

**Last Updated**: December 8, 2024
**Status**: Backend Integration Phase
