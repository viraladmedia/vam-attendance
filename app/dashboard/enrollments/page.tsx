// app/dashboard/enrollments/page.tsx
"use client";

import * as React from "react";
import { TopBar } from "@/components/dashboard/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type Course = { id: string; title: string };
type Teacher = { id: string; name: string };
type Student = { id: string; name: string };
type Enrollment = {
  id: string;
  course_id: string;
  student_id: string;
  teacher_id?: string | null;
  status: "active" | "paused" | "completed" | "dropped";
  enrolled_at?: string | null;
};

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  const [openEditEnrollment, setOpenEditEnrollment] = React.useState(false);
  const [editEnrollmentId, setEditEnrollmentId] = React.useState<string | null>(null);
  const [editEnrollTeacher, setEditEnrollTeacher] = React.useState<string | null>(null);
  const [editEnrollStatus, setEditEnrollStatus] = React.useState<Enrollment["status"]>("active");
  const [enrollmentSaving, setEnrollmentSaving] = React.useState(false);
  const [enrollmentError, setEnrollmentError] = React.useState<string | null>(null);

  const loadAll = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [eRes, cRes, tRes, sRes] = await Promise.all([
        fetch("/api/enrollments", { cache: "no-store" }),
        fetch("/api/courses", { cache: "no-store" }),
        fetch("/api/teachers", { cache: "no-store" }),
        fetch("/api/students", { cache: "no-store" }),
      ]);
      if (!eRes.ok) throw new Error(await eRes.text());
      if (!cRes.ok) throw new Error(await cRes.text());
      if (!tRes.ok) throw new Error(await tRes.text());
      if (!sRes.ok) throw new Error(await sRes.text());
      setEnrollments((await eRes.json()) as Enrollment[]);
      setCourses((await cRes.json()) as Course[]);
      setTeachers((await tRes.json()) as Teacher[]);
      setStudents((await sRes.json()) as Student[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const teacherById = React.useMemo(() => new Map(teachers.map((t) => [t.id, t.name])), [teachers]);
  const studentById = React.useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);
  const courseById = React.useMemo(() => new Map(courses.map((c) => [c.id, c.title])), [courses]);

  const filtered = enrollments.filter((en) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const student = studentById.get(en.student_id) || "";
    const course = courseById.get(en.course_id) || "";
    const teacher = en.teacher_id ? teacherById.get(en.teacher_id) || "" : "";
    return (
      student.toLowerCase().includes(q) ||
      course.toLowerCase().includes(q) ||
      teacher.toLowerCase().includes(q) ||
      en.status.toLowerCase().includes(q)
    );
  });

  const saveEnrollment = async () => {
    if (!editEnrollmentId) return;
    setEnrollmentSaving(true);
    setEnrollmentError(null);
    try {
      const res = await fetch(`/api/enrollments/${editEnrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: editEnrollTeacher || null,
          status: editEnrollStatus,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text);
          setEnrollmentError(parsed.error || parsed.message || "Failed to update enrollment");
        } catch {
          setEnrollmentError(text || "Failed to update enrollment");
        }
        return;
      }
      setOpenEditEnrollment(false);
      await loadAll();
    } catch (err) {
      setEnrollmentError(err instanceof Error ? err.message : "Unexpected error updating enrollment");
    } finally {
      setEnrollmentSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <TopBar title="Enrollments" subtitle="Manage who is enrolled in each course" showAccountInTitle={false} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Enrollment List</CardTitle>
          <Input
            placeholder="Search by student, course, teacher..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-72"
          />
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
                  <th className="py-2 pr-0 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((en) => {
                  const course = courseById.get(en.course_id) || "—";
                  const student = studentById.get(en.student_id) || "Unknown";
                  const teacher = en.teacher_id ? teacherById.get(en.teacher_id) || "—" : "Unassigned";
                  return (
                    <tr key={en.id} className="border-t">
                      <td className="py-2 pr-3">{student}</td>
                      <td className="py-2 pr-3">{course}</td>
                      <td className="py-2 pr-3">{teacher}</td>
                      <td className="py-2 pr-3 capitalize">{en.status}</td>
                      <td className="py-2 pr-3">
                        {en.enrolled_at ? new Date(en.enrolled_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 pr-0 text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditEnrollmentId(en.id);
                              setEditEnrollTeacher(en.teacher_id || null);
                              setEditEnrollStatus(en.status);
                              setEnrollmentError(null);
                              setOpenEditEnrollment(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              if (!confirm("Delete this enrollment?")) return;
                              await fetch(`/api/enrollments/${en.id}`, { method: "DELETE" });
                              await loadAll();
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={6}>
                      No enrollments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {openEditEnrollment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onMouseDown={() => setOpenEditEnrollment(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg rounded-2xl border bg-white p-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Edit Enrollment</h3>
              <button
                aria-label="Close"
                className="h-8 w-8 rounded-md hover:bg-slate-100"
                onClick={() => setOpenEditEnrollment(false)}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Select
                value={editEnrollStatus}
                onValueChange={(v) => setEditEnrollStatus(v as Enrollment["status"])}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={editEnrollTeacher ?? "none"}
                onValueChange={(v) => setEditEnrollTeacher(v === "none" ? null : v)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Assign teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {enrollmentError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {enrollmentError}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenEditEnrollment(false)}>
                Cancel
              </Button>
              <Button onClick={saveEnrollment} disabled={enrollmentSaving}>
                {enrollmentSaving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
