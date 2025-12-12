// lib/hooks/useDashboardData.ts
import { useEffect, useState } from "react";

interface DashboardStats {
  totalStudents: number;
  weekSessions: number;
  avgAttendanceRate: number;
  activeSessions: number;
  loading: boolean;
  error: string | null;
}

interface SessionData {
  id: string;
  title: string;
  starts_at: string;
  ends_at?: string | null;
  class_name: string;
  description: string | null;
}

interface StudentData {
  id: string;
  name: string;
  email: string;
  program: string;
  class_name: string;
}

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    weekSessions: 0,
    avgAttendanceRate: 0,
    activeSessions: 0,
    loading: true,
    error: null,
  });

  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setStats((prev) => ({ ...prev, loading: true, error: null }));

        // Fetch all data in parallel via server routes (org-scoped)
        const [studentsRes, sessionsRes] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/sessions"),
        ]);

        if (!studentsRes.ok) {
          throw new Error(await studentsRes.text());
        }
        if (!sessionsRes.ok) {
          throw new Error(await sessionsRes.text());
        }

        const studentsData = (await studentsRes.json()) as StudentData[];
        const sessionsData = (await sessionsRes.json()) as SessionData[];

        // Calculate stats
        const totalStudents = studentsData?.length || 0;

        // Get sessions from this week
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekSessions = sessionsData?.filter((session: SessionData) => {
          const sessionDate = new Date(session.starts_at);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        }).length || 0;

        // Count active sessions (currently happening)
        const activeSessions = sessionsData?.filter((session: SessionData) => {
          const startTime = new Date(session.starts_at);
          const endTime = session.ends_at ? new Date(session.ends_at) : startTime;
          return startTime <= now && endTime >= now;
        }).length || 0;

        // Calculate average attendance rate from teacher stats
        let avgAttendanceRate = 0;
        if (sessionsData && Array.isArray(sessionsData) && sessionsData.length > 0) {
          // For now, use a default rate - this would be calculated from actual attendance records
          avgAttendanceRate = 85;
        }

        setStats({
          totalStudents,
          weekSessions,
          avgAttendanceRate,
          activeSessions,
          loading: false,
          error: null,
        });

        setSessions(sessionsData || []);
        setStudents(studentsData || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch dashboard data";
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    };

    fetchData();
  }, []);

  return { stats, sessions, students };
}
