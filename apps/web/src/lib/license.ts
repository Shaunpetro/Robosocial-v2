// apps/web/src/lib/license.ts
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

export function isAdmin(request: Request): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  return token === ADMIN_API_KEY;
}

function generateLicenseKey(): string {
  const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RS-${seg()}-${seg()}-${seg()}-${seg()}`;
}

export async function validateLicense(licenseKey: string) {
  const licenses = await prisma.license.findMany({
    where: { status: "ACTIVE" },
  });
  for (const lic of licenses) {
    const match = await bcrypt.compare(licenseKey, lic.licenseKeyHash);
    if (match) {
      if (new Date(lic.expiresAt) < new Date()) {
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

export async function createLicense(input: {
  customerName: string;
  maxSocialAccounts: number;
  monthsValid: number;
  githubPAT?: string;
  fromEmail?: string;
}): Promise<{ id: string; licenseKey: string; expiresAt: Date; keyPreview: string }> {
  const licenseKey = generateLicenseKey();
  const keyPreview = licenseKey.slice(-8);

  let expiresAt = new Date();
  if (input.githubPAT) {
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${input.githubPAT}`,
          Accept: "application/vnd.github+json",
        },
      });
      if (!res.ok) throw new Error("Invalid PAT");
    } catch (e) {
      throw new Error("GitHub PAT validation failed");
    }
  }
  expiresAt.setMonth(expiresAt.getMonth() + input.monthsValid);

  const licenseKeyHash = await bcrypt.hash(licenseKey, 12);

  const created = await prisma.license.create({
    data: {
      customerName: input.customerName,
      licenseKeyHash,
      maxSocialAccounts: input.maxSocialAccounts,
      expiresAt,
      status: "ACTIVE",
      fromEmail: input.fromEmail || null,
      keyPreview,
    },
  });

  return { id: created.id, licenseKey, expiresAt, keyPreview };
}

export async function revokeLicense(licenseKey: string) {
  const licenses = await prisma.license.findMany({ where: { status: "ACTIVE" } });
  for (const lic of licenses) {
    const match = await bcrypt.compare(licenseKey, lic.licenseKeyHash);
    if (match) {
      await prisma.license.update({
        where: { id: lic.id },
        data: { status: "REVOKED" },
      });
      return true;
    }
  }
  return false;
}