// apps/web/src/app/api/companies/[id]/special-dates/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HOLIDAY_SETS } from "@/lib/special-dates";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  const config = await prisma.companySpecialDatesConfig.findUnique({
    where: { companyId },
  });

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      website: true,
      socialLinks: true,
      contactEmail: true,
      contactPhone: true,
      brandColors: true,
    },
  });

  return NextResponse.json({
    config: config || { enabled: false, holidaySets: [] },
    availableSets: HOLIDAY_SETS.map((s) => ({ id: s.id, label: s.label })),
    company,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;
  const body = await request.json();

  const config = await prisma.companySpecialDatesConfig.upsert({
    where: { companyId },
    update: {
      enabled: Boolean(body.enabled),
      holidaySets: Array.isArray(body.holidaySets) ? body.holidaySets : [],
      logoMediaId: body.logoMediaId ?? null,
      generatedMediaId: body.generatedMediaId ?? null,
      templateId: body.templateId ?? null,
    },
    create: {
      companyId,
      enabled: Boolean(body.enabled),
      holidaySets: Array.isArray(body.holidaySets) ? body.holidaySets : [],
      logoMediaId: body.logoMediaId ?? null,
      generatedMediaId: body.generatedMediaId ?? null,
      templateId: body.templateId ?? null,
    },
  });

  return NextResponse.json({ config });
}