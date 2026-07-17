// apps/web/src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/license";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      licenseId: true,
      fromEmail: true,
      license: { select: { customerName: true, fromEmail: true } },
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { email, name, password, licenseId, fromEmail, sendEmail } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password || crypto.randomBytes(12).toString("hex"), 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        licenseId: licenseId || null,
        fromEmail: fromEmail || null,
      },
    });

    if (sendEmail) {
      // Determine effective sender: user's fromEmail > license's fromEmail > default
      let effectiveFrom = user.fromEmail;
      if (!effectiveFrom && licenseId) {
        const lic = await prisma.license.findUnique({ where: { id: licenseId }, select: { fromEmail: true } });
        effectiveFrom = lic?.fromEmail;
      }
      await sendWelcomeEmail(email, password || "not set", effectiveFrom);
    }

    return NextResponse.json(
      { success: true, user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, email, name, role, licenseId, fromEmail } = await request.json();
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const data: any = {};
    if (email) data.email = email;
    if (name !== undefined) data.name = name;
    if (role) data.role = role;
    if (licenseId !== undefined) data.licenseId = licenseId;
    if (fromEmail !== undefined) data.fromEmail = fromEmail;  // allow clearing by setting null

    const updated = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ success: true, user: { id: updated.id, email: updated.email } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}