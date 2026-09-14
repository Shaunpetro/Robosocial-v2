// apps/web/src/lib/social-handles.ts

export function detectPlatformFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "facebook.com" || host === "fb.com") return "facebook";
    if (host === "linkedin.com") return "linkedin";
    if (host === "twitter.com" || host === "x.com") return "twitter";
    if (host === "instagram.com") return "instagram";
    if (host === "youtube.com" || host === "youtu.be") return "youtube";
    if (host === "tiktok.com") return "tiktok";
    if (host.startsWith("pinterest.")) return "pinterest";
    if (host === "threads.net") return "threads";
    return null;
  } catch {
    return null;
  }
}

export function extractHandleFromUrl(platform: string, url: string): string | null {
  if (!url) return null;
  const p = platform.toLowerCase();
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    if (!path) return null;
    const parts = path.split("/").filter(Boolean);

    switch (p) {
      case "facebook": {
        if (parts[0] === "pages") return parts[2] || parts[1] || null;
        if (parts[0] === "profile.php") return u.searchParams.get("id");
        if (parts[0] === "people") return parts[1] || null;
        return parts[0] || null;
      }
      case "linkedin": {
        if (["company", "in", "school", "showcase"].includes(parts[0])) return parts[1] || null;
        return parts[0] || null;
      }
      case "twitter":
      case "instagram":
        return parts[0] || null;
      case "youtube": {
        if (parts[0]?.startsWith("@")) return parts[0].slice(1);
        if (parts[0] === "c" || parts[0] === "user") return parts[1] || null;
        if (parts[0] === "channel") return parts[1] || null;
        return parts[0] || null;
      }
      case "tiktok": {
        const at = parts.find((s) => s.startsWith("@"));
        return at ? at.slice(1) : parts[0] || null;
      }
      case "pinterest":
        return parts[0] || null;
      case "threads": {
        const at = parts.find((s) => s.startsWith("@"));
        return at ? at.slice(1) : parts[0] || null;
      }
      default:
        return parts[0] || null;
    }
  } catch {
    return null;
  }
}

/**
 * Builds the final handle map for rendering.
 * Rule: if `socialHandles[platform]` is an empty string, the user has explicitly
 * removed that handle. We respect that and do NOT fall back to URL parsing.
 * If it's missing entirely (undefined), we parse from the URL.
 */
export function buildHandleMap(
  socialLinks: Record<string, string> | null | undefined,
  socialHandles: Record<string, string> | null | undefined
): Record<string, string> {
  const result: Record<string, string> = {};
  const links = socialLinks || {};
  const handles = socialHandles || {};

  for (const [platform, url] of Object.entries(links)) {
    if (!url) continue;
    if (platform === "whatsapp") continue;

    // Empty string = user explicitly removed this handle
    if (Object.prototype.hasOwnProperty.call(handles, platform) && handles[platform] === "") {
      continue;
    }

    const stored = handles[platform];
    if (stored && stored.trim()) {
      result[platform] = stored.trim();
    } else {
      const parsed = extractHandleFromUrl(platform, url);
      if (parsed) result[platform] = parsed;
    }
  }

  for (const [platform, handle] of Object.entries(handles)) {
    if (platform in result) continue;
    if (!handle || handle === "") continue;
    result[platform] = handle.trim();
  }

  return result;
}

export function extractSameAsFromJsonLd(html: string): string[] {
  const results: string[] = [];
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptRegex)) {
    try {
      const parsed = JSON.parse(match[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) collectSameAs(item, results);
    } catch {
      // malformed JSON-LD; skip
    }
  }
  return Array.from(new Set(results));
}

function collectSameAs(node: any, out: string[]): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((n) => collectSameAs(n, out));
    return;
  }
  if (typeof node.sameAs === "string") out.push(node.sameAs);
  if (Array.isArray(node.sameAs)) {
    node.sameAs.forEach((s: unknown) => {
      if (typeof s === "string") out.push(s);
    });
  }
  for (const key of Object.keys(node)) {
    if (key === "sameAs") continue;
    collectSameAs(node[key], out);
  }
}

export function extractSameAsFromMicrodata(html: string): string[] {
  const results: string[] = [];
  for (const m of html.matchAll(/<[^>]+itemprop=["']sameAs["'][^>]*href=["']([^"']+)["']/gi)) {
    results.push(m[1]);
  }
  for (const m of html.matchAll(/<[^>]+itemprop=["']sameAs["'][^>]*content=["']([^"']+)["']/gi)) {
    results.push(m[1]);
  }
  return Array.from(new Set(results));
}

export function extractHandlesFromText(html: string): Record<string, string> {
  const result: Record<string, string> = {};
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  const platformKeywords: Record<string, string[]> = {
    instagram: ["instagram", "insta"],
    facebook: ["facebook", "fb"],
    twitter: ["twitter", "x"],
    tiktok: ["tiktok"],
    linkedin: ["linkedin"],
    youtube: ["youtube"],
  };

  for (const [platform, keywords] of Object.entries(platformKeywords)) {
    for (const kw of keywords) {
      const regex = new RegExp(`${kw}[^a-zA-Z0-9@]{0,30}@([a-zA-Z0-9._]{2,30})`, "gi");
      for (const m of stripped.matchAll(regex)) {
        if (!result[platform]) result[platform] = m[1];
      }
    }
  }
  return result;
}