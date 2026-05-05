// apps/web/src/lib/license.ts
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

// ---------- Admin helper (used only by the backdoor) ----------
export function isAdmin(request: Request): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  return token === ADMIN_API_KEY;
}

// ---------- Validate a license key ----------
export async function validateLicense(licenseKey: string) {
  // Find active license that matches the hash
  const licenses = await prisma.license.findMany({
    where: { status: "ACTIVE" },
  });

  for (const lic of licenses) {
    const match = await bcrypt.compare(licenseKey, lic.licenseKeyHash);
    if (match) {
      if (new Date(lic.expiresAt) < new Date()) {
        // Expired – update status
        await prisma.license.update({
          where: { id: lic.id },
          data: { status: "EXPIRED" },
        });
        return null;
      }
      return lic;
    }
  }
  return null;
}

// ---------- Create a new license (admin only) ----------
export async function createLicense(input: {
  customerName: string;
  maxSocialAccounts: number;
  monthsValid: number;
  githubPAT?: string;
}): Promise<{ licenseKey: string; expiresAt: Date }> {
  // Generate a random license key
  const segments = (length: number) =>
    Array.from({ length }, () =>
      Math.random().toString(36).substring(2, 6).toUpperCase()
    ).join("-");

  const licenseKey = `RS-${segments(4)}-${segments(4)}`;

  // Validate GitHub PAT if provided (optional step)
  let expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + input.monthsValid);

  if (input.githubPAT) {
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${input.githubPAT}`,
          Accept: "application/vnd.github+json",
        },
      });
      if (!res.ok) throw new Error("Invalid PAT");
      // GitHub doesn't return the PAT expiry directly, but we trust the admin to set monthsValid.
      // In a production system you would use the GitHub API to get the actual expiration,
      // but for now we use the provided monthsValid.
    } catch (e) {
      throw new Error("GitHub PAT validation failed");
    }
  }

  const licenseKeyHash = await bcrypt.hash(licenseKey, 12);

  await prisma.license.create({
    data: {
      customerName: input.customerName,
      licenseKeyHash,
      maxSocialAccounts: input.maxSocialAccounts,
      expiresAt,
      status: "ACTIVE",
    },
  });

  return { licenseKey, expiresAt };
}