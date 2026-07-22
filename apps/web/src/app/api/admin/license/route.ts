// apps/web/src/app/api/admin/license/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin, createLicense, revokeLicense } from "@/lib/license";

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { customerName, maxSocialAccounts, monthsValid, fromEmail, userId } = body;

    if (!customerName || !maxSocialAccounts || !monthsValid) {
      return NextResponse.json(
        { error: "Missing required fields (customerName, maxSocialAccounts, monthsValid)" },
        { status: 400 }
      );
    }

    const result = await createLicense({
      customerName,
      maxSocialAccounts,
      monthsValid,
      fromEmail,
    });

    // If a userId was provided, assign the licence to that user
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { licenseId: result.id },
      });
    }

    return NextResponse.json(
      {
        success: true,
        id: result.id,
        licenseKey: result.licenseKey,
        expiresAt: result.expiresAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "License creation failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { licenseKey } = await request.json();
    if (!licenseKey) {
      return NextResponse.json({ error: "licenseKey is required" }, { status: 400 });
    }

    const revoked = await revokeLicense(licenseKey);
    if (!revoked) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}