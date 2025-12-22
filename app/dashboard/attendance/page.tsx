export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import NextDynamic from "next/dynamic";

const AttendanceClient = NextDynamic(() => import("./page.client"), {
  ssr: false,
  loading: () => null,
});

export default function AttendancePage() {
  return <AttendanceClient />;
}
