// app/dashboard/courses/page.tsx
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
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Loader2 } from "lucide-react";

type Course = {
  id: string;
  title: string;
  description?: string | null;
  modality: "group" | "1on1";
  lead_teacher_id?: string | null;
  course_type?: string | null;
  duration_weeks?: number | null;
  sessions_per_week?: number | null;
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

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const defaultDaysFromCount = (count?: number | null) => {
  const order = [1, 3, 5, 2, 4, 0, 6]; // start with Mon/Wed/Fri pattern
  if (!count || count <= 0) return [];
  return order.slice(0, Math.min(count, 7));
};

export default function CoursesPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [openEditCourse, setOpenEditCourse] = React.useState(false);
  const [editCourseId, setEditCourseId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editModality, setEditModality] = React.useState<"group" | "1on1">("group");
  const [editLeadTeacher, setEditLeadTeacher] = React.useState<string | null>(null);
  const [editType, setEditType] = React.useState("");
  const [editDuration, setEditDuration] = React.useState("");
  const [editMeetingDays, setEditMeetingDays] = React.useState<number[]>([]);
  const [editMaxStudents, setEditMaxStudents] = React.useState("");
  const [editStartsAt, setEditStartsAt] = React.useState("");
  const [editEndsAt, setEditEndsAt] = React.useState("");
  const [courseSaving, setCourseSaving] = React.useState(false);
  const [courseError, setCourseError] = React.useState<string | null>(null);
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
  }, []);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

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

  const saveCourse = async () => {
    if (!editCourseId) return;
    setCourseSaving(true);
    setCourseError(null);
    try {
      const payload: any = {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        modality: editModality,
        lead_teacher_id: editLeadTeacher || null,
        course_type: editType.trim() || null,
        duration_weeks: editDuration ? Number(editDuration) : null,
        sessions_per_week: editMeetingDays.length ? editMeetingDays.length : null,
        meeting_days: editMeetingDays.length ? editMeetingDays : undefined,
        max_students: editMaxStudents ? Number(editMaxStudents) : null,
        starts_at: editStartsAt ? new Date(editStartsAt).toISOString() : null,
        ends_at: editEndsAt ? new Date(editEndsAt).toISOString() : null,
      };
      const res = await fetch(`/api/courses/${editCourseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text);
          setCourseError(parsed.error || parsed.message || "Failed to update course");
        } catch {
          setCourseError(text || "Failed to update course");
        }
        return;
      }
      setOpenEditCourse(false);
      await loadAll();
    } catch (err) {
      setCourseError(err instanceof Error ? err.message : "Unexpected error updating course");
    } finally {
      setCourseSaving(false);
    }
  };

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
                            {course.course_type && (
                              <Badge variant="outline" className="border-slate-200">
                                {course.course_type}
                              </Badge>
                            )}
                            {course.max_students ? (
                              <span>Cap: {course.max_students}</span>
                            ) : (
                              <span className="text-slate-500">No cap</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-slate-400" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditCourseId(course.id);
                              setEditTitle(course.title);
                              setEditDescription(course.description || "");
                              setEditModality(course.modality);
                              setEditLeadTeacher(course.lead_teacher_id || null);
                              setEditType(course.course_type || "");
                              setEditDuration(course.duration_weeks ? String(course.duration_weeks) : "");
                              setEditMeetingDays(
                                defaultDaysFromCount(course.sessions_per_week || 0)
                              );
                              setEditMaxStudents(course.max_students ? String(course.max_students) : "");
                              setEditStartsAt(toLocalInput(course.starts_at));
                              setEditEndsAt(toLocalInput(course.ends_at));
                              setCourseError(null);
                              setOpenEditCourse(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              if (!confirm(`Delete course ${course.title}?`)) return;
                              await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
                              await loadAll();
                            }}
                          >
                            Delete
                          </Button>
                        </div>
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
                        {course.duration_weeks && (
                          <span className="text-slate-500">{course.duration_weeks} weeks</span>
                        )}
                        {course.sessions_per_week && (
                          <span className="text-slate-500">{course.sessions_per_week} sessions/week</span>
                        )}
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
                  <th className="py-2 pr-0 text-right">Actions</th>
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
                {!enrollments.length && (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={6}>
                      No enrollments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {openEditCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={() => setOpenEditCourse(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-3xl rounded-2xl border bg-white p-4 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Edit Course</h3>
              <button
                aria-label="Close"
                className="h-8 w-8 rounded-md hover:bg-slate-100"
                onClick={() => setOpenEditCourse(false)}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                placeholder="Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-9 sm:col-span-2"
              />
              <Input
                placeholder="Description (optional)"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="h-9 sm:col-span-2"
              />
              <Select value={editModality} onValueChange={(v) => setEditModality(v as "group" | "1on1")}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Modality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="1on1">1 on 1</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={editLeadTeacher || ""}
                onValueChange={(v) => setEditLeadTeacher(v || null)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Lead teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Type (e.g., Cohort, Workshop)"
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                className="h-9 sm:col-span-2"
              />
              <Input
                placeholder="Duration (weeks)"
                inputMode="numeric"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="h-9"
              />
              <div className="sm:col-span-2">
                <div className="text-xs font-medium text-slate-700 mb-1">Days of the week</div>
                <div className="flex flex-wrap gap-2">
                  {dayLabels.map((label, idx) => {
                    const checked = editMeetingDays.includes(idx);
                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${
                          checked ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700" : "border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={() =>
                            setEditMeetingDays((prev) =>
                              checked
                                ? prev.filter((d) => d !== idx)
                                : [...prev, idx].sort((a, b) => a - b)
                            )
                          }
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>
              <Input
                placeholder="Max students"
                inputMode="numeric"
                value={editMaxStudents}
                onChange={(e) => setEditMaxStudents(e.target.value)}
                className="h-9"
              />
              <Input
                type="datetime-local"
                value={editStartsAt}
                onChange={(e) => setEditStartsAt(e.target.value)}
                className="h-9"
              />
              <Input
                type="datetime-local"
                value={editEndsAt}
                onChange={(e) => setEditEndsAt(e.target.value)}
                className="h-9"
              />
            </div>

            {courseError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {courseError}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenEditCourse(false)}>
                Cancel
              </Button>
              <Button onClick={saveCourse} disabled={!editTitle.trim() || courseSaving}>
                {courseSaving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}

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
                value={editEnrollTeacher || ""}
                onValueChange={(v) => setEditEnrollTeacher(v || null)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Assign teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
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
