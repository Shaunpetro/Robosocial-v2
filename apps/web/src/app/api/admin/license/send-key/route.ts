// apps/web/src/app/api/admin/license/send-key/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/license";
import { sendLicenseKeyEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { licenseKey, email } = await request.json();
    if (!licenseKey || !email) {
      return NextResponse.json({ error: "licenseKey and email required" }, { status: 400 });
    }

    // Find license by comparing hashes
    const licenses = await prisma.license.findMany({
      where: { status: "ACTIVE" },
    });

    let matchingLicense = null;
    for (const lic of licenses) {
      if (await bcrypt.compare(licenseKey, lic.licenseKeyHash)) {
        matchingLicense = lic;
        break;
      }
    }
    if (!matchingLicense) {
      return NextResponse.json({ error: "License not found or revoked" }, { status: 404 });
    }

    await sendLicenseKeyEmail(email, licenseKey, matchingLicense.customerName);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}