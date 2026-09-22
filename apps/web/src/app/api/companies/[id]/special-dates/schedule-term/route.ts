// apps/web/src/app/api/companies/[id]/special-dates/schedule-term/route.ts

import { NextRequest, NextResponse } from "next/server";
import { checkCompanyAccess } from "@/lib/access";
import { commitHolidayToTerm } from "@/lib/special-dates/scheduler";

export const runtime = "nodejs";

interface ScheduleTermBody {
  termId: string;
  holidayName: string;
  holidayIsoDate: string;
  holidayDescription: string;
  holidayTone: string;
  setId: string;
  isFinalHoliday?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  const access = await checkCompanyAccess(companyId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body: ScheduleTermBody = await request.json().catch(() => ({} as ScheduleTermBody));

  if (
    !body.termId ||
    !body.holidayName ||
    !body.holidayIsoDate ||
    !body.holidayDescription ||
    !body.setId
  ) {
    return NextResponse.json(
      {
        error:
          "termId, holidayName, holidayIsoDate, holidayDescription, and setId are required",
      },
      { status: 400 }
    );
  }

  try {
    const result = await commitHolidayToTerm({
      companyId,
      termId: body.termId,
      holidayName: body.holidayName,
      holidayIsoDate: body.holidayIsoDate,
      holidayDescription: body.holidayDescription,
      holidayTone: body.holidayTone || "warm",
      setId: body.setId,
      isFinalHoliday: body.isFinalHoliday,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[schedule-term] failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduling failed" },
      { status: 500 }
    );
  }
}