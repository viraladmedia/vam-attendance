import { NextResponse } from "next/server";
import { z } from "zod";
import { getRouteContext } from "@/lib/api/supabase";
import { logAudit } from "@/lib/api/audit";
import { consumeRateLimit } from "@/lib/api/rate-limit";

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

function handleError(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
  }
  if (error instanceof Error) {
    if (error.message === "unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "org_not_set") return NextResponse.json({ error: "Organization not set" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}

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
    return handleError(error);
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
    await logAudit(supabase, orgId, session.user.id, "create", "course", data.id, { title: data.title });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
