// apps/web/src/lib/templates/colors.ts
// Holiday color palettes plus luminance-aware color selection utilities.

export interface HolidayPalette {
    holiday: string;
    colors: string[]; // ordered darkest to lightest
  }
  
  // Curated palettes. Every palette is hand-picked to match the holiday mood
  // and to include at least one light and one dark option so that every
  // template background gets a workable choice.
  export const HOLIDAY_PALETTES: HolidayPalette[] = [
    // ---- Tier 1 major holidays ----
    { holiday: "New Year's Day", colors: ['#111827', '#1F2937', '#D4AF37', '#F5E6C8', '#FBF7E8'] },
    { holiday: "Valentine's Day", colors: ['#7F1D1D', '#9F1239', '#BE123C', '#FBCFE8', '#FFF1F2'] },
    { holiday: 'Good Friday', colors: ['#1F2937', '#374151', '#6B7280', '#D1D5DB', '#F9FAFB'] },
    { holiday: 'Easter Sunday', colors: ['#5B21B6', '#7C3AED', '#FDE68A', '#FBCFE8', '#FEF3C7'] },
    { holiday: 'Family Day', colors: ['#7C2D12', '#B45309', '#FCD34D', '#FEF3C7', '#FFFBEB'] },
    { holiday: "Mother's Day", colors: ['#831843', '#BE185D', '#F472B6', '#FBCFE8', '#FCE7F3'] },
    { holiday: "Father's Day", colors: ['#1E3A8A', '#1D4ED8', '#3B82F6', '#BFDBFE', '#EFF6FF'] },
    { holiday: 'Halloween', colors: ['#0F0F0F', '#4C1D95', '#7C3AED', '#EA580C', '#F97316'] },
    { holiday: 'Christmas Eve', colors: ['#14532D', '#166534', '#991B1B', '#FBBF24', '#FEF3C7'] },
    { holiday: 'Christmas Day', colors: ['#7F1D1D', '#14532D', '#B91C1C', '#D4AF37', '#FBF7E8'] },
    { holiday: 'Day of Goodwill', colors: ['#14532D', '#166534', '#B91C1C', '#D4AF37', '#FBF7E8'] },
  
    // ---- Tier 2 commemorative ----
    { holiday: 'Human Rights Day', colors: ['#0C4A6E', '#075985', '#0369A1', '#D4AF37', '#F5F5F4'] },
    { holiday: 'Freedom Day', colors: ['#14532D', '#166534', '#B91C1C', '#D4AF37', '#FEF3C7'] },
    { holiday: "International Women's Day", colors: ['#831843', '#BE185D', '#D4AF37', '#FBCFE8', '#FDF2F8'] },
    { holiday: "National Women's Day", colors: ['#831843', '#BE185D', '#D4AF37', '#FBCFE8', '#FDF2F8'] },
    { holiday: 'World Cancer Day', colors: ['#1E3A8A', '#1D4ED8', '#6366F1', '#C7D2FE', '#EEF2FF'] },
    { holiday: 'World Mental Health Day', colors: ['#065F46', '#047857', '#10B981', '#A7F3D0', '#ECFDF5'] },
    { holiday: 'World AIDS Day', colors: ['#7F1D1D', '#991B1B', '#DC2626', '#FECACA', '#FEF2F2'] },
    { holiday: 'Day of Reconciliation', colors: ['#1E293B', '#334155', '#64748B', '#CBD5E1', '#F1F5F9'] },
    { holiday: "Workers' Day", colors: ['#7C2D12', '#9A3412', '#EA580C', '#FED7AA', '#FFF7ED'] },
    { holiday: 'Youth Day', colors: ['#065F46', '#047857', '#10B981', '#FCD34D', '#FEF3C7'] },
    { holiday: 'Mandela Day', colors: ['#0F0F0F', '#1F2937', '#D4AF37', '#F5F5F4', '#FBF7E8'] },
    { holiday: 'Heritage Day', colors: ['#7C2D12', '#B45309', '#D97706', '#D4AF37', '#FEF3C7'] },
    { holiday: 'Spring Day', colors: ['#166534', '#15803D', '#FBBF24', '#FBCFE8', '#FFFBEB'] },
  
    // ---- Tier 3 awareness ----
    { holiday: 'World Water Day', colors: ['#075985', '#0369A1', '#0EA5E9', '#BAE6FD', '#F0F9FF'] },
    { holiday: 'World Health Day', colors: ['#9F1239', '#BE123C', '#DC2626', '#FECACA', '#FEF2F2'] },
    { holiday: 'World Environment Day', colors: ['#14532D', '#166534', '#22C55E', '#BBF7D0', '#F0FDF4'] },
    { holiday: 'World Food Day', colors: ['#7C2D12', '#B45309', '#F59E0B', '#FED7AA', '#FFF7ED'] },
    { holiday: 'Earth Day', colors: ['#0C4A6E', '#0E7490', '#14B8A6', '#99F6E4', '#F0FDFA'] },
  
    // ---- Cultural ----
    { holiday: 'Chinese New Year', colors: ['#7F1D1D', '#B91C1C', '#DC2626', '#D4AF37', '#FEF3C7'] },
    { holiday: 'Mid-Autumn Festival', colors: ['#78350F', '#B45309', '#D4AF37', '#FEF3C7', '#FFFBEB'] },
    { holiday: 'Vesak', colors: ['#78350F', '#B45309', '#D4AF37', '#FEF3C7', '#FFFBEB'] },
    { holiday: 'Holi', colors: ['#7C2D12', '#BE185D', '#7C3AED', '#0EA5E9', '#FBBF24'] },
    { holiday: 'Vaisakhi', colors: ['#7C2D12', '#B45309', '#D4AF37', '#FEF3C7', '#FFFBEB'] },
    { holiday: 'Diwali', colors: ['#7F1D1D', '#9F1239', '#B45309', '#D4AF37', '#FEF3C7'] },
    { holiday: 'Ramadan (Begins)', colors: ['#0F172A', '#1E293B', '#334155', '#D4AF37', '#F8FAFC'] },
    { holiday: 'Eid al-Fitr', colors: ['#064E3B', '#065F46', '#047857', '#D4AF37', '#ECFDF5'] },
    { holiday: 'Eid al-Adha', colors: ['#064E3B', '#065F46', '#047857', '#D4AF37', '#ECFDF5'] },
    { holiday: 'Rosh Hashanah', colors: ['#1E3A8A', '#1D4ED8', '#D4AF37', '#FEF3C7', '#EFF6FF'] },
    { holiday: 'Yom Kippur', colors: ['#1F2937', '#374151', '#6B7280', '#D1D5DB', '#F9FAFB'] },
    { holiday: 'Hanukkah', colors: ['#1E3A8A', '#1D4ED8', '#D4AF37', '#BFDBFE', '#EFF6FF'] },
  ];
  
  export interface Rgb {
    r: number;
    g: number;
    b: number;
  }
  
  export function hexToRgb(hex: string): Rgb | null {
    const cleaned = hex.replace('#', '').trim();
    if (cleaned.length === 3) {
      return {
        r: parseInt(cleaned[0] + cleaned[0], 16),
        g: parseInt(cleaned[1] + cleaned[1], 16),
        b: parseInt(cleaned[2] + cleaned[2], 16),
      };
    }
    if (cleaned.length === 6) {
      return {
        r: parseInt(cleaned.slice(0, 2), 16),
        g: parseInt(cleaned.slice(2, 4), 16),
        b: parseInt(cleaned.slice(4, 6), 16),
      };
    }
    return null;
  }
  
  export function relativeLuminance(rgb: Rgb): number {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
      const channel = v / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  export function contrastRatio(lumA: number, lumB: number): number {
    const lighter = Math.max(lumA, lumB);
    const darker = Math.min(lumA, lumB);
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  /**
   * Minimum contrast of a text color against all provided background colors.
   * Used for gradient backgrounds where legibility must hold at every stop.
   */
  export function minContrastAcrossBackgrounds(
    textColor: string,
    backgroundColors: string[]
  ): number {
    const textRgb = hexToRgb(textColor);
    if (!textRgb) return 0;
    const textLum = relativeLuminance(textRgb);
  
    let minRatio = Infinity;
    for (const bg of backgroundColors) {
      const bgRgb = hexToRgb(bg);
      if (!bgRgb) continue;
      const ratio = contrastRatio(textLum, relativeLuminance(bgRgb));
      if (ratio < minRatio) minRatio = ratio;
    }
    return minRatio === Infinity ? 0 : minRatio;
  }
  
  function hashSeed(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }
  
  /**
   * Pick a color from the holiday palette that guarantees at least 4.5:1 contrast
   * against every stop of the template background. Deterministic per seed.
   * Returns empty string if no candidate passes; callers fall back to template text color.
   */
  export function pickHolidayColor(
    holidayName: string | undefined,
    backgroundColors: string[],
    seed: string
  ): string {
    if (!holidayName) return '';
    const palette = HOLIDAY_PALETTES.find((p) => p.holiday === holidayName);
    if (!palette) return '';
  
    const candidates = palette.colors.filter((c) => {
      return minContrastAcrossBackgrounds(c, backgroundColors) >= 4.5;
    });
  
    if (candidates.length === 0) return '';
    const idx = hashSeed(seed + holidayName) % candidates.length;
    return candidates[idx];
  }
  
  /**
   * Ensure an accent color has enough contrast against all background stops.
   * Falls back to the template text color if the accent fails.
   */
  export function ensureAccentContrast(
    accent: string,
    backgroundColors: string[],
    fallback: string
  ): string {
    return minContrastAcrossBackgrounds(accent, backgroundColors) >= 3
      ? accent
      : fallback;
  }