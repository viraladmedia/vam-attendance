import { NextResponse } from "next/server";
import { z } from "zod";
import { getRouteContext } from "@/lib/api/supabase";
import { logAudit } from "@/lib/api/audit";
import { consumeRateLimit } from "@/lib/api/rate-limit";
import { respondWithError } from "@/lib/api/errors";

const courseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  modality: z.enum(["group", "1on1"]),
  lead_teacher_id: z.string().uuid().optional().nullable(),
  course_type: z.string().optional(),
  duration_weeks: z.number().int().positive().optional(),
  sessions_per_week: z.number().int().positive().optional(),
  max_students: z.number().int().positive().optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
});

export async function GET() {
  try {
    const { supabase, orgId } = await getRouteContext();
    const { data, error } = await supabase
      .from("courses")
      .select("*, lead_teacher_id")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    return respondWithError(error, { action: "list-courses" });
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rate = consumeRateLimit(`courses:post:${ip}`, 30);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rate.reset - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const payload = courseSchema.parse(body);
    const { supabase, session, orgId } = await getRouteContext();
    const { data, error } = await supabase
      .from("courses")
      .insert([{ ...payload, org_id: orgId }])
      .select()
      .single();
    if (error) throw error;

    const sessionStartsAt = payload.starts_at ?? new Date().toISOString();
    const { error: sessionError } = await supabase
      .from("sessions")
      .insert([
        {
          org_id: orgId,
          course_id: data.id,
          teacher_id: payload.lead_teacher_id ?? null,
          title: payload.title ? `${payload.title} • Session 1` : "Session 1",
          starts_at: sessionStartsAt,
          class_name: payload.course_type ?? null,
          description: payload.description ?? null,
        },
      ])
      .select("id")
      .single();
    if (sessionError) throw sessionError;

    await logAudit(supabase, orgId, session.user.id, "create", "course", data.id, { title: data.title });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return respondWithError(error, { action: "create-course" });
  }
}
