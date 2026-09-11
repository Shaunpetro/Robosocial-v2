// apps/web/src/lib/social-handles.ts

/**
 * Extracts a platform handle from a social media URL.
 * Handles WordPress, PHP, static HTML, and web-app URLs alike, since
 * they all expose the handle in the URL path.
 */
export function extractHandleFromUrl(platform: string, url: string): string | null {
    if (!url) return null;
    const p = platform.toLowerCase();
  
    try {
      const u = new URL(url);
      const path = u.pathname.replace(/^\/+|\/+$/g, '');
      if (!path) return null;
      const parts = path.split('/').filter(Boolean);
  
      switch (p) {
        case 'facebook': {
          if (parts[0] === 'pages') {
            return parts[2] || parts[1] || null;
          }
          return parts[0] || null;
        }
        case 'linkedin': {
          if (parts[0] === 'company' || parts[0] === 'in' || parts[0] === 'school') {
            return parts[1] || null;
          }
          return parts[0] || null;
        }
        case 'twitter':
        case 'x':
          return parts[0] || null;
        case 'instagram':
          return parts[0] || null;
        case 'youtube': {
          if (parts[0]?.startsWith('@')) return parts[0].slice(1);
          if (parts[0] === 'c' || parts[0] === 'user') return parts[1] || null;
          if (parts[0] === 'channel') return parts[1] || null;
          return parts[0] || null;
        }
        case 'tiktok': {
          const at = parts.find((s) => s.startsWith('@'));
          return at ? at.slice(1) : parts[0] || null;
        }
        case 'pinterest':
          return parts[0] || null;
        case 'threads': {
          const at = parts.find((s) => s.startsWith('@'));
          return at ? at.slice(1) : parts[0] || null;
        }
        case 'snapchat':
          return parts[0] || null;
        default:
          return parts[0] || null;
      }
    } catch {
      return null;
    }
  }
  
  /**
   * Given stored URLs and stored handles, produce a final handle map.
   * Stored handles win; if missing, we parse from the URL.
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
      if (platform === 'whatsapp') continue;
      const stored = handles[platform];
      if (stored && stored.trim()) {
        result[platform] = stored.trim();
      } else {
        const parsed = extractHandleFromUrl(platform, url);
        if (parsed) result[platform] = parsed;
      }
    }
  
    // If user provided handles for platforms without URLs, include them
    for (const [platform, handle] of Object.entries(handles)) {
      if (!result[platform] && handle && handle.trim()) {
        result[platform] = handle.trim();
      }
    }
  
    return result;
  }