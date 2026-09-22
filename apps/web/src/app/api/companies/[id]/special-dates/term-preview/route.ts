// apps/web/src/app/api/companies/[id]/special-dates/term-preview/route.ts

import { NextRequest, NextResponse } from "next/server";
import { checkCompanyAccess } from "@/lib/access";
import { buildTermPlan } from "@/lib/special-dates/scheduler";

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

  const termId = request.nextUrl.searchParams.get("termId") || undefined;

  try {
    const plan = await buildTermPlan(companyId, termId);
    return NextResponse.json(plan);
  } catch (error) {
    console.error("[term-preview] failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Preview failed" },
      { status: 500 }
    );
  }
}