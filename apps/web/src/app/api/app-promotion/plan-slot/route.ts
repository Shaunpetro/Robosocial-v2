// apps/web/src/app/api/app-promotion/plan-slot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { planSlot } from "@/lib/app-promotion/publish";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { slotIndex?: number; force?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    /* allow empty body */
  }

  const slotIndex = (body.slotIndex ?? 1) as 1 | 2 | 3;
  if (![1, 2, 3].includes(slotIndex)) {
    return NextResponse.json(
      { error: "slotIndex must be 1, 2, or 3" },
      { status: 400 }
    );
  }

  const force = body.force === true;

  try {
    const result = await planSlot(slotIndex, { force });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[App Promotion] plan-slot failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}