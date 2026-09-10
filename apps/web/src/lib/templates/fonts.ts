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
 * Maps each holiday name to a specific Fontsource family.
 * Falls back to Inter for anything not listed.
 */
export const HOLIDAY_FONTS: Record<string, FontDefinition> = {
  // Christmas / festive season
  'Christmas Day': { name: 'Mountains of Christmas', packageName: '@fontsource/mountains-of-christmas' },
  'Day of Goodwill': { name: 'Mountains of Christmas', packageName: '@fontsource/mountains-of-christmas' },

  // New Year
  "New Year's Day": { name: 'Dawning of a New Day', packageName: '@fontsource/dawning-of-a-new-day' },

  // South African celebratory days
  'Heritage Day': { name: 'Festive', packageName: '@fontsource/festive' },
  'Human Rights Day': { name: 'Festive', packageName: '@fontsource/festive' },
  'Freedom Day': { name: 'Festive', packageName: '@fontsource/festive' },
  'Youth Day': { name: 'Festive', packageName: '@fontsource/festive' },
  "National Women's Day": { name: 'Festive', packageName: '@fontsource/festive' },
  "Workers' Day": { name: 'Festive', packageName: '@fontsource/festive' },

  // Reflective / warm days
  'Day of Reconciliation': { name: 'Handlee', packageName: '@fontsource/handlee' },
  'Good Friday': { name: 'Handlee', packageName: '@fontsource/handlee' },
  'Family Day': { name: 'Handlee', packageName: '@fontsource/handlee' },

  // International awareness
  'World Water Day': { name: 'Poppins', packageName: '@fontsource/poppins' },
  'World Health Day': { name: 'Poppins', packageName: '@fontsource/poppins' },
  'Earth Day': { name: 'Poppins', packageName: '@fontsource/poppins' },
  'World Environment Day': { name: 'Poppins', packageName: '@fontsource/poppins' },
  'World Food Day': { name: 'Poppins', packageName: '@fontsource/poppins' },
};

const DEFAULT_FONT: FontDefinition = {
  name: 'Inter',
  packageName: '@fontsource/inter',
};

const fontCache = new Map<string, ArrayBuffer>();

/**
 * Locates the best matching woff file inside a Fontsource package's `files/` folder.
 * Prefers latin-400-normal, then any latin woff, then any woff.
 */
function findWoffFile(pkgDir: string): string {
  const filesDir = path.join(pkgDir, 'files');
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

/**
 * Returns the ArrayBuffer for the font associated with the given holiday.
 * Falls back to Inter if no specific font is defined.
 */
export function getFontForHoliday(holidayName?: string): {
  fontData: ArrayBuffer;
  fontName: string;
} {
  const def = (holidayName && HOLIDAY_FONTS[holidayName]) || DEFAULT_FONT;

  const cached = fontCache.get(def.name);
  if (cached) return { fontData: cached, fontName: def.name };

  const pkgJson = require.resolve(`${def.packageName}/package.json`);
  const pkgDir = path.dirname(pkgJson);
  const fontPath = findWoffFile(pkgDir);

  const buf = fs.readFileSync(fontPath);
  const arrayBuffer = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  ) as ArrayBuffer;

  fontCache.set(def.name, arrayBuffer);
  return { fontData: arrayBuffer, fontName: def.name };
}