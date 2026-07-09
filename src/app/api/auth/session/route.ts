import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail, SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from "@/lib/auth";
import { getAdminAuth } from "@/lib/firebaseAdmin";

// Exchanges a client-side Firebase ID token (from Google sign-in) for an
// httpOnly session cookie, after checking the email against ADMIN_EMAILS.
export async function POST(request: NextRequest) {
  const { idToken } = await request.json();
  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid idToken" }, { status: 401 });
  }

  if (!isAdminEmail(decoded.email)) {
    return NextResponse.json({ error: "Not an admin" }, { status: 403 });
  }

  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });

  return NextResponse.json({ ok: true });
}
