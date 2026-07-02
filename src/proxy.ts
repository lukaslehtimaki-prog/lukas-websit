import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed "Middleware" to "Proxy". This runs before requests are completed and
// is used here only to refresh the Supabase session cookie and do a cheap redirect guard.
// Authoritative auth checks live in the dashboard layout and in each Server Action.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static asset files.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
