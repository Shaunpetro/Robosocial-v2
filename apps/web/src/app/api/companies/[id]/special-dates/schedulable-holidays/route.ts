// apps/web/src/app/api/companies/[id]/special-dates/schedulable-holidays/route.ts
// Returns every holiday in the current schedulable window that isn't already
// scheduled for this company. Used by the "Schedule individual holidays" card.

import { NextRequest, NextResponse } from "next/server";
import { checkCompanyAccess } from "@/lib/access";
import { getSchedulableHolidays } from "@/lib/special-dates/scheduler";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  const access = await checkCompanyAccess(companyId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const data = await getSchedulableHolidays(companyId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[schedulable-holidays] failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load holidays" },
      { status: 500 }
    );
  }
}