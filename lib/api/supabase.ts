import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

export type RouteContext = {
  supabase: SupabaseClient;
  session: Session;
  orgId: string;
};

export async function getRouteContext(): Promise<RouteContext> {
  const cookieStore = await cookies();
  const cookieOrg = cookieStore.get("vam_active_org")?.value || null;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("unauthorized");
  }

  const meta = session.user.app_metadata || {};
  const userMeta = session.user.user_metadata || {};
  const orgId = (meta as any).org_id || (userMeta as any).default_org_id || cookieOrg;
  if (!orgId) {
    throw new Error("org_not_set");
  }

  return { supabase, session, orgId: String(orgId) };
}
