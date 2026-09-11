// apps/web/src/app/api/companies/[id]/scrape-website/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { lookup } from "dns/promises";
import { checkCompanyAccess } from "@/lib/access";
import { extractHandleFromUrl } from "@/lib/social-handles";

export const runtime = "nodejs";

const CONTACT_PATHS = [
  "/contact",
  "/contact-us",
  "/contact.html",
  "/contact.php",
  "/get-in-touch",
  "/kontak",
  "/about",
  "/about-us",
];

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

function extractPhoneFromHtml(html: string): string | null {
  // 1. tel: links
  for (const match of html.matchAll(/href=["']tel:([^"']+)["']/gi)) {
    const cleaned = cleanPhone(match[1]);
    if (isValidPhone(cleaned)) return cleaned;
  }

  // 2. JSON-LD schema telephone
  for (const match of html.matchAll(/"telephone"\s*:\s*"([^"]+)"/gi)) {
    const cleaned = cleanPhone(match[1]);
    if (isValidPhone(cleaned)) return cleaned;
  }

  // 3. WhatsApp link number
  for (const match of html.matchAll(/wa\.me\/(\d{7,15})/gi)) {
    const cleaned = cleanPhone(match[1]);
    if (isValidPhone(cleaned)) return cleaned;
  }

  // 4. Context keywords
  const contextPattern =
    /(?:tel|phone|call|contact|mobile|cell)[^a-z0-9]{0,30}((?:\+?\d[\d\s().-]{6,}\d))/gi;
  for (const match of html.matchAll(contextPattern)) {
    const cleaned = cleanPhone(match[1]);
    if (isValidPhone(cleaned)) return cleaned;
  }

  // 5. Strict SA-format anywhere
  const saPattern = /(?:\+27[\s-]?|0)(\d{2})[\s-]?(\d{3})[\s-]?(\d{4})/g;
  for (const match of html.matchAll(saPattern)) {
    const cleaned = cleanPhone(match[0]);
    if (isValidPhone(cleaned)) return cleaned;
  }

  return null;
}

async function fetchHtml(url: string, timeoutMs = 4000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RobosocialBot/1.0; +https://atg-robosocial-v2.vercel.app)",
      },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function findPhoneAcrossPages(
  baseUrl: string,
  homepageHtml: string
): Promise<string | null> {
  const fromHome = extractPhoneFromHtml(homepageHtml);
  if (fromHome) return fromHome;

  const base = new URL(baseUrl);
  const contactUrls = CONTACT_PATHS.map((p) => `${base.origin}${p}`);

  const results = await Promise.allSettled(
    contactUrls.map((url) => fetchHtml(url, 4000))
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      const found = extractPhoneFromHtml(r.value);
      if (found) return found;
    }
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
    const homepageHtml = await fetchHtml(normalizedUrl, 8000);
    if (!homepageHtml) {
      return NextResponse.json(
        { error: "Failed to fetch website" },
        { status: 502 }
      );
    }

    // ---- Social URLs ----
    const socialLinks: Record<string, string> = {};
    const socialPatterns: Record<string, RegExp> = {
      linkedin:  /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[^"'<>\s]+/gi,
      facebook:  /https?:\/\/(?:www\.)?facebook\.com\/[^"'<>\s]+/gi,
      twitter:   /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"'<>\s]+/gi,
      instagram: /https?:\/\/(?:www\.)?instagram\.com\/[^"'<>\s]+/gi,
      youtube:   /https?:\/\/(?:www\.)?youtube\.com\/(?:channel|user|c|@)\/[^"'<>\s]+/gi,
      tiktok:    /https?:\/\/(?:www\.)?tiktok\.com\/@[^"'<>\s]+/gi,
      pinterest: /https?:\/\/(?:www\.)?pinterest\.(?:com|co\.za)\/[^"'<>\s]+/gi,
      threads:   /https?:\/\/(?:www\.)?threads\.net\/@[^"'<>\s]+/gi,
    };
    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      const matches = homepageHtml.match(pattern);
      if (matches && matches.length > 0) {
        socialLinks[platform] = matches[0].replace(/[.,;!?]+$/, "");
      }
    }

    // ---- Handle extraction ----
    const socialHandles: Record<string, string> = {};
    for (const [platform, url] of Object.entries(socialLinks)) {
      const handle = extractHandleFromUrl(platform, url);
      if (handle) socialHandles[platform] = handle;
    }

    // ---- Email ----
    const emailMatch = homepageHtml.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );
    const contactEmail = emailMatch ? emailMatch[0] : null;

    // ---- Phone (multi-page) ----
    const contactPhone = await findPhoneAcrossPages(normalizedUrl, homepageHtml);

    // ---- WhatsApp ----
    let contactWhatsapp: string | null = null;
    const waPatterns = [
      /wa\.me\/(\d+)/i,
      /whatsapp\.com\/send\?phone=(\d+)/i,
    ];
    for (const pattern of waPatterns) {
      const m = homepageHtml.match(pattern);
      if (m) {
        contactWhatsapp = m[1];
        break;
      }
    }

    // ---- Brand color ----
    const themeColorMatch = homepageHtml.match(
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
        socialLinks,
        socialHandles,
        contactEmail,
        contactPhone,
        brandColors,
      },
    });

    return NextResponse.json({
      success: true,
      website: normalizedUrl,
      socialLinks,
      socialHandles,
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