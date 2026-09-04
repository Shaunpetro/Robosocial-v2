// apps/web/src/app/api/companies/[id]/scrape-website/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lookup } from "dns/promises";

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
    return true; // fail closed on DNS resolution errors
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { license: true, companies: { where: { id: companyId } } },
  });

  if (!user || !user.license || user.license.status !== "ACTIVE") {
    return NextResponse.json({ error: "No active license" }, { status: 402 });
  }
  if (user.companies.length === 0) {
    return NextResponse.json({ error: "Company not found or access denied" }, { status: 403 });
  }

  const body = await request.json();
  const websiteUrl = body.websiteUrl as string | undefined;

  if (!websiteUrl) {
    return NextResponse.json({ error: "Website URL is required" }, { status: 400 });
  }

  // Normalize URL
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

  // SSRF protection: reject private IPs
  if (await isPrivateIp(parsedUrl.hostname)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s

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

    // Extract social links
    const socialLinks: Record<string, string> = {};
    const socialPatterns: Record<string, RegExp> = {
      linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[^"'<>\s]+/gi,
      facebook: /https?:\/\/(?:www\.)?facebook\.com\/[^"'<>\s]+/gi,
      twitter: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"'<>\s]+/gi,
      instagram: /https?:\/\/(?:www\.)?instagram\.com\/[^"'<>\s]+/gi,
      youtube: /https?:\/\/(?:www\.)?youtube\.com\/(?:channel|user|c)\/[^"'<>\s]+/gi,
    };

    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        socialLinks[platform] = matches[0];
      }
    }

    // Extract email
    const emailMatch = html.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );
    const contactEmail = emailMatch ? emailMatch[0] : null;

    // Extract phone (basic)
    const phoneMatch = html.match(
      /(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/
    );
    const contactPhone = phoneMatch ? phoneMatch[0] : null;

    // Extract brand colors from meta tags
    const themeColorMatch = html.match(
      /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i
    );
    const primaryColor = themeColorMatch ? themeColorMatch[1] : null;

    const brandColors = {
      primary: primaryColor || "#0A66C2",
      secondary: "#000000",
      accent: "#FFFFFF",
    };

    // Update company record, including normalized website
    await prisma.company.update({
      where: { id: companyId },
      data: {
        website: normalizedUrl,
        socialLinks,
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