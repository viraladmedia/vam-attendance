// app/dashboard/students/page.tsx
"use client";

import * as React from "react";
import { TopBar } from "@/components/dashboard/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Mail, Loader2 } from "lucide-react";

type Student = {
  id: string;
  name: string;
  email?: string | null;
  program?: string | null;
  class_name?: string | null;
  created_at?: string | null;
};

type Teacher = { id: string; name: string };
type Course = { id: string; title: string; modality: "group" | "1on1" };

export default function StudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [openEnroll, setOpenEnroll] = React.useState(false);
  const [enrollStudentId, setEnrollStudentId] = React.useState<string>("");
  const [enrollCourseId, setEnrollCourseId] = React.useState<string>("");
  const [enrollTeacherId, setEnrollTeacherId] = React.useState<string | null>(null);
  const [enrollStatus, setEnrollStatus] = React.useState<"active" | "paused" | "completed" | "dropped">("active");
  const [enrollSaving, setEnrollSaving] = React.useState(false);
  const [enrollError, setEnrollError] = React.useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = React.useState<string | null>(null);
  const [openStudentModal, setOpenStudentModal] = React.useState(false);
  const [newStudentName, setNewStudentName] = React.useState("");
  const [newStudentEmail, setNewStudentEmail] = React.useState("");
  const [studentSaving, setStudentSaving] = React.useState(false);
  const [studentError, setStudentError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [sRes, tRes, cRes] = await Promise.all([
          fetch("/api/students", { cache: "no-store" }),
          fetch("/api/teachers", { cache: "no-store" }),
          fetch("/api/courses", { cache: "no-store" }),
        ]);
        if (!sRes.ok) throw new Error(await sRes.text());
        if (!tRes.ok) throw new Error(await tRes.text());
        if (!cRes.ok) throw new Error(await cRes.text());
        const sData = (await sRes.json()) as Student[];
        const tData = (await tRes.json()) as Teacher[];
        const cData = (await cRes.json()) as Course[];
        setStudents(sData);
        setTeachers(tData);
        setCourses(cData);
        if (sData.length) setEnrollStudentId(sData[0].id);
        if (cData.length) setEnrollCourseId(cData[0].id);
        if (tData.length) setEnrollTeacherId(tData[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load students");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = students.filter((s) =>
    [s.name, s.email, s.program, s.class_name]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <TopBar title="Students" subtitle="Manage enrollment" showAccountInTitle={false} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Student Directory</CardTitle>
            <p className="text-sm text-slate-600">Browse all learners linked to your org.</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search students..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              name="student-search"
              className="w-56"
            />
            <Button variant="secondary" onClick={() => setOpenEnroll(true)}>
              + Enroll Student
            </Button>
            <Button onClick={() => setOpenStudentModal(true)}>+ Add Student</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading students...
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-semibold">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-600">{s.program || s.class_name || "Unassigned"}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-700">
                    {s.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <a className="hover:underline" href={`mailto:${s.email}`}>
                          {s.email}
                        </a>
                      </div>
                    )}
                    {s.class_name && <div className="text-slate-600">Class: {s.class_name}</div>}
                    {s.created_at && (
                      <div className="text-xs text-slate-500">
                        Added {new Date(s.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!filtered.length && (
                <div className="col-span-full rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-center text-slate-600">
                  No students found. Use “Add Student” to get started.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {openStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={() => setOpenStudentModal(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl border bg-white p-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Add Student</h3>
              <button
                aria-label="Close"
                className="h-8 w-8 rounded-md hover:bg-slate-100"
                onClick={() => setOpenStudentModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Full name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                name="student-name"
                className="h-9"
              />
              <Input
                placeholder="Email (optional)"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                name="student-email"
                className="h-9"
              />
              {studentError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {studentError}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenStudentModal(false)}>
                Cancel
              </Button>
              <Button
                disabled={studentSaving || !newStudentName.trim()}
                onClick={async () => {
                  try {
                    setStudentSaving(true);
                    setStudentError(null);
                    const res = await fetch("/api/students", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: newStudentName.trim(), email: newStudentEmail || undefined }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    setNewStudentName("");
                    setNewStudentEmail("");
                    setOpenStudentModal(false);
                    const sRes = await fetch("/api/students", { cache: "no-store" });
                    if (sRes.ok) setStudents((await sRes.json()) as Student[]);
                  } catch (err) {
                    setStudentError(err instanceof Error ? err.message : "Failed to create student");
                  } finally {
                    setStudentSaving(false);
                  }
                }}
              >
                {studentSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {openEnroll && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" onMouseDown={() => setOpenEnroll(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xl rounded-2xl border bg-white p-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Enroll Student into Course</h3>
              <button
                aria-label="Close"
                className="h-8 w-8 rounded-md hover:bg-slate-100"
                onClick={() => setOpenEnroll(false)}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Select value={enrollStudentId} onValueChange={setEnrollStudentId}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={enrollCourseId} onValueChange={setEnrollCourseId}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title} ({c.modality === "group" ? "Group" : "1:1"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

          <Select value={enrollTeacherId ?? "none"} onValueChange={(v) => setEnrollTeacherId(v === "none" ? null : v)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Assign teacher (optional)" />
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

              <Select value={enrollStatus} onValueChange={(v) => setEnrollStatus(v as typeof enrollStatus)}>
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
            </div>

            {enrollSuccess && (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {enrollSuccess}
              </div>
            )}
            {enrollError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {enrollError}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenEnroll(false)}>
                Cancel
              </Button>
              <Button
                disabled={enrollSaving || !enrollStudentId || !enrollCourseId}
                onClick={async () => {
                  try {
                    setEnrollSaving(true);
                    setEnrollError(null);
                    setEnrollSuccess(null);
                    const res = await fetch("/api/enrollments", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        student_id: enrollStudentId,
                        course_id: enrollCourseId,
                        teacher_id: enrollTeacherId,
                        status: enrollStatus,
                      }),
                    });
                    if (!res.ok) {
                      const raw = await res.text();
                      try {
                        const parsed = JSON.parse(raw);
                        const msg = parsed.error || parsed.message || raw;
                        const hint = parsed.hint ? ` (${parsed.hint})` : "";
                        throw new Error(`${msg}${hint}`);
                      } catch {
                        throw new Error(raw || "Failed to enroll student");
                      }
                    }
                    setEnrollSuccess("Enrollment created");
                    setOpenEnroll(false);
                  } catch (err) {
                    setEnrollError(err instanceof Error ? err.message : "Failed to enroll student");
                  } finally {
                    setEnrollSaving(false);
                  }
                }}
              >
                {enrollSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
