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
      contactWhatsapp: true,
      brandColors: true,
      name: true,
      logoUrl: true,
    },
  });

  const pickerRaw = getUpcomingSpecialDates(
    config?.holidaySets || [],
    365,
    new Date(),
    config?.excludedHolidays || []
  );
  const upcomingHolidays = pickerRaw.map(({ entry, date, setId }) => ({
    name: entry.name,
    date: date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    isoDate: date.toISOString().slice(0, 10),
    description: entry.description,
    setId,
    categories: entry.categories,
    major: entry.major ?? false,
    tone: entry.tone,
    hashtags: entry.hashtags,
  }));

  return NextResponse.json({
    config: config || {
      enabled: false,
      holidaySets: [],
      excludedHolidays: [],
      tagline: null,
      dedication: null,
      useStockBackgrounds: false,
      compositionId: null,
      lastScheduledTermId: null,
    },
    availableSets: HOLIDAY_SETS.map((s) => ({
      id: s.id,
      label: s.label,
      description: s.description,
    })),
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

  const existingConfig = await prisma.companySpecialDatesConfig.findUnique({
    where: { companyId },
    select: { templateId: true },
  });
  const templateChanged =
    existingConfig &&
    body.templateId &&
    existingConfig.templateId !== body.templateId;

  if (templateChanged) {
    await prisma.holidayDedication.deleteMany({ where: { companyId } });
  }

  const config = await prisma.companySpecialDatesConfig.upsert({
    where: { companyId },
    update: {
      enabled: Boolean(body.enabled),
      holidaySets: Array.isArray(body.holidaySets) ? body.holidaySets : [],
      excludedHolidays: Array.isArray(body.excludedHolidays) ? body.excludedHolidays : [],
      logoMediaId: body.logoMediaId ?? null,
      generatedMediaId: body.generatedMediaId ?? null,
      templateId: body.templateId ?? null,
      compositionId: body.compositionId ?? null,
      logoPosition: body.logoPosition ?? "top",
      showWebsite: body.showWebsite ?? true,
      showHandles: body.showHandles ?? true,
      tagline: body.tagline ?? null,
      dedication: body.dedication ?? null,
      useStockBackgrounds: body.useStockBackgrounds ?? false,
    },
    create: {
      companyId,
      enabled: Boolean(body.enabled),
      holidaySets: Array.isArray(body.holidaySets) ? body.holidaySets : [],
      excludedHolidays: Array.isArray(body.excludedHolidays) ? body.excludedHolidays : [],
      logoMediaId: body.logoMediaId ?? null,
      generatedMediaId: body.generatedMediaId ?? null,
      templateId: body.templateId ?? null,
      compositionId: body.compositionId ?? null,
      logoPosition: body.logoPosition ?? "top",
      showWebsite: body.showWebsite ?? true,
      showHandles: body.showHandles ?? true,
      tagline: body.tagline ?? null,
      dedication: body.dedication ?? null,
      useStockBackgrounds: body.useStockBackgrounds ?? false,
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
        contactWhatsapp: brandInfo.contactWhatsapp !== undefined ? brandInfo.contactWhatsapp : undefined,
        brandColors: brandInfo.brandColors !== undefined ? brandInfo.brandColors : undefined,
      },
    });
  }

  return NextResponse.json({ config });
}