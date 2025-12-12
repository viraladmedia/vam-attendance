import { NextResponse } from "next/server";
import { z } from "zod";
import { getRouteContext } from "@/lib/api/supabase";
import { logAudit } from "@/lib/api/audit";

const updateSchema = z.object({
  teacher_id: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  class_name: z.string().optional(),
  description: z.string().optional(),
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

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, orgId } = await getRouteContext();
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", params.id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const payload = updateSchema.parse(body);
    const { supabase, session, orgId } = await getRouteContext();

    const { data, error } = await supabase
      .from("sessions")
      .update(payload)
      .eq("org_id", orgId)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    await logAudit(supabase, orgId, session.user.id, "update", "session", params.id, payload);
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, session, orgId } = await getRouteContext();
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("org_id", orgId)
      .eq("id", params.id);

    if (error) throw error;
    await logAudit(supabase, orgId, session.user.id, "delete", "session", params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
