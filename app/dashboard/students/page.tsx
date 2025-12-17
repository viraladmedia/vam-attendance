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
  phone?: string | null;
  country?: string | null;
  program?: string | null;
  class_name?: string | null;
  created_at?: string | null;
};

type Teacher = { id: string; name: string };
type Course = { id: string; title: string; modality: "group" | "1on1" };
type Session = { id: string; title?: string | null; starts_at: string };

export default function StudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [enrollments, setEnrollments] = React.useState<any[]>([]);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
  const [openEnroll, setOpenEnroll] = React.useState(false);
  const [enrollStudentId, setEnrollStudentId] = React.useState<string>("");
  const [enrollCourseIds, setEnrollCourseIds] = React.useState<string[]>([]);
  const [enrollCourseSearch, setEnrollCourseSearch] = React.useState("");
  const [enrollStatus, setEnrollStatus] = React.useState<"active" | "paused" | "completed" | "dropped">("active");
  const [enrollSaving, setEnrollSaving] = React.useState(false);
  const [enrollError, setEnrollError] = React.useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = React.useState<string | null>(null);
  const [openStudentModal, setOpenStudentModal] = React.useState(false);
  const [newStudentName, setNewStudentName] = React.useState("");
  const [newStudentEmail, setNewStudentEmail] = React.useState("");
  const [newStudentPhone, setNewStudentPhone] = React.useState("");
  const [newStudentCountry, setNewStudentCountry] = React.useState("");
  const [studentSaving, setStudentSaving] = React.useState(false);
  const [studentError, setStudentError] = React.useState<string | null>(null);
  const [openEditStudent, setOpenEditStudent] = React.useState(false);
  const [editStudentId, setEditStudentId] = React.useState<string | null>(null);
  const [editStudentName, setEditStudentName] = React.useState("");
  const [editStudentEmail, setEditStudentEmail] = React.useState("");
  const [editStudentPhone, setEditStudentPhone] = React.useState("");
  const [editStudentCountry, setEditStudentCountry] = React.useState("");
  const [editStudentSaving, setEditStudentSaving] = React.useState(false);
  const [editStudentError, setEditStudentError] = React.useState<string | null>(null);
  const [detailStudent, setDetailStudent] = React.useState<Student | null>(null);
  const [detailAttendance, setDetailAttendance] = React.useState<
    { id: string; session_id: string; status: string; noted_at?: string }[]
  >([]);
  const [detailEnrollments, setDetailEnrollments] = React.useState<
    { id: string; course_id: string; status: string; enrolled_at?: string }[]
  >([]);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [sRes, tRes, cRes, eRes, ssRes] = await Promise.all([
          fetch("/api/students", { cache: "no-store" }),
          fetch("/api/teachers", { cache: "no-store" }),
          fetch("/api/courses", { cache: "no-store" }),
          fetch("/api/enrollments", { cache: "no-store" }),
          fetch("/api/sessions", { cache: "no-store" }),
        ]);
        if (!sRes.ok) throw new Error(await sRes.text());
        if (!tRes.ok) throw new Error(await tRes.text());
        if (!cRes.ok) throw new Error(await cRes.text());
        if (!eRes.ok) throw new Error(await eRes.text());
        if (!ssRes.ok) throw new Error(await ssRes.text());
        const sData = (await sRes.json()) as Student[];
        const tData = (await tRes.json()) as Teacher[];
        const cData = (await cRes.json()) as Course[];
        const eData = (await eRes.json()) as any[];
        const ssData = (await ssRes.json()) as Session[];
        setStudents(sData);
        setTeachers(tData);
        setCourses(cData);
        setEnrollments(eData);
        setSessions(ssData);
        if (sData.length) {
          setEnrollStudentId(sData[0].id);
          const existing = eData.filter((e: any) => e.student_id === sData[0].id).map((e: any) => e.course_id);
          setEnrollCourseIds(existing.length ? existing : cData[0] ? [cData[0].id] : []);
        }
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
    [s.name, s.email, s.phone, s.country]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(query.toLowerCase()))
  );

  // Update selected courses when student selection changes
  React.useEffect(() => {
    if (!enrollStudentId) return;
    const enrolled = enrollments
      .filter((e) => e.student_id === enrollStudentId)
      .map((e) => e.course_id);
    setEnrollCourseIds(enrolled);
  }, [enrollStudentId, enrollments]);

  React.useEffect(() => {
    if (!detailStudent) return;
    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailError(null);
        const [attRes, enRes] = await Promise.all([
          fetch(`/api/attendance?student_id=${detailStudent.id}`, { cache: "no-store" }),
          fetch(`/api/enrollments`, { cache: "no-store" }),
        ]);
        if (!attRes.ok) throw new Error(await attRes.text());
        if (!enRes.ok) throw new Error(await enRes.text());
        setDetailAttendance((await attRes.json()) as any[]);
        const allEnrollments = (await enRes.json()) as any[];
        setDetailEnrollments(allEnrollments.filter((e: any) => e.student_id === detailStudent.id));
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : "Failed to load details");
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
  }, [detailStudent]);

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
            <div className="flex rounded-md border border-slate-200 bg-white p-0.5">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
                className="px-3"
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                className="px-3"
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
            </div>
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
          {!loading && !error && viewMode === "grid" && (
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
                      <div className="text-xs text-slate-600">{s.email || "—"}</div>
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
                    {s.phone && <div className="text-slate-600">Phone: {s.phone}</div>}
                    {s.country && <div className="text-slate-600">Country: {s.country}</div>}
                    {s.phone && <div className="text-slate-600">Phone: {s.phone}</div>}
                    {s.country && <div className="text-slate-600">Country: {s.country}</div>}
                    {s.created_at && (
                      <div className="text-xs text-slate-500">
                        Added {new Date(s.created_at).toLocaleDateString()}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setDetailStudent(s);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditStudentId(s.id);
                          setEditStudentName(s.name);
                          setEditStudentEmail(s.email ?? "");
                          setEditStudentPhone(s.phone ?? "");
                          setEditStudentCountry(s.country ?? "");
                          setEditStudentError(null);
                          setOpenEditStudent(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          if (!confirm(`Delete student ${s.name}?`)) return;
                          await fetch(`/api/students/${s.id}`, { method: "DELETE" });
                          const tRes = await fetch("/api/students", { cache: "no-store" });
                          if (tRes.ok) setStudents((await tRes.json()) as Student[]);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
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
          {!loading && !error && viewMode === "list" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Phone</th>
                    <th className="py-2 pr-3">Country</th>
                    <th className="py-2 pr-3">Added</th>
                    <th className="py-2 pr-0 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="py-2 pr-3">{s.name}</td>
                      <td className="py-2 pr-3">{s.email || "—"}</td>
                      <td className="py-2 pr-3">{s.phone || "—"}</td>
                      <td className="py-2 pr-3">{s.country || "—"}</td>
                      <td className="py-2 pr-3">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 pr-0 text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setDetailStudent(s);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditStudentId(s.id);
                              setEditStudentName(s.name);
                              setEditStudentEmail(s.email ?? "");
                              setEditStudentError(null);
                              setOpenEditStudent(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              if (!confirm(`Delete student ${s.name}?`)) return;
                              await fetch(`/api/students/${s.id}`, { method: "DELETE" });
                              const tRes = await fetch("/api/students", { cache: "no-store" });
                              if (tRes.ok) setStudents((await tRes.json()) as Student[]);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                  <td className="py-6 text-center text-slate-500" colSpan={6}>
                    No students found. Use “Add Student” to get started.
                  </td>
                </tr>
              )}
                </tbody>
              </table>
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
              <Input
                placeholder="Phone (optional)"
                value={newStudentPhone}
                onChange={(e) => setNewStudentPhone(e.target.value)}
                name="student-phone"
                className="h-9"
              />
              <Input
                placeholder="Country (optional)"
                value={newStudentCountry}
                onChange={(e) => setNewStudentCountry(e.target.value)}
                name="student-country"
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
                      body: JSON.stringify({
                        name: newStudentName.trim(),
                        email: newStudentEmail || undefined,
                        phone: newStudentPhone || undefined,
                        country: newStudentCountry || undefined,
                      }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    setNewStudentName("");
                    setNewStudentEmail("");
                    setNewStudentPhone("");
                    setNewStudentCountry("");
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

              <div className="sm:col-span-2 rounded-md border border-slate-200 p-2">
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    placeholder="Search courses..."
                    value={enrollCourseSearch}
                    onChange={(e) => setEnrollCourseSearch(e.target.value)}
                    className="h-8"
                  />
                  <span className="text-xs text-slate-500">
                    {enrollCourseIds.length} selected
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {courses
                    .filter((c) => {
                      const q = enrollCourseSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        c.title.toLowerCase().includes(q) ||
                        (c.modality || "").toLowerCase().includes(q)
                      );
                    })
                    .map((c) => {
                      const checked = enrollCourseIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-2 rounded-md border px-2 py-1 text-sm ${
                            checked ? "border-fuchsia-200 bg-fuchsia-50" : "border-slate-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            onChange={() =>
                              setEnrollCourseIds((prev) =>
                                checked
                                  ? prev.filter((id) => id !== c.id)
                                  : [...prev, c.id]
                              )
                            }
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-800">{c.title}</div>
                            <div className="text-xs text-slate-500">
                              {c.modality === "group" ? "Group" : "1:1"}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  {!courses.length && (
                    <div className="text-sm text-slate-500">No courses available</div>
                  )}
                </div>
              </div>

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
                disabled={enrollSaving || !enrollStudentId || !enrollCourseIds.length}
                onClick={async () => {
                  try {
                    setEnrollSaving(true);
                    setEnrollError(null);
                    setEnrollSuccess(null);
                    const existing = enrollments
                      .filter((e) => e.student_id === enrollStudentId)
                      .map((e) => e.course_id);
                    const toCreate = enrollCourseIds.filter((id) => !existing.includes(id));

                    for (const cid of toCreate) {
                      const res = await fetch("/api/enrollments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          student_id: enrollStudentId,
                          course_id: cid,
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
                    }

                    // refresh enrollments
                    const eRes = await fetch("/api/enrollments", { cache: "no-store" });
                    if (eRes.ok) setEnrollments((await eRes.json()) as any[]);
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

      {openEditStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={() => setOpenEditStudent(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl border bg-white p-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Edit Student</h3>
              <button
                aria-label="Close"
                className="h-8 w-8 rounded-md hover:bg-slate-100"
                onClick={() => setOpenEditStudent(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Full name"
                value={editStudentName}
                onChange={(e) => setEditStudentName(e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="Email (optional)"
                value={editStudentEmail}
                onChange={(e) => setEditStudentEmail(e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="Phone (optional)"
                value={editStudentPhone}
                onChange={(e) => setEditStudentPhone(e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="Country (optional)"
                value={editStudentCountry}
                onChange={(e) => setEditStudentCountry(e.target.value)}
                className="h-9"
              />
              {editStudentError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editStudentError}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenEditStudent(false)}>
                Cancel
              </Button>
              <Button
                disabled={editStudentSaving || !editStudentName.trim()}
                onClick={async () => {
                  if (!editStudentId) return;
                  try {
                    setEditStudentSaving(true);
                    setEditStudentError(null);
                    const res = await fetch(`/api/students/${editStudentId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: editStudentName.trim(),
                        email: editStudentEmail.trim() || null,
                        phone: editStudentPhone.trim() || null,
                        country: editStudentCountry.trim() || null,
                      }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    const sRes = await fetch("/api/students", { cache: "no-store" });
                    if (sRes.ok) setStudents((await sRes.json()) as Student[]);
                    setOpenEditStudent(false);
                  } catch (err) {
                    setEditStudentError(err instanceof Error ? err.message : "Failed to update student");
                  } finally {
                    setEditStudentSaving(false);
                  }
                }}
              >
                {editStudentSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={() => setDetailStudent(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-3xl rounded-2xl border bg-white p-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-800">{detailStudent.name}</h3>
                <p className="text-xs text-slate-500">
                  {detailStudent.email || "No email"} • {detailStudent.country || "No country"}
                </p>
              </div>
              <button
                aria-label="Close"
                className="h-8 w-8 rounded-md hover:bg-slate-100"
                onClick={() => setDetailStudent(null)}
              >
                ✕
              </button>
            </div>

            {detailError && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {detailError}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-slate-700">
                  <div>Email: {detailStudent.email || "—"}</div>
                  <div>Phone: {detailStudent.phone || "—"}</div>
                  <div>Country: {detailStudent.country || "—"}</div>
                  <div>Joined: {detailStudent.created_at ? formatDateTime(detailStudent.created_at) : "—"}</div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Enrollments</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto pt-0">
                  {detailLoading ? (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-2 pr-3">Course</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2 pr-3">Enrolled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailEnrollments.map((en) => {
                          const course = courses.find((c) => c.id === en.course_id);
                          return (
                            <tr key={en.id} className="border-t">
                              <td className="py-2 pr-3">{course?.title || "—"}</td>
                              <td className="py-2 pr-3 capitalize">{en.status}</td>
                              <td className="py-2 pr-3">{en.enrolled_at ? formatDateTime(en.enrolled_at) : "—"}</td>
                            </tr>
                          );
                        })}
                        {!detailEnrollments.length && (
                          <tr>
                            <td className="py-4 text-center text-slate-500" colSpan={3}>
                              No enrollments
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Attendance</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto pt-0">
                {detailLoading ? (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-2 pr-3">Session</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Noted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailAttendance.map((a) => {
                        const sess = sessions.find((s) => s.id === a.session_id);
                        return (
                          <tr key={a.id} className="border-t">
                            <td className="py-2 pr-3">
                              {(sess?.title ?? "Session")} • {sess ? formatDateTime(sess.starts_at) : ""}
                            </td>
                            <td className="py-2 pr-3 capitalize">{a.status}</td>
                            <td className="py-2 pr-3">{formatDateTime(a.noted_at)}</td>
                          </tr>
                        );
                      })}
                      {!detailAttendance.length && (
                        <tr>
                          <td className="py-4 text-center text-slate-500" colSpan={3}>
                            No attendance yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
