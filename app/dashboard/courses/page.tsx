// app/dashboard/courses/page.tsx
"use client";

import * as React from "react";
import { TopBar } from "@/components/dashboard/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Loader2 } from "lucide-react";

type Course = {
  id: string;
  title: string;
  description?: string | null;
  modality: "group" | "1on1";
  lead_teacher_id?: string | null;
  max_students?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

type Enrollment = {
  id: string;
  course_id: string;
  student_id: string;
  teacher_id?: string | null;
  status: "active" | "paused" | "completed" | "dropped";
  enrolled_at?: string | null;
};

type Teacher = { id: string; name: string };
type Student = { id: string; name: string };

export default function CoursesPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [cRes, eRes, tRes, sRes] = await Promise.all([
          fetch("/api/courses", { cache: "no-store" }),
          fetch("/api/enrollments", { cache: "no-store" }),
          fetch("/api/teachers", { cache: "no-store" }),
          fetch("/api/students", { cache: "no-store" }),
        ]);
        if (!cRes.ok) throw new Error(await cRes.text());
        if (!eRes.ok) throw new Error(await eRes.text());
        if (!tRes.ok) throw new Error(await tRes.text());
        if (!sRes.ok) throw new Error(await sRes.text());
        setCourses((await cRes.json()) as Course[]);
        setEnrollments((await eRes.json()) as Enrollment[]);
        setTeachers((await tRes.json()) as Teacher[]);
        setStudents((await sRes.json()) as Student[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const teacherById = React.useMemo(() => new Map(teachers.map((t) => [t.id, t.name])), [teachers]);
  const studentById = React.useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);

  const courseStats = React.useMemo(() => {
    const map = new Map<string, { total: number; active: number }>();
    courses.forEach((c) => map.set(c.id, { total: 0, active: 0 }));
    enrollments.forEach((en) => {
      const entry = map.get(en.course_id);
      if (!entry) return;
      entry.total += 1;
      if (en.status === "active") entry.active += 1;
    });
    return map;
  }, [courses, enrollments]);

  const filteredCourses = courses.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q) ||
      (c.modality || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <TopBar title="Courses" subtitle="Programs and enrollments" showAccountInTitle={false} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Courses & Programs</CardTitle>
            <p className="text-sm text-slate-600">
              See group and 1:1 offerings, lead teachers, and enrolled students.
            </p>
          </div>
          <Input
            placeholder="Search courses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64"
          />
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading courses...
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredCourses.map((course) => {
                const stats = courseStats.get(course.id) || { total: 0, active: 0 };
                const lead = course.lead_teacher_id ? teacherById.get(course.lead_teacher_id) : "Unassigned";
                return (
                  <Card key={course.id} className="border border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{course.title}</CardTitle>
                          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                            <Badge variant="outline" className="border-slate-200">
                              {course.modality === "group" ? "Group" : "1:1"}
                            </Badge>
                            {course.max_students ? (
                              <span>Cap: {course.max_students}</span>
                            ) : (
                              <span className="text-slate-500">No cap</span>
                            )}
                          </div>
                        </div>
                        <BookOpen className="h-5 w-5 text-slate-400" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-700">
                      {course.description && (
                        <p className="text-slate-600">{course.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-slate-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-slate-400" /> {stats.total} enrolled
                          {stats.active !== stats.total ? ` (${stats.active} active)` : ""}
                        </span>
                        <span className="text-slate-500">Lead: {lead}</span>
                        {course.starts_at && (
                          <span className="text-slate-500">
                            Starts {new Date(course.starts_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {!filteredCourses.length && (
                <div className="col-span-full rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-center text-slate-600">
                  No courses found. Create one from the Teachers page.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrollments</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading enrollments...
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
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Course</th>
                  <th className="py-2 pr-3">Teacher</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((en) => {
                  const course = courses.find((c) => c.id === en.course_id);
                  const student = studentById.get(en.student_id) || "Unknown";
                  const teacher = en.teacher_id ? teacherById.get(en.teacher_id) || "—" : "Unassigned";
                  return (
                    <tr key={en.id} className="border-t">
                      <td className="py-2 pr-3">{student}</td>
                      <td className="py-2 pr-3">{course?.title || "—"}</td>
                      <td className="py-2 pr-3">{teacher}</td>
                      <td className="py-2 pr-3 capitalize">{en.status}</td>
                      <td className="py-2 pr-3">
                        {en.enrolled_at ? new Date(en.enrolled_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
                {!enrollments.length && (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={5}>
                      No enrollments yet.
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
