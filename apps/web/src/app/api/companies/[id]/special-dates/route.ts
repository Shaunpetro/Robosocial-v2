// apps/web/src/app/api/companies/[id]/special-dates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HOLIDAY_SETS, getUpcomingSpecialDates } from "@/lib/special-dates";
import { checkCompanyAccess } from "@/lib/access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  const access = await checkCompanyAccess(companyId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const config = await prisma.companySpecialDatesConfig.findUnique({
    where: { companyId },
  });

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      website: true,
      socialLinks: true,
      socialHandles: true,
      contactEmail: true,
      contactPhone: true,
      brandColors: true,
      name: true,
      logoUrl: true,
    },
  });

  const upcomingRaw = getUpcomingSpecialDates(config?.holidaySets || [], 90);
  const upcomingHolidays = upcomingRaw.map(({ entry, date }) => ({
    name: entry.name,
    date: date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    description: entry.description,
  }));

  return NextResponse.json({
    config: config || { enabled: false, holidaySets: [] },
    availableSets: HOLIDAY_SETS.map((s) => ({ id: s.id, label: s.label })),
    company,
    upcomingHolidays,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  const access = await checkCompanyAccess(companyId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json();

  const config = await prisma.companySpecialDatesConfig.upsert({
    where: { companyId },
    update: {
      enabled: Boolean(body.enabled),
      holidaySets: Array.isArray(body.holidaySets) ? body.holidaySets : [],
      logoMediaId: body.logoMediaId ?? null,
      generatedMediaId: body.generatedMediaId ?? null,
      templateId: body.templateId ?? null,
      logoPosition: body.logoPosition ?? "top",
      showWebsite: body.showWebsite ?? true,
      showHandles: body.showHandles ?? true,
    },
    create: {
      companyId,
      enabled: Boolean(body.enabled),
      holidaySets: Array.isArray(body.holidaySets) ? body.holidaySets : [],
      logoMediaId: body.logoMediaId ?? null,
      generatedMediaId: body.generatedMediaId ?? null,
      templateId: body.templateId ?? null,
      logoPosition: body.logoPosition ?? "top",
      showWebsite: body.showWebsite ?? true,
      showHandles: body.showHandles ?? true,
    },
  });

  if (body.brandInfo) {
    const brandInfo = body.brandInfo;
    await prisma.company.update({
      where: { id: companyId },
      data: {
        website: brandInfo.website !== undefined ? brandInfo.website : undefined,
        socialLinks: brandInfo.socialLinks !== undefined ? brandInfo.socialLinks : undefined,
        socialHandles: brandInfo.socialHandles !== undefined ? brandInfo.socialHandles : undefined,
        contactEmail: brandInfo.contactEmail !== undefined ? brandInfo.contactEmail : undefined,
        contactPhone: brandInfo.contactPhone !== undefined ? brandInfo.contactPhone : undefined,
        brandColors: brandInfo.brandColors !== undefined ? brandInfo.brandColors : undefined,
      },
    });
  }

  return NextResponse.json({ config });
}