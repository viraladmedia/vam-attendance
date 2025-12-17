// app/dashboard/sessions/page.tsx
"use client";

import * as React from "react";
import { TopBar } from "@/components/dashboard/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Session = {
  id: string;
  title?: string | null;
  teacher_id?: string | null;
  starts_at: string;
};

type Teacher = { id: string; name: string };

type Attendance = { session_id: string; status: string };

export default function SessionsPage() {
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [attendance, setAttendance] = React.useState<Attendance[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [sRes, tRes, aRes] = await Promise.all([
          fetch("/api/sessions", { cache: "no-store" }),
          fetch("/api/teachers", { cache: "no-store" }),
          fetch("/api/attendance", { cache: "no-store" }),
        ]);
        if (!sRes.ok) throw new Error(await sRes.text());
        if (!tRes.ok) throw new Error(await tRes.text());
        if (!aRes.ok) throw new Error(await aRes.text());
        setSessions((await sRes.json()) as Session[]);
        setTeachers((await tRes.json()) as Teacher[]);
        setAttendance((await aRes.json()) as Attendance[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sessions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tMap = React.useMemo(() => new Map(teachers.map((t) => [t.id, t.name])), [teachers]);

  return (
    <div className="space-y-4">
      <TopBar title="Sessions" subtitle="All scheduled sessions" showAccountInTitle={false} />

      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-800">Sessions</CardTitle>
            <p className="text-xs text-slate-500">View all scheduled sessions and attendance counts.</p>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          {loading && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {!loading && !error && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Teacher</th>
                  <th className="py-2 pr-3">Starts</th>
                  <th className="py-2 pr-3">Present / Total</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const total = attendance.filter((a) => a.session_id === s.id).length;
                  const present = attendance.filter(
                    (a) => a.session_id === s.id && a.status === "present"
                  ).length;
                  return (
                    <tr key={s.id} className="border-t">
                      <td className="py-2 pr-3">{s.title ?? "Session"}</td>
                      <td className="py-2 pr-3">{s.teacher_id ? tMap.get(s.teacher_id) ?? "—" : "—"}</td>
                      <td className="py-2 pr-3">
                        {new Date(s.starts_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2 pr-3">
                        {present} / {total}
                      </td>
                    </tr>
                  );
                })}
                {!sessions.length && (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={4}>
                      No sessions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
