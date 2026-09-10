// apps/web/src/lib/templates/fonts.ts
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export interface FontDefinition {
  name: string;
  packageName: string;
}

/**
 * Holiday font map, organised in three tiers:
 *   Tier 1 — Major holidays: dedicated themed display fonts
 *   Tier 2 — Commemorative/emotional days: fonts that convey specific meaning
 *   Tier 3 — Awareness days: clean sans (Inter) or geometric (Poppins)
 */
export const HOLIDAY_FONTS: Record<string, FontDefinition> = {
  // ================================================================
  // TIER 1 — MAJOR HOLIDAYS
  // ================================================================
  "New Year's Day":           { name: 'Dawning of a New Day',    packageName: '@fontsource/dawning-of-a-new-day' },
  "Valentine's Day":          { name: 'Great Vibes',             packageName: '@fontsource/great-vibes' },
  'Good Friday':              { name: 'Dancing Script',          packageName: '@fontsource/dancing-script' },
  'Family Day':               { name: 'Dancing Script',          packageName: '@fontsource/dancing-script' },
  "Mother's Day":             { name: 'Great Vibes',             packageName: '@fontsource/great-vibes' },
  "Father's Day":             { name: 'Great Vibes',             packageName: '@fontsource/great-vibes' },
  'Halloween':                { name: 'Creepster',               packageName: '@fontsource/creepster' },
  'Christmas Eve':            { name: 'Mountains of Christmas',  packageName: '@fontsource/mountains-of-christmas' },
  'Christmas Day':            { name: 'Mountains of Christmas',  packageName: '@fontsource/mountains-of-christmas' },
  'Day of Goodwill':          { name: 'Mountains of Christmas',  packageName: '@fontsource/mountains-of-christmas' },

  // ================================================================
  // TIER 2 — COMMEMORATIVE / EMOTIONAL DAYS
  // ================================================================

  // -- Dignity & empowerment (Cinzel — engraved Roman capitals) --
  'Human Rights Day':          { name: 'Cinzel',                packageName: '@fontsource/cinzel' },
  'Freedom Day':               { name: 'Cinzel',                packageName: '@fontsource/cinzel' },
  "International Women's Day": { name: 'Cinzel',                packageName: '@fontsource/cinzel' },
  "National Women's Day":      { name: 'Cinzel',                packageName: '@fontsource/cinzel' },

  // -- Compassion & reflection (EB Garamond — soft literary serif) --
  'World Cancer Day':          { name: 'EB Garamond',           packageName: '@fontsource/eb-garamond' },
  'World Mental Health Day':   { name: 'EB Garamond',           packageName: '@fontsource/eb-garamond' },
  'World AIDS Day':            { name: 'EB Garamond',           packageName: '@fontsource/eb-garamond' },
  'Day of Reconciliation':     { name: 'EB Garamond',           packageName: '@fontsource/eb-garamond' },

  // -- Labour & solidarity (Oswald — bold condensed industrial) --
  "Workers' Day":              { name: 'Oswald',                packageName: '@fontsource/oswald' },

  // -- Youth & forward momentum (Poppins — modern geometric) --
  'Youth Day':                 { name: 'Poppins',               packageName: '@fontsource/poppins' },

  // -- Legacy & service (Playfair Display — dignified literary) --
  'Mandela Day':               { name: 'Playfair Display',      packageName: '@fontsource/playfair-display' },

  // -- Culture & heritage (Cormorant Garamond — warm elegant serif) --
  'Heritage Day':              { name: 'Cormorant Garamond',    packageName: '@fontsource/cormorant-garamond' },

  // ================================================================
  // TIER 3 — AWARENESS DAYS (clean)
  // ================================================================
  'World Water Day':           { name: 'Inter',                 packageName: '@fontsource/inter' },
  'World Health Day':          { name: 'Inter',                 packageName: '@fontsource/inter' },
  'World Environment Day':     { name: 'Inter',                 packageName: '@fontsource/inter' },
  'World Food Day':            { name: 'Inter',                 packageName: '@fontsource/inter' },
  'Earth Day':                 { name: 'Poppins',               packageName: '@fontsource/poppins' },
  'Spring Day':                { name: 'Poppins',               packageName: '@fontsource/poppins' },
};

const DEFAULT_FONT: FontDefinition = {
  name: 'Inter',
  packageName: '@fontsource/inter',
};

const fontCache = new Map<string, ArrayBuffer>();

function findWoffFile(filesDir: string): string {
  const files = fs.readdirSync(filesDir);
  const preferred = files.find(
    (f) => f.includes('latin-400-normal.woff') && !f.includes('italic')
  );
  if (preferred) return path.join(filesDir, preferred);
  const latin = files.find((f) => f.includes('latin') && f.endsWith('.woff'));
  if (latin) return path.join(filesDir, latin);
  const anyWoff = files.find((f) => f.endsWith('.woff'));
  if (anyWoff) return path.join(filesDir, anyWoff);
  throw new Error(`No woff file found in ${filesDir}`);
}

function resolveFontFilesDir(packageName: string): string {
  try {
    const resolved = require.resolve(`${packageName}/files/inter-latin-400-normal.woff`);
    return path.dirname(resolved);
  } catch { /* continue */ }

  try {
    const mainEntry = require.resolve(packageName);
    let dir = path.dirname(mainEntry);
    while (dir !== path.dirname(dir)) {
      if (fs.existsSync(path.join(dir, 'package.json'))) {
        const filesDir = path.join(dir, 'files');
        if (fs.existsSync(filesDir)) return filesDir;
      }
      dir = path.dirname(dir);
    }
  } catch { /* continue */ }

  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'node_modules', packageName, 'files'),
    path.join(cwd, '..', 'node_modules', packageName, 'files'),
    path.join(cwd, '..', '..', 'node_modules', packageName, 'files'),
    path.join('/var/task', 'node_modules', packageName, 'files'),
    path.join('/var/task', 'apps', 'web', 'node_modules', packageName, 'files'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  const pnpmRoots = [
    path.join(cwd, 'node_modules', '.pnpm'),
    path.join(cwd, '..', 'node_modules', '.pnpm'),
    path.join(cwd, '..', '..', 'node_modules', '.pnpm'),
    path.join('/var/task', 'node_modules', '.pnpm'),
    path.join('/var/task', 'apps', 'web', 'node_modules', '.pnpm'),
  ];
  for (const root of pnpmRoots) {
    if (!fs.existsSync(root)) continue;
    const entries = fs.readdirSync(root);
    const match = entries.find((entry) =>
      entry.startsWith(packageName.replace('/', '+') + '@')
    );
    if (match) {
      const candidate = path.join(root, match, 'node_modules', packageName, 'files');
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  throw new Error(`Cannot locate files/ directory for ${packageName}`);
}

export function getFontForHoliday(holidayName?: string): {
  fontData: ArrayBuffer;
  fontName: string;
} {
  const def = (holidayName && HOLIDAY_FONTS[holidayName]) || DEFAULT_FONT;

  const cached = fontCache.get(def.name);
  if (cached) return { fontData: cached, fontName: def.name };

  const filesDir = resolveFontFilesDir(def.packageName);
  const fontPath = findWoffFile(filesDir);

  const buf = fs.readFileSync(fontPath);
  const arrayBuffer = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  ) as ArrayBuffer;

  fontCache.set(def.name, arrayBuffer);
  return { fontData: arrayBuffer, fontName: def.name };
}