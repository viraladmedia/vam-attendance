import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRouteContext } from "@/lib/api/supabase";
import { logAudit } from "@/lib/api/audit";
import { consumeRateLimit } from "@/lib/api/rate-limit";

const attendanceSchema = z.object({
  session_id: z.string().uuid(),
  student_id: z.string().uuid(),
  status: z.enum(["present", "absent", "late"]),
  notes: z.string().optional(),
});

function handleError(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
  }
  if (error instanceof Error) {
    if (error.message === "unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "org_not_set") {
      return NextResponse.json({ error: "Organization not set on user" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, orgId } = await getRouteContext();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const studentId = searchParams.get("student_id");

    let query = supabase
      .from("attendance")
      .select("*")
      .eq("org_id", orgId)
      .order("noted_at", { ascending: false });

    if (sessionId) query = query.eq("session_id", sessionId);
    if (studentId) query = query.eq("student_id", studentId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rate = consumeRateLimit(`attendance:post:${ip}`, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rate.reset - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const payload = attendanceSchema.parse(body);
    const { supabase, session, orgId } = await getRouteContext();

    const { data, error } = await supabase
      .from("attendance")
      .insert([{ ...payload, org_id: orgId }])
      .select()
      .single();

    if (error) throw error;
    await logAudit(supabase, orgId, session.user.id, "create", "attendance", data.id, {
      session_id: data.session_id,
      student_id: data.student_id,
      status: data.status,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
