// apps/web/src/app/api/companies/[id]/special-dates/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HOLIDAY_SETS } from "@/lib/special-dates";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { license: true, companies: { where: { id: companyId } } },
  });

  if (!user || !user.license || user.license.status !== "ACTIVE") {
    return NextResponse.json({ error: "No active license" }, { status: 402 });
  }
  if (user.companies.length === 0) {
    return NextResponse.json({ error: "Company not found or access denied" }, { status: 403 });
  }

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
      name: true,
      logoUrl: true,
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

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { license: true, companies: { where: { id: companyId } } },
  });

  if (!user || !user.license || user.license.status !== "ACTIVE") {
    return NextResponse.json({ error: "No active license" }, { status: 402 });
  }
  if (user.companies.length === 0) {
    return NextResponse.json({ error: "Company not found or access denied" }, { status: 403 });
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

  if (body.brandInfo) {
    const brandInfo = body.brandInfo;
    await prisma.company.update({
      where: { id: companyId },
      data: {
        website: brandInfo.website !== undefined ? brandInfo.website : undefined,
        socialLinks: brandInfo.socialLinks !== undefined ? brandInfo.socialLinks : undefined,
        contactEmail: brandInfo.contactEmail !== undefined ? brandInfo.contactEmail : undefined,
        contactPhone: brandInfo.contactPhone !== undefined ? brandInfo.contactPhone : undefined,
        brandColors: brandInfo.brandColors !== undefined ? brandInfo.brandColors : undefined,
      },
    });
  }

  return NextResponse.json({ config });
}