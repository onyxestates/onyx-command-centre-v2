import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "onyx_session";
const SESSION_MAX_AGE_MS = Number(process.env.SESSION_COOKIE_MAX_AGE_DAYS ?? 5) * 24 * 60 * 60 * 1000;
const RECENT_AUTH_WINDOW_SECONDS = 5 * 60;

export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    maxAgeMs: SESSION_MAX_AGE_MS,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
    },
  };
}

export async function createServerSession(idToken: string, existingSessionCookie?: string | null) {
  const auth = getFirebaseAdminAuth();
  if (!auth) {
    throw new Error("Firebase Admin credentials are not configured for server-side sessions.");
  }

  const decoded = await auth.verifyIdToken(idToken);
  const authAgeSeconds = Math.floor(Date.now() / 1000) - decoded.auth_time;

  if (authAgeSeconds > RECENT_AUTH_WINDOW_SECONDS) {
    const existingSession = await verifyServerSession(existingSessionCookie);
    if (!existingSession || existingSession.uid !== decoded.uid) {
      throw new Error("Recent authentication required before creating a secure session.");
    }
  }

  const { maxAgeMs } = getSessionCookieOptions();
  return auth.createSessionCookie(idToken, { expiresIn: maxAgeMs });
}

export async function verifyServerSession(sessionCookie?: string | null) {
  if (!sessionCookie) return null;
  const auth = getFirebaseAdminAuth();
  if (!auth) return null;

  try {
    return await auth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifyServerSession(sessionCookie);
}

export function appendSessionCookie(response: NextResponse, sessionCookie: string) {
  const { name, cookie } = getSessionCookieOptions();
  response.cookies.set(name, sessionCookie, cookie);
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  const { name, cookie } = getSessionCookieOptions();
  response.cookies.set(name, "", { ...cookie, maxAge: 0 });
  return response;
}

export function readSessionCookieFromRequest(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}
