// apps/web/src/lib/access.ts
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export type AccessResult =
  | { allowed: false; status: number; error: string }
  | { allowed: true; user: any; membership: any | null };

export async function checkCompanyAccess(companyId: string): Promise<AccessResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { allowed: false, status: 401, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      license: true,
      memberships: { where: { companyId } },
    },
  });

  if (!user || !user.license || user.license.status !== "ACTIVE") {
    return { allowed: false, status: 402, error: "No active license" };
  }

  const membership = user.memberships[0] || null;
  if (!membership && user.role !== "ADMIN") {
    return { allowed: false, status: 403, error: "Company not found or access denied" };
  }

  return { allowed: true, user, membership };
}

export interface CapCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  reason?: string;
}

/**
 * Checks whether the given user may create another company, based on their
 * active license's `maxCompanies` entitlement.
 *
 * Counts every CompanyMember row the user belongs to. Owner-only companies
 * also count via the membership row created at company-creation time.
 */
export async function canCreateCompany(userId: string): Promise<CapCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      license: true,
      memberships: { select: { id: true } },
    },
  });

  if (!user) {
    return { allowed: false, used: 0, limit: 0, reason: "User not found" };
  }
  if (!user.license || user.license.status !== "ACTIVE") {
    return { allowed: false, used: 0, limit: 0, reason: "No active license" };
  }
  if (new Date(user.license.expiresAt) < new Date()) {
    return { allowed: false, used: 0, limit: 0, reason: "License expired" };
  }

  const used = user.memberships.length;
  const limit = user.license.maxCompanies ?? 5;
  return {
    allowed: used < limit,
    used,
    limit,
    reason: used < limit ? undefined : `Company limit reached (${used}/${limit})`,
  };
}

/**
 * Checks whether another platform may be connected to the given company.
 *
 * The cap comes from the company owner's license. In a single-user setup this
 * is the same license the acting user has. In multi-user setups the owner is
 * the billing anchor for platform limits.
 */
export async function canAddPlatform(companyId: string): Promise<CapCheckResult> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      owner: { include: { license: true } },
      _count: { select: { platforms: true } },
    },
  });

  if (!company) {
    return { allowed: false, used: 0, limit: 0, reason: "Company not found" };
  }

  const license = company.owner?.license;
  if (!license || license.status !== "ACTIVE") {
    return { allowed: false, used: 0, limit: 0, reason: "Owner has no active license" };
  }
  if (new Date(license.expiresAt) < new Date()) {
    return { allowed: false, used: 0, limit: 0, reason: "Owner license expired" };
  }

  const used = company._count.platforms;
  const limit = license.maxPlatformsPerCompany ?? 3;
  return {
    allowed: used < limit,
    used,
    limit,
    reason:
      used < limit ? undefined : `Platform limit reached for this company (${used}/${limit})`,
  };
}