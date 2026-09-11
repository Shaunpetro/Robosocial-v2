// apps/web/src/app/api/companies/[id]/scrape-website/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { lookup } from "dns/promises";
import { checkCompanyAccess } from "@/lib/access";

export const runtime = "nodejs";

async function isPrivateIp(hostname: string): Promise<boolean> {
  try {
    const addresses = await lookup(hostname, { all: true });
    return addresses.some((addr) => {
      const ip = addr.address;
      return (
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        ip.startsWith("127.") ||
        (ip.startsWith("172.") &&
          parseInt(ip.split(".")[1], 10) >= 16 &&
          parseInt(ip.split(".")[1], 10) <= 31) ||
        ip === "::1" ||
        ip === "0.0.0.0"
      );
    });
  } catch {
    return true;
  }
}

function cleanPhone(raw: string): string {
  return raw.trim().replace(/[^\d+]/g, "");
}

function isValidPhone(cleaned: string): boolean {
  const digits = cleaned.replace(/^\+/, "");
  if (digits.length < 7 || digits.length > 15) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  if (/^(0123456789|1234567890|9876543210)/.test(digits)) return false;
  if (digits.length === 10 && digits.startsWith("1")) return false;
  if (digits.length === 13 && digits.startsWith("1")) return false;
  if (/^0\d{9}$/.test(digits)) return true;
  if (/^27\d{9}$/.test(digits)) return true;
  if (digits.length >= 9 && digits.length <= 15) return true;
  return false;
}

function extractPhone(html: string): string | null {
  const telPattern = /href=["']tel:([^"']+)["']/gi;
  for (const match of html.matchAll(telPattern)) {
    const cleaned = cleanPhone(match[1]);
    if (isValidPhone(cleaned)) return cleaned;
  }

  const ldPattern = /"telephone"\s*:\s*"([^"]+)"/gi;
  for (const match of html.matchAll(ldPattern)) {
    const cleaned = cleanPhone(match[1]);
    if (isValidPhone(cleaned)) return cleaned;
  }

  const contextPattern =
    /(?:tel|phone|call|contact|mobile|cell)[^a-z0-9]{0,30}((?:\+?\d[\d\s().-]{6,}\d))/gi;
  for (const match of html.matchAll(contextPattern)) {
    const cleaned = cleanPhone(match[1]);
    if (isValidPhone(cleaned)) return cleaned;
  }

  const saPattern = /(?:\+27[\s-]?|0)(\d{2})[\s-]?(\d{3})[\s-]?(\d{4})/g;
  for (const match of html.matchAll(saPattern)) {
    const cleaned = cleanPhone(match[0]);
    if (isValidPhone(cleaned)) return cleaned;
  }

  return null;
}

function extractWhatsapp(html: string): string | null {
  const patterns = [
    /https?:\/\/(?:www\.)?wa\.me\/(\d+)/i,
    /https?:\/\/(?:api\.)?whatsapp\.com\/send\?phone=(\d+)/i,
    /https?:\/\/(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9]+)/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  const access = await checkCompanyAccess(companyId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json();
  const websiteUrl = body.websiteUrl as string | undefined;

  if (!websiteUrl) {
    return NextResponse.json({ error: "Website URL is required" }, { status: 400 });
  }

  let normalizedUrl = websiteUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (await isPrivateIp(parsedUrl.hostname)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RobosocialBot/1.0; +https://atg-robosocial-v2.vercel.app)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch website (${response.status})` },
        { status: 502 }
      );
    }

    const html = await response.text();

    // ---- Social links (extended) ----
    const socialLinks: Record<string, string> = {};
    const socialPatterns: Record<string, RegExp> = {
      linkedin:  /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[^"'<>\s]+/gi,
      facebook:  /https?:\/\/(?:www\.)?facebook\.com\/[^"'<>\s]+/gi,
      twitter:   /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"'<>\s]+/gi,
      instagram: /https?:\/\/(?:www\.)?instagram\.com\/[^"'<>\s]+/gi,
      youtube:   /https?:\/\/(?:www\.)?youtube\.com\/(?:channel|user|c|@)\/[^"'<>\s]+/gi,
      tiktok:    /https?:\/\/(?:www\.)?tiktok\.com\/@[^"'<>\s]+/gi,
      pinterest: /https?:\/\/(?:www\.)?pinterest\.(?:com|co\.za)\/[^"'<>\s]+/gi,
      threads:   /https?:\/\/(?:www\.)?threads\.net\/@[^"'<>\s]+/gi,
    };
    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        socialLinks[platform] = matches[0];
      }
    }

    // ---- Email ----
    const emailMatch = html.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );
    const contactEmail = emailMatch ? emailMatch[0] : null;

    // ---- Phone & WhatsApp ----
    const contactPhone = extractPhone(html);
    const contactWhatsapp = extractWhatsapp(html);

    // ---- Brand color ----
    const themeColorMatch = html.match(
      /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i
    );
    const primaryColor = themeColorMatch ? themeColorMatch[1] : null;

    const brandColors = {
      primary: primaryColor || "#0A66C2",
      secondary: "#000000",
      accent: "#FFFFFF",
    };

    await prisma.company.update({
      where: { id: companyId },
      data: {
        website: normalizedUrl,
        socialLinks: { ...socialLinks, ...(contactWhatsapp ? { whatsapp: `https://wa.me/${contactWhatsapp}` } : {}) },
        contactEmail,
        contactPhone,
        brandColors,
      },
    });

    return NextResponse.json({
      success: true,
      website: normalizedUrl,
      socialLinks,
      contactEmail,
      contactPhone,
      contactWhatsapp,
      brandColors,
    });
  } catch (error) {
    console.error("Website scraping failed:", error);
    return NextResponse.json(
      { error: "Failed to scrape website", details: String(error) },
      { status: 500 }
    );
  }
}