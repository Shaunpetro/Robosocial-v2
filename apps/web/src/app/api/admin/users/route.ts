// apps/web/src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/license";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail, sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      licenseId: true,
      license: { select: { customerName: true } },
      createdAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { email, name, password, licenseId, sendEmail } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const hashed = await bcrypt.hash(password || generateRandomPassword(), 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashed,
        licenseId: licenseId || null,
      },
    });

    // Send welcome email if checkbox was checked
    if (sendEmail) {
      await sendWelcomeEmail(email, password);
    }

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, email, name, role, licenseId } = await request.json();
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const data: any = {};
    if (email) data.email = email;
    if (name !== undefined) data.name = name;
    if (role) data.role = role;
    if (licenseId !== undefined) data.licenseId = licenseId;

    const updated = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ success: true, user: { id: updated.id, email: updated.email } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateRandomPassword() {
  return crypto.randomBytes(12).toString("hex");
}