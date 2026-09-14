// apps/web/src/app/api/companies/[id]/scrape-website/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { lookup } from "dns/promises";
import { checkCompanyAccess } from "@/lib/access";
import {
  detectPlatformFromUrl,
  extractHandleFromUrl,
  extractSameAsFromJsonLd,
  extractSameAsFromMicrodata,
  extractHandlesFromText,
} from "@/lib/social-handles";

export const runtime = "nodejs";

const CONTACT_PATHS = [
  "/contact",
  "/contact-us",
  "/contact.html",
  "/contact.php",
  "/get-in-touch",
  "/kontak",
  "/kontakt",
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

/**
 * South African phone validation.
 * Accepts: 0XXXXXXXXX (10 digits) or +27XXXXXXXXX / 27XXXXXXXXX (11 digits total).
 * Rejects all-zeros, sequential, and JS asset IDs (10-digit starting with 1 or 2).
 */
function isValidSaPhone(cleaned: string): boolean {
  const digits = cleaned.replace(/^\+/, "");

  // Reject obvious non-phones
  if (/^(\d)\1+$/.test(digits)) return false;
  if (/^(0123456789|1234567890|9876543210)/.test(digits)) return false;

  // SA domestic: 0 + 9 digits
  if (/^0\d{9}$/.test(digits)) return true;

  // SA international: 27 + 9 digits
  if (/^27\d{9}$/.test(digits)) return true;

  return false;
}

function extractPhonesFromHtml(html: string): string[] {
  const phones: string[] = [];

  // 1. JSON-LD "telephone"
  for (const m of html.matchAll(/"telephone"\s*:\s*"([^"]+)"/gi)) {
    const c = cleanPhone(m[1]);
    if (isValidSaPhone(c)) phones.push(c);
  }

  // 2. Microdata itemprop="telephone" (content or inner text)
  for (const m of html.matchAll(/<[^>]+itemprop=["']telephone["'][^>]*content=["']([^"']+)["']/gi)) {
    const c = cleanPhone(m[1]);
    if (isValidSaPhone(c)) phones.push(c);
  }
  for (const m of html.matchAll(/<[^>]+itemprop=["']telephone["'][^>]*>([^<]+)</gi)) {
    const c = cleanPhone(m[1]);
    if (isValidSaPhone(c)) phones.push(c);
  }

  // 3. tel: links
  for (const m of html.matchAll(/href=["']tel:([^"']+)["']/gi)) {
    const c = cleanPhone(m[1]);
    if (isValidSaPhone(c)) phones.push(c);
  }

  // 4. WhatsApp links
  for (const m of html.matchAll(/(?:wa\.me|whatsapp\.com\/send\?phone=)\/?(\d{10,15})/gi)) {
    const c = cleanPhone(m[1]);
    if (isValidSaPhone(c)) phones.push(c);
  }

  return phones;
}

function extractPhonesFromBodyText(html: string): string[] {
  // Strip script/style/nav/footer/header to avoid developer credits and menus
  const bodyOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ');

  const phones: string[] = [];

  // Context keyword near number
  const ctx = /(?:tel|phone|call|contact|mobile|cell)[^a-z0-9]{0,40}((?:\+?27|0)[\d\s().-]{8,}\d)/gi;
  for (const m of bodyOnly.matchAll(ctx)) {
    const c = cleanPhone(m[1]);
    if (isValidSaPhone(c)) phones.push(c);
  }

  return phones;
}

async function fetchHtml(url: string, timeoutMs = 6000): Promise<string | null> {
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
      return NextResponse.json({ error: "Failed to fetch website" }, { status: 502 });
    }

    // ---- Fetch contact pages (sequential-ish, we want the first hit) ----
    const origin = parsedUrl.origin;
    const contactPages: { url: string; html: string }[] = [];
    const contactResults = await Promise.allSettled(
      CONTACT_PATHS.map(async (p) => {
        const html = await fetchHtml(`${origin}${p}`, 5000);
        return html ? { url: `${origin}${p}`, html } : null;
      })
    );
    for (const r of contactResults) {
      if (r.status === "fulfilled" && r.value) {
        contactPages.push(r.value);
      }
    }

    // ---- Phone: contact pages first, then homepage ----
    let contactPhone: string | null = null;

    // 1. Try JSON-LD/microdata/tel from contact pages
    for (const page of contactPages) {
      const hits = extractPhonesFromHtml(page.html);
      if (hits.length > 0) {
        contactPhone = hits[0];
        break;
      }
    }

    // 2. Try contextual text from contact pages
    if (!contactPhone) {
      for (const page of contactPages) {
        const hits = extractPhonesFromBodyText(page.html);
        if (hits.length > 0) {
          contactPhone = hits[0];
          break;
        }
      }
    }

    // 3. Fall back to homepage structured data only (no footer scraping)
    if (!contactPhone) {
      const homeHits = extractPhonesFromHtml(homepageHtml);
      if (homeHits.length > 0) contactPhone = homeHits[0];
    }

    // 4. Last resort: homepage body text (which strips footer)
    if (!contactPhone) {
      const homeTextHits = extractPhonesFromBodyText(homepageHtml);
      if (homeTextHits.length > 0) contactPhone = homeTextHits[0];
    }

    // ---- Social URLs & handles ----
    const allHtml = [homepageHtml, ...contactPages.map((p) => p.html)].join('\n');

    // 1. JSON-LD sameAs
    const sameAsUrls = extractSameAsFromJsonLd(allHtml);

    // 2. Microdata sameAs
    const microdataUrls = extractSameAsFromMicrodata(allHtml);

    // 3. URL pattern scanning
    const urlPatterns: RegExp[] = [
      /https?:\/\/(?:www\.)?facebook\.com\/[^"'\s<>]+/gi,
      /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[^"'\s<>]+/gi,
      /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"'\s<>]+/gi,
      /https?:\/\/(?:www\.)?instagram\.com\/[^"'\s<>]+/gi,
      /https?:\/\/(?:www\.)?youtube\.com\/(?:channel|user|c|@)[^"'\s<>]+/gi,
      /https?:\/\/(?:www\.)?tiktok\.com\/@[^"'\s<>]+/gi,
      /https?:\/\/(?:www\.)?pinterest\.(?:com|co\.za)\/[^"'\s<>]+/gi,
      /https?:\/\/(?:www\.)?threads\.net\/@[^"'\s<>]+/gi,
    ];

    const urlCandidates: string[] = [...sameAsUrls, ...microdataUrls];
    for (const pattern of urlPatterns) {
      const matches = allHtml.match(pattern);
      if (matches) {
        for (const m of matches) urlCandidates.push(m.replace(/[.,;!?]+$/, ''));
      }
    }

    const socialLinks: Record<string, string> = {};
    const socialHandles: Record<string, string> = {};

    for (const url of urlCandidates) {
      if (!url) continue;
      if (!/^https?:\/\//.test(url)) continue;
      const platform = detectPlatformFromUrl(url);
      if (!platform) continue;
      if (!socialLinks[platform]) {
        socialLinks[platform] = url;
        const handle = extractHandleFromUrl(platform, url);
        if (handle) socialHandles[platform] = handle;
      }
    }

    // 4. Text-based @handle detection (fills gaps)
    const textHandles = extractHandlesFromText(allHtml);
    for (const [platform, handle] of Object.entries(textHandles)) {
      if (!socialHandles[platform]) socialHandles[platform] = handle;
    }

    // ---- Email ----
    const emailMatch = allHtml.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const contactEmail = emailMatch ? emailMatch[0] : null;

    // ---- WhatsApp ----
    let contactWhatsapp: string | null = null;
    const waMatch = allHtml.match(/(?:wa\.me|whatsapp\.com\/send\?phone=)\/?(\d{10,15})/i);
    if (waMatch) contactWhatsapp = waMatch[1];

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
      pagesScraped: 1 + contactPages.length,
    });
  } catch (error) {
    console.error("Website scraping failed:", error);
    return NextResponse.json(
      { error: "Failed to scrape website", details: String(error) },
      { status: 500 }
    );
  }
}