// apps/web/src/app/api/companies/[id]/special-dates/schedule-holiday/route.ts
// Schedules ONE holiday (manual path). Does not touch lastScheduledTermId.
// Used when the term runway is too short for full-term scheduling, or when
// the user wants to handle a specific holiday without committing the term.

import { NextRequest, NextResponse } from "next/server";
import { checkCompanyAccess } from "@/lib/access";
import { scheduleHoliday } from "@/lib/special-dates/scheduler";

export const runtime = "nodejs";

interface ScheduleHolidayBody {
  holidayName: string;
  holidayIsoDate: string;
  holidayDescription: string;
  holidayTone: string;
  setId: string;
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

  const body: ScheduleHolidayBody = await request
    .json()
    .catch(() => ({} as ScheduleHolidayBody));

  if (
    !body.holidayName ||
    !body.holidayIsoDate ||
    !body.holidayDescription ||
    !body.setId
  ) {
    return NextResponse.json(
      {
        error:
          "holidayName, holidayIsoDate, holidayDescription, and setId are required",
      },
      { status: 400 }
    );
  }

  try {
    const result = await scheduleHoliday({
      companyId,
      holidayName: body.holidayName,
      holidayIsoDate: body.holidayIsoDate,
      holidayDescription: body.holidayDescription,
      holidayTone: body.holidayTone || "warm",
      setId: body.setId,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[schedule-holiday] failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduling failed" },
      { status: 500 }
    );
  }
}