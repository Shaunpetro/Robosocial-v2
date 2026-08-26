// apps/web/src/app/api/admin/users/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/license";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await request.json();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { license: { select: { fromEmail: true } } },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newPassword = crypto.randomBytes(12).toString("hex");
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    // Priority: user.fromEmail > license.fromEmail > default
    const effectiveFrom = user.fromEmail || user.license?.fromEmail || undefined;
    await sendPasswordResetEmail(user.email, newPassword, effectiveFrom);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}