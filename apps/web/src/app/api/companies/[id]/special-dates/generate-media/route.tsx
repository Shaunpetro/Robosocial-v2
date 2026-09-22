// apps/web/src/app/api/companies/[id]/special-dates/generate-media/route.tsx

import { NextRequest, NextResponse } from "next/server";
import {
  generateSpecialDateMedia,
  GenerateSpecialDateMediaError,
} from "@/lib/special-dates/generate";

export const runtime = "nodejs";

interface GenerateMediaBody {
  holidayName?: string;
  holidayDate?: string;
  holidayMessage?: string;
  holidayDescription?: string;
  holidayTone?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body: GenerateMediaBody = await request.json().catch(() => ({}));

    const result = await generateSpecialDateMedia({
      companyId,
      holidayName: body.holidayName,
      holidayDate: body.holidayDate,
      holidayMessage: body.holidayMessage,
      holidayDescription: body.holidayDescription,
      holidayTone: body.holidayTone,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GenerateSpecialDateMediaError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Special dates media generation failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Media generation failed",
      },
      { status: 500 }
    );
  }
}