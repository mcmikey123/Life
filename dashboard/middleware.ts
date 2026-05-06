import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Basic auth gate. Set DASHBOARD_PASSWORD in Vercel env to enable.
// If unset, the dashboard is open (useful for local dev).

const REALM = 'Basic realm="Life", charset="UTF-8"';

export function middleware(req: NextRequest) {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(":");
    const password = idx >= 0 ? decoded.slice(idx + 1) : decoded;
    if (password === expected) return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": REALM },
  });
}

export const config = {
  // Apply to everything except static assets and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
