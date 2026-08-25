// apps/web/src/app/api/cron/backup-intelligence/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runIntelligenceBackup } from "@/lib/intelligence-backup";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIntelligenceBackup();
    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[BackupIntelligence] Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}