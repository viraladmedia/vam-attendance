// app/dashboard/teachers/page.client.tsx
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
import { Users, Mail, Loader2 } from "lucide-react";

type Teacher = {
  id: string;
  name: string;
  email: string;
  department?: string | null;
  phone?: string | null;
  created_at?: string | null;
};
type Student = { id: string; name: string };

export default function TeachersPage() {
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [openCourse, setOpenCourse] = React.useState(false);
  const [courseTitle, setCourseTitle] = React.useState("");
  const [courseModality, setCourseModality] = React.useState<"group" | "1on1">("group");
  const [courseLeadTeacher, setCourseLeadTeacher] = React.useState<string>("");
  const [courseMaxStudents, setCourseMaxStudents] = React.useState<string>("");
  const [courseType, setCourseType] = React.useState("");
  const [courseDuration, setCourseDuration] = React.useState("");
  const [courseMeetingDays, setCourseMeetingDays] = React.useState<number[]>([]);
  const [courseStartsAt, setCourseStartsAt] = React.useState("");
  const [courseSaving, setCourseSaving] = React.useState(false);
  const [courseError, setCourseError] = React.useState<string | null>(null);
  const [courseSuccess, setCourseSuccess] = React.useState<string | null>(null);
  const [courseStudentSearch, setCourseStudentSearch] = React.useState("");
  const [courseSelectedStudents, setCourseSelectedStudents] = React.useState<string[]>([]);
  const [openTeacherModal, setOpenTeacherModal] = React.useState(false);
  const [newTeacherName, setNewTeacherName] = React.useState("");
  const [newTeacherEmail, setNewTeacherEmail] = React.useState("");
  const [teacherSaving, setTeacherSaving] = React.useState(false);
  const [teacherError, setTeacherError] = React.useState<string | null>(null);
  const [openEditTeacher, setOpenEditTeacher] = React.useState(false);
  const [editTeacherId, setEditTeacherId] = React.useState<string | null>(null);
  const [editTeacherName, setEditTeacherName] = React.useState("");
  const [editTeacherEmail, setEditTeacherEmail] = React.useState("");
  const [editTeacherSaving, setEditTeacherSaving] = React.useState(false);
  const [editTeacherError, setEditTeacherError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [tRes, sRes] = await Promise.all([
          fetch("/api/teachers", { cache: "no-store" }),
          fetch("/api/students", { cache: "no-store" }),
        ]);
        if (!tRes.ok) throw new Error(await tRes.text());
        if (!sRes.ok) throw new Error(await sRes.text());
        const data = (await tRes.json()) as Teacher[];
        const sData = (await sRes.json()) as Student[];
        setTeachers(data);
        setStudents(sData);
        if (!courseLeadTeacher && data.length > 0) {
          setCourseLeadTeacher(data[0].id);
        }
        if (!courseSelectedStudents.length && sData.length) {
          setCourseSelectedStudents([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load teachers");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = teachers.filter((t) =>
    [t.name, t.email, t.department, t.phone]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <TopBar title="Teachers" subtitle="Manage your team" showAccountInTitle={false} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Teacher Directory</CardTitle>
            <p className="text-sm text-slate-600">View all instructors in your organization.</p>
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
              placeholder="Search teachers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-56"
            />
            <Button variant="secondary" onClick={() => setOpenCourse(true)}>
              + Add Course
            </Button>
            <Button onClick={() => setOpenTeacherModal(true)}>+ Add Teacher</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading teachers...
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {!loading && !error && viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-fuchsia-100 text-fuchsia-700 flex items-center justify=center font-semibold">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-600">{t.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 space-y-1">
                    <p>Department: {t.department ?? "—"}</p>
                    <p>Phone: {t.phone ?? "—"}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Contact
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditTeacherId(t.id);
                        setEditTeacherName(t.name);
                        setEditTeacherEmail(t.email);
                        setOpenEditTeacher(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
              {!filtered.length && (
                <div className="col-span-full rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-600">
                  No teachers yet. Add a teacher to get started.
                </div>
              )}
            </div>
          )}

          {!loading && !error && viewMode === "list" && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Department</th>
                  <th className="py-2 pr-3">Phone</th>
                  <th className="py-2 pr-0 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="py-2 pr-3">{t.name}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span>{t.email}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3">{t.department ?? "—"}</td>
                    <td className="py-2 pr-3">{t.phone ?? "—"}</td>
                    <td className="py-2 pr-0 text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditTeacherId(t.id);
                            setEditTeacherName(t.name);
                            setEditTeacherEmail(t.email);
                            setOpenEditTeacher(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            if (!confirm(`Delete teacher ${t.name}?`)) return;
                            await fetch(`/api/teachers/${t.id}`, { method: "DELETE" });
                            const tRes = await fetch("/api/teachers", { cache: "no-store" });
                            if (tRes.ok) setTeachers((await tRes.json()) as Teacher[]);
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
                    <td className="py-6 text-center text-slate-500" colSpan={5}>
                      No teachers yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {openCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={() => setOpenCourse(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl rounded-2xl border bg-white p-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Add Course</h3>
              <button
                aria-label="Close"
                className="h-8 w-8 rounded-md hover:bg-slate-100"
                onClick={() => setOpenCourse(false)}
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                placeholder="Course title"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="h-9 sm:col-span-2"
              />
              <Select
                value={courseModality}
                onValueChange={(v: "group" | "1on1") => setCourseModality(v)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Modality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="1on1">1-on-1</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={courseLeadTeacher}
                onValueChange={setCourseLeadTeacher}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Lead teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Course type"
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="Duration (weeks)"
                inputMode="numeric"
                value={courseDuration}
                onChange={(e) => setCourseDuration(e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="Sessions / week"
                inputMode="numeric"
                value={courseMeetingDays.length ? courseMeetingDays.length.toString() : ""}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  const order = [1, 3, 5, 2, 4, 0, 6];
                  setCourseMeetingDays(order.slice(0, Math.min(val, 7)));
                }}
                className="h-9"
              />
              <Input
                placeholder="Max students"
                inputMode="numeric"
                value={courseMaxStudents}
                onChange={(e) => setCourseMaxStudents(e.target.value)}
                className="h-9"
              />
              <Input
                type="datetime-local"
                value={courseStartsAt}
                onChange={(e) => setCourseStartsAt(e.target.value)}
                className="h-9 sm:col-span-2"
              />
              <Input
                placeholder="Search students to add"
                value={courseStudentSearch}
                onChange={(e) => setCourseStudentSearch(e.target.value)}
                className="h-9 sm:col-span-2"
              />
              <div className="sm:col-span-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto rounded-md border border-slate-200 p-2">
                {students
                  .filter((s) =>
                    courseStudentSearch
                      ? s.name.toLowerCase().includes(courseStudentSearch.toLowerCase())
                      : true
                  )
                  .map((s) => {
                    const selected = courseSelectedStudents.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setCourseSelectedStudents((prev) =>
                            selected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`flex items=center gap-1 rounded-full border px-2 py-1 text-xs ${
                          selected
                            ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
              </div>
            </div>
            {courseError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {courseError}
              </div>
            )}
            {courseSuccess && (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {courseSuccess}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenCourse(false)}>
                Cancel
              </Button>
              <Button
                disabled={courseSaving || !courseTitle.trim()}
                onClick={async () => {
                  try {
                    setCourseSaving(true);
                    setCourseError(null);
                    setCourseSuccess(null);
                    const payload: any = {
                      title: courseTitle.trim(),
                      modality: courseModality,
                      lead_teacher_id: courseLeadTeacher || null,
                      course_type: courseType.trim() || null,
                      duration_weeks: courseDuration ? Number(courseDuration) : null,
                      sessions_per_week: courseMeetingDays.length ? courseMeetingDays.length : null,
                      meeting_days: courseMeetingDays.length ? courseMeetingDays : undefined,
                      max_students: courseMaxStudents ? Number(courseMaxStudents) : null,
                      starts_at: courseStartsAt ? new Date(courseStartsAt).toISOString() : null,
                    };
                    const res = await fetch("/api/courses", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    setCourseSuccess("Course created");
                    setCourseTitle("");
                    setCourseType("");
                    setCourseDuration("");
                    setCourseMeetingDays([]);
                    setCourseMaxStudents("");
                    setCourseStartsAt("");
                    setCourseSelectedStudents([]);
                  } catch (err) {
                    setCourseError(err instanceof Error ? err.message : "Failed to create course");
                  } finally {
                    setCourseSaving(false);
                  }
                }}
              >
                {courseSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {openTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={() => setOpenTeacherModal(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl border bg-white p-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Add Teacher</h3>
              <button
                aria-label="Close"
                className="h-8 w-8 rounded-md hover:bg-slate-100"
                onClick={() => setOpenTeacherModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Full name"
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="Email"
                value={newTeacherEmail}
                onChange={(e) => setNewTeacherEmail(e.target.value)}
                className="h-9"
              />
              {teacherError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {teacherError}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenTeacherModal(false)}>
                Cancel
              </Button>
              <Button
                disabled={teacherSaving || !newTeacherName.trim()}
                onClick={async () => {
                  try {
                    setTeacherSaving(true);
                    setTeacherError(null);
                    const res = await fetch("/api/teachers", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: newTeacherName.trim(),
                        email: newTeacherEmail.trim() || null,
                      }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    setNewTeacherName("");
                    setNewTeacherEmail("");
                    setOpenTeacherModal(false);
                    const tRes = await fetch("/api/teachers", { cache: "no-store" });
                    if (tRes.ok) setTeachers((await tRes.json()) as Teacher[]);
                  } catch (err) {
                    setTeacherError(err instanceof Error ? err.message : "Failed to create teacher");
                  } finally {
                    setTeacherSaving(false);
                  }
                }}
              >
                {teacherSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {openEditTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={() => setOpenEditTeacher(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl border bg-white p-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Edit Teacher</h3>
              <button
                aria-label="Close"
                className="h-8 w-8 rounded-md hover:bg-slate-100"
                onClick={() => setOpenEditTeacher(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Full name"
                value={editTeacherName}
                onChange={(e) => setEditTeacherName(e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="Email"
                value={editTeacherEmail}
                onChange={(e) => setEditTeacherEmail(e.target.value)}
                className="h-9"
              />
              {editTeacherError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editTeacherError}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenEditTeacher(false)}>
                Cancel
              </Button>
              <Button
                disabled={!editTeacherId || editTeacherSaving}
                onClick={async () => {
                  if (!editTeacherId) return;
                  try {
                    setEditTeacherSaving(true);
                    setEditTeacherError(null);
                    const res = await fetch(`/api/teachers/${editTeacherId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: editTeacherName.trim(),
                        email: editTeacherEmail.trim() || null,
                      }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    setOpenEditTeacher(false);
                    const tRes = await fetch("/api/teachers", { cache: "no-store" });
                    if (tRes.ok) setTeachers((await tRes.json()) as Teacher[]);
                  } catch (err) {
                    setEditTeacherError(err instanceof Error ? err.message : "Failed to update teacher");
                  } finally {
                    setEditTeacherSaving(false);
                  }
                }}
              >
                {editTeacherSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
