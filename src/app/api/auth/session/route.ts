import { NextResponse } from "next/server";
import {
  appendSessionCookie,
  clearSessionCookie,
  createServerSession,
  readSessionCookieFromRequest,
  verifyServerSession,
} from "@/lib/auth/session";
import { logError, logInfo } from "@/lib/monitoring/logger";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  try {
    const session = await verifyServerSession(readSessionCookieFromRequest(request as never));
    if (!session) {
      const response = NextResponse.json({ ok: false, authenticated: false }, { status: 401, headers: noStoreHeaders });
      return clearSessionCookie(response);
    }

    return NextResponse.json({ ok: true, authenticated: true, uid: session.uid }, { headers: noStoreHeaders });
  } catch (error) {
    logError("Unable to verify server session cookie", error);
    const response = NextResponse.json({ ok: false, authenticated: false }, { status: 401, headers: noStoreHeaders });
    return clearSessionCookie(response);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: string };
    if (!body.idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400, headers: noStoreHeaders });
    }

    const existingSessionCookie = readSessionCookieFromRequest(request as never);
    const sessionCookie = await createServerSession(body.idToken, existingSessionCookie);
    const response = NextResponse.json({ ok: true }, { headers: noStoreHeaders });
    logInfo("Server session cookie issued");
    return appendSessionCookie(response, sessionCookie);
  } catch (error) {
    logError("Unable to create server session cookie", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create session cookie." },
      { status: 401, headers: noStoreHeaders }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { headers: noStoreHeaders });
  logInfo("Server session cookie cleared");
  return clearSessionCookie(response);
}
