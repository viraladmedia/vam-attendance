// app/dashboard/teachers/page.tsx
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

export default function TeachersPage() {
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
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
        const res = await fetch("/api/teachers", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Teacher[];
        setTeachers(data);
        if (!courseLeadTeacher && data.length > 0) {
          setCourseLeadTeacher(data[0].id);
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
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center font-semibold">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-600">{t.department || "General"}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <a className="hover:underline" href={`mailto:${t.email}`}>
                        {t.email}
                      </a>
                    </div>
                    {t.phone && <div className="text-slate-600">{t.phone}</div>}
                    {t.created_at && (
                      <div className="text-xs text-slate-500">
                        Added {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditTeacherId(t.id);
                          setEditTeacherName(t.name);
                          setEditTeacherEmail(t.email);
                          setEditTeacherError(null);
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
                  </div>
                </div>
              ))}
              {!filtered.length && (
                <div className="col-span-full rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-center text-slate-600">
                  No teachers found. Use “Add Teacher” to get started.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
                disabled={teacherSaving || !newTeacherName.trim() || !newTeacherEmail.trim()}
                onClick={async () => {
                  try {
                    setTeacherSaving(true);
                    setTeacherError(null);
                    const res = await fetch("/api/teachers", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: newTeacherName.trim(), email: newTeacherEmail.trim() }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    setNewTeacherName("");
                    setNewTeacherEmail("");
                    setOpenTeacherModal(false);
                    // refresh list
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

      {openCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={() => setOpenCourse(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg rounded-2xl border bg-white p-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Add Course / Program</h3>
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
                placeholder="Title"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="h-9 sm:col-span-2"
              />
              <Input
                placeholder="Type (e.g., Cohort, Workshop)"
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                className="h-9 sm:col-span-2"
              />
              <Select value={courseModality} onValueChange={(v) => setCourseModality(v as "group" | "1on1")}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Modality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="1on1">1 on 1</SelectItem>
                </SelectContent>
              </Select>
              <Select value={courseLeadTeacher} onValueChange={setCourseLeadTeacher}>
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
                placeholder="Max students (optional)"
                inputMode="numeric"
                value={courseMaxStudents}
                onChange={(e) => setCourseMaxStudents(e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="Duration (weeks)"
                inputMode="numeric"
                value={courseDuration}
                onChange={(e) => setCourseDuration(e.target.value)}
                className="h-9"
              />
              <div className="sm:col-span-2">
                <div className="text-xs font-medium text-slate-700 mb-1">Days of the week</div>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const checked = courseMeetingDays.includes(d);
                    return (
                      <label
                        key={d}
                        className={`flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${
                          checked ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700" : "border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={() =>
                            setCourseMeetingDays((prev) =>
                              checked
                                ? prev.filter((v) => v !== d)
                                : [...prev, d].sort((a, b) => a - b)
                            )
                          }
                        />
                        {labels[d]}
                      </label>
                    );
                  })}
                </div>
              </div>
              <Input
                type="datetime-local"
                value={courseStartsAt}
                onChange={(e) => setCourseStartsAt(e.target.value)}
                className="h-9 sm:col-span-2"
              />
            </div>

            {courseSuccess && (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {courseSuccess}
              </div>
            )}
            {courseError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {courseError}
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
                    };
                    if (courseMaxStudents) payload.max_students = Number(courseMaxStudents);
                    if (courseType) payload.course_type = courseType.trim();
                    if (courseDuration) payload.duration_weeks = Number(courseDuration);
                    if (courseMeetingDays.length) {
                      payload.sessions_per_week = courseMeetingDays.length;
                      payload.meeting_days = courseMeetingDays;
                    }
                    if (courseStartsAt) payload.starts_at = new Date(courseStartsAt).toISOString();
                    const res = await fetch("/api/courses", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    setCourseSuccess("Course created");
                    setCourseTitle("");
                    setCourseMaxStudents("");
                    setCourseType("");
                    setCourseDuration("");
                    setCourseMeetingDays([]);
                    setCourseStartsAt("");
                    setOpenCourse(false);
                  } catch (err) {
                    setCourseError(err instanceof Error ? err.message : "Failed to create course");
                  } finally {
                    setCourseSaving(false);
                  }
                }}
              >
                {courseSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Course"}
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
                disabled={editTeacherSaving || !editTeacherName.trim() || !editTeacherEmail.trim()}
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
                        email: editTeacherEmail.trim(),
                      }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    const tRes = await fetch("/api/teachers", { cache: "no-store" });
                    if (tRes.ok) setTeachers((await tRes.json()) as Teacher[]);
                    setOpenEditTeacher(false);
                  } catch (err) {
                    setEditTeacherError(err instanceof Error ? err.message : "Failed to update teacher");
                  } finally {
                    setEditTeacherSaving(false);
                  }
                }}
              >
                {editTeacherSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
