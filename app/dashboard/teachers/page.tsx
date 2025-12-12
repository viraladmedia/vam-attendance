// app/dashboard/teachers/page.tsx
"use client";

import * as React from "react";
import { TopBar } from "@/components/dashboard/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/teachers", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Teacher[];
        setTeachers(data);
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
            <Button disabled variant="secondary">
              + Add Teacher
            </Button>
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
    </div>
  );
}
