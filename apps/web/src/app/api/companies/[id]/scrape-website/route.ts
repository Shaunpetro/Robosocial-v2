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

/**
 * Strips blocks that typically contain developer credits, copyright notices,
 * and third-party agency contact info. Used before phone/handle extraction so
 * we don't pick up the site developer's phone number.
 */
function stripFooterAndCredits(html: string): string {
  let s = html;

  // 1. <footer>...</footer>
  s = s.replace(/<footer[\s\S]*?<\/footer>/gi, " ");

  // 2. Anything with class/id containing common credit keywords
  s = s.replace(
    /<(div|section|aside|p|span)[^>]+(?:class|id)=["'][^"']*(?:footer|copyright|credits|site-by|developed|powered-by|designed-by|web-design|site-credit)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi,
    " "
  );

  // 3. Anchors whose visible text mentions "developed", "designed", "site by"
  s = s.replace(
    /<a[^>]*>(?:(?!<\/a>)[\s\S])*?(?:developed|designed|powered|built)\s+(?:by|with)[\s\S]*?<\/a>/gi,
    " "
  );

  return s;
}

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

function isValidSaPhone(cleaned: string): boolean {
  const digits = cleaned.replace(/^\+/, "");
  if (/^(\d)\1+$/.test(digits)) return false;
  if (/^(0123456789|1234567890|9876543210)/.test(digits)) return false;
  if (/^0\d{9}$/.test(digits)) return true;
  if (/^27\d{9}$/.test(digits)) return true;
  return false;
}

function extractPhonesFromHtml(html: string): string[] {
  const phones: string[] = [];

  for (const m of html.matchAll(/"telephone"\s*:\s*"([^"]+)"/gi)) {
    const c = cleanPhone(m[1]);
    if (isValidSaPhone(c)) phones.push(c);
  }
  for (const m of html.matchAll(/<[^>]+itemprop=["']telephone["'][^>]*content=["']([^"']+)["']/gi)) {
    const c = cleanPhone(m[1]);
    if (isValidSaPhone(c)) phones.push(c);
  }
  for (const m of html.matchAll(/<[^>]+itemprop=["']telephone["'][^>]*>([^<]+)</gi)) {
    const c = cleanPhone(m[1]);
    if (isValidSaPhone(c)) phones.push(c);
  }
  for (const m of html.matchAll(/href=["']tel:([^"']+)["']/gi)) {
    const c = cleanPhone(m[1]);
    if (isValidSaPhone(c)) phones.push(c);
  }
  for (const m of html.matchAll(/(?:wa\.me|whatsapp\.com\/send\?phone=)\/?(\d{10,15})/gi)) {
    const c = cleanPhone(m[1]);
    if (isValidSaPhone(c)) phones.push(c);
  }

  return phones;
}

function extractPhonesFromBodyText(html: string): string[] {
  const bodyOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

  const phones: string[] = [];
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
    const homepageRaw = await fetchHtml(normalizedUrl, 8000);
    if (!homepageRaw) {
      return NextResponse.json({ error: "Failed to fetch website" }, { status: 502 });
    }

    // ---- Fetch contact pages ----
    const origin = parsedUrl.origin;
    const contactPages: { url: string; html: string }[] = [];
    const contactResults = await Promise.allSettled(
      CONTACT_PATHS.map(async (p) => {
        const html = await fetchHtml(`${origin}${p}`, 5000);
        return html ? { url: `${origin}${p}`, html } : null;
      })
    );
    for (const r of contactResults) {
      if (r.status === "fulfilled" && r.value) contactPages.push(r.value);
    }

    // ---- Build stripped versions (footer/credits removed) ----
    const homepageStripped = stripFooterAndCredits(homepageRaw);
    const contactStripped = contactPages.map((p) => ({
      url: p.url,
      html: stripFooterAndCredits(p.html),
    }));

    // ---- Phone: contact pages first, then homepage — all from stripped HTML ----
    let contactPhone: string | null = null;

    for (const page of contactStripped) {
      const hits = extractPhonesFromHtml(page.html);
      if (hits.length > 0) { contactPhone = hits[0]; break; }
    }
    if (!contactPhone) {
      for (const page of contactStripped) {
        const hits = extractPhonesFromBodyText(page.html);
        if (hits.length > 0) { contactPhone = hits[0]; break; }
      }
    }
    if (!contactPhone) {
      const hits = extractPhonesFromHtml(homepageStripped);
      if (hits.length > 0) contactPhone = hits[0];
    }
    if (!contactPhone) {
      const hits = extractPhonesFromBodyText(homepageStripped);
      if (hits.length > 0) contactPhone = hits[0];
    }

    // ---- Social: strip footer first so we don't pick up dev credits ----
    const allHtmlStripped = [homepageStripped, ...contactStripped.map((p) => p.html)].join("\n");

    const sameAsUrls = extractSameAsFromJsonLd(allHtmlStripped);
    const microdataUrls = extractSameAsFromMicrodata(allHtmlStripped);

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
      const matches = allHtmlStripped.match(pattern);
      if (matches) {
        for (const m of matches) urlCandidates.push(m.replace(/[.,;!?]+$/, ""));
      }
    }

    const socialLinks: Record<string, string> = {};
    const socialHandles: Record<string, string> = {};

    for (const url of urlCandidates) {
      if (!url || !/^https?:\/\//.test(url)) continue;
      const platform = detectPlatformFromUrl(url);
      if (!platform) continue;
      if (!socialLinks[platform]) {
        socialLinks[platform] = url;
        const handle = extractHandleFromUrl(platform, url);
        if (handle) socialHandles[platform] = handle;
      }
    }

    const textHandles = extractHandlesFromText(allHtmlStripped);
    for (const [platform, handle] of Object.entries(textHandles)) {
      if (!socialHandles[platform]) socialHandles[platform] = handle;
    }

    // ---- Email ----
    const emailMatch = allHtmlStripped.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const contactEmail = emailMatch ? emailMatch[0] : null;

    // ---- WhatsApp ----
    let contactWhatsapp: string | null = null;
    const waMatch = allHtmlStripped.match(/(?:wa\.me|whatsapp\.com\/send\?phone=)\/?(\d{10,15})/i);
    if (waMatch) contactWhatsapp = waMatch[1];

    // ---- Brand color (from raw homepage — meta tag location doesn't matter) ----
    const themeColorMatch = homepageRaw.match(
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