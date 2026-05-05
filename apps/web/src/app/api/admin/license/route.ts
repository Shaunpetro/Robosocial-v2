// apps/web/src/app/api/admin/license/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAdmin, createLicense } from "@/lib/license";

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { customerName, maxSocialAccounts, monthsValid, githubPAT } = body;

    if (!customerName || !maxSocialAccounts || !monthsValid) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await createLicense({
      customerName,
      maxSocialAccounts,
      monthsValid,
      githubPAT,
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "License creation failed" },
      { status: 500 }
    );
  }
}