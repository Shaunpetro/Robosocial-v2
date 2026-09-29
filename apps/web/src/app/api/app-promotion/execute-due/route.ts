// apps/web/src/app/api/app-promotion/execute-due/route.ts
import { NextRequest, NextResponse } from "next/server";
import { executeDue } from "@/lib/app-promotion/publish";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await executeDue();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[App Promotion] execute-due failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}