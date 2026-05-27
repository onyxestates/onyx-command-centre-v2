import { NextResponse } from "next/server";
import { logInfo } from "@/lib/monitoring/logger";

export function GET() {
  logInfo("Health endpoint checked");
  return NextResponse.json(
    {
      ok: true,
      service: "onyx-command-centre",
      timestamp: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
