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