import { NextResponse } from "next/server";
import { z } from "zod";
import { getRouteContext } from "@/lib/api/supabase";
import { logAudit } from "@/lib/api/audit";
import { consumeRateLimit } from "@/lib/api/rate-limit";

const enrollmentSchema = z.object({
  student_id: z.string().uuid(),
  course_id: z.string().uuid(),
  teacher_id: z.string().uuid().optional().nullable(),
  status: z.enum(["active", "paused", "completed", "dropped"]).optional(),
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
      .from("enrollments")
      .select("*, student_id, course_id, teacher_id")
      .eq("org_id", orgId)
      .order("enrolled_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rate = consumeRateLimit(`enrollments:post:${ip}`, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rate.reset - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const payload = enrollmentSchema.parse(body);
    const { supabase, session, orgId } = await getRouteContext();
    const { data, error } = await supabase
      .from("enrollments")
      .insert([{ ...payload, org_id: orgId }])
      .select()
      .single();
    if (error) throw error;
    await logAudit(supabase, orgId, session.user.id, "create", "enrollment", data.id, {
      student_id: data.student_id,
      course_id: data.course_id,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
