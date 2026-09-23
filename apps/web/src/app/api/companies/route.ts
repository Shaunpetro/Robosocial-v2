// apps/web/src/app/api/companies/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateCompany } from "@/lib/access";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: { select: { companyId: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const whereClause =
      user.role === "ADMIN"
        ? {}
        : { id: { in: user.memberships.map((m) => m.companyId) } };

    const companies = await prisma.company.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        platforms: true,
        contentSettings: true,
        _count: {
          select: {
            platforms: true,
            generatedPosts: true,
          },
        },
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Enforce the license's maxCompanies cap before touching the DB.
    const capCheck = await canCreateCompany(user.id);
    if (!capCheck.allowed) {
      return NextResponse.json(
        {
          error: capCheck.reason || "Company limit reached",
          used: capCheck.used,
          limit: capCheck.limit,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, website, industry, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const company = await prisma.$transaction(async (tx) => {
      const created = await tx.company.create({
        data: {
          name: name.trim(),
          website: website?.trim() || null,
          industry: industry?.trim() || null,
          description: description?.trim() || null,
          ownerId: user.id,
        },
      });

      await tx.companyMember.create({
        data: {
          companyId: created.id,
          userId: user.id,
          role: "ADMIN",
        },
      });

      return created;
    });

    const fullCompany = await prisma.company.findUnique({
      where: { id: company.id },
      include: {
        platforms: true,
        contentSettings: true,
        _count: {
          select: {
            platforms: true,
            generatedPosts: true,
          },
        },
      },
    });

    return NextResponse.json(fullCompany, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}