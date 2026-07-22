// apps/web/src/app/api/cron/keep-warm/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // This endpoint does nothing – it just forces Vercel to keep the function instance alive
  return NextResponse.json({ ok: true, timestamp: Date.now() });
}