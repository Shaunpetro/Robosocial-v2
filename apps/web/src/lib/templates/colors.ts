// apps/web/src/lib/templates/colors.ts
// Holiday color palettes plus luminance-aware selection utilities.
// Every palette carries dark, warm-dark, mid and light options so that any
// template background has a themed choice that passes contrast.

export interface HolidayPalette {
    holiday: string;
    colors: string[];
  }
  
  export const HOLIDAY_PALETTES: HolidayPalette[] = [
    // ---- Tier 1 major holidays ----
    { holiday: "New Year's Day", colors: ['#111827', '#3B2410', '#D4AF37', '#F5E6C8', '#FBF7E8', '#FFF9E6', '#1F2937'] },
    { holiday: "Valentine's Day", colors: ['#4C0519', '#7F1D1D', '#BE123C', '#F472B6', '#FBCFE8', '#FFF1F2', '#FCE7F3'] },
    { holiday: 'Good Friday', colors: ['#1F2937', '#374151', '#6B7280', '#A1A1AA', '#D1D5DB', '#F3F4F6', '#F9FAFB'] },
    { holiday: 'Easter Sunday', colors: ['#4C1D95', '#5B21B6', '#7C3AED', '#FDE68A', '#FBCFE8', '#FEF3C7', '#FEF9C3'] },
    { holiday: 'Family Day', colors: ['#431407', '#7C2D12', '#B45309', '#FCD34D', '#FEF3C7', '#FFFBEB', '#FFF7ED'] },
    { holiday: "Mother's Day", colors: ['#500724', '#831843', '#BE185D', '#F472B6', '#FBCFE8', '#FCE7F3', '#FDF2F8'] },
    { holiday: "Father's Day", colors: ['#172554', '#1E3A8A', '#1D4ED8', '#3B82F6', '#BFDBFE', '#DBEAFE', '#EFF6FF'] },
    { holiday: 'Halloween', colors: ['#0F0F0F', '#1E1B4B', '#4C1D95', '#7C3AED', '#EA580C', '#F97316', '#FDE68A', '#DDD6FE', '#FBCFE8'] },
    { holiday: 'Christmas Eve', colors: ['#052E16', '#14532D', '#166534', '#991B1B', '#FBBF24', '#BBF7D0', '#FEF3C7', '#FBF7E8'] },
    { holiday: 'Christmas Day', colors: ['#7F1D1D', '#14532D', '#B91C1C', '#D4AF37', '#F5E6C8', '#FBF7E8', '#FFF9E6', '#FBCFE8'] },
    { holiday: 'Day of Goodwill', colors: ['#14532D', '#166534', '#B91C1C', '#D4AF37', '#FBF7E8', '#FEF3C7', '#FBCFE8', '#F5E6C8'] },
  
    // ---- Tier 2 commemorative ----
    { holiday: 'Human Rights Day', colors: ['#0C4A6E', '#075985', '#0369A1', '#0EA5E9', '#D4AF37', '#BAE6FD', '#F5F5F4', '#F0F9FF'] },
    { holiday: 'Freedom Day', colors: ['#14532D', '#166534', '#B91C1C', '#D4AF37', '#FEF3C7', '#FBF7E8', '#BBF7D0', '#FECACA'] },
    { holiday: "International Women's Day", colors: ['#500724', '#831843', '#BE185D', '#D4AF37', '#FBCFE8', '#FDF2F8', '#F5E6C8', '#FCE7F3'] },
    { holiday: "National Women's Day", colors: ['#500724', '#831843', '#BE185D', '#D4AF37', '#FBCFE8', '#FDF2F8', '#F5E6C8', '#FCE7F3'] },
    { holiday: 'World Cancer Day', colors: ['#1E3A8A', '#1D4ED8', '#6366F1', '#818CF8', '#C7D2FE', '#EEF2FF', '#F9FAFB', '#E0E7FF'] },
    { holiday: 'World Mental Health Day', colors: ['#064E3B', '#065F46', '#047857', '#10B981', '#A7F3D0', '#ECFDF5', '#F0FDFA', '#BBF7D0'] },
    { holiday: 'World AIDS Day', colors: ['#7F1D1D', '#991B1B', '#DC2626', '#F87171', '#FECACA', '#FEF2F2', '#FEF3C7', '#FEE2E2'] },
    { holiday: 'Day of Reconciliation', colors: ['#0F172A', '#1E293B', '#334155', '#64748B', '#CBD5E1', '#E2E8F0', '#F1F5F9', '#F8FAFC'] },
    { holiday: "Workers' Day", colors: ['#431407', '#7C2D12', '#9A3412', '#EA580C', '#FED7AA', '#FFF7ED', '#FEF3C7', '#FFEDD5'] },
    { holiday: 'Youth Day', colors: ['#064E3B', '#065F46', '#047857', '#10B981', '#FCD34D', '#BBF7D0', '#FEF3C7', '#ECFDF5'] },
    { holiday: 'Mandela Day', colors: ['#0F0F0F', '#1F2937', '#3B2410', '#D4AF37', '#F5F5F4', '#FBF7E8', '#F5E6C8', '#FDF6E3'] },
    { holiday: 'Heritage Day', colors: ['#431407', '#7C2D12', '#B45309', '#D97706', '#D4AF37', '#F5E6C8', '#FEF3C7', '#FFFBEB'] },
    { holiday: 'Spring Day', colors: ['#166534', '#15803D', '#FBBF24', '#FBCFE8', '#FEF3C7', '#FFFBEB', '#F0FDF4', '#FCE7F3'] },
  
    // ---- Tier 3 awareness ----
    { holiday: 'World Water Day', colors: ['#075985', '#0369A1', '#0EA5E9', '#38BDF8', '#BAE6FD', '#E0F2FE', '#F0F9FF', '#F5F5F4'] },
    { holiday: 'World Health Day', colors: ['#9F1239', '#BE123C', '#DC2626', '#FB7185', '#FECACA', '#FEF2F2', '#FCE7F3', '#FDF2F8'] },
    { holiday: 'World Environment Day', colors: ['#14532D', '#166534', '#22C55E', '#4ADE80', '#BBF7D0', '#F0FDF4', '#ECFDF5', '#F9FAFB'] },
    { holiday: 'World Food Day', colors: ['#431407', '#7C2D12', '#B45309', '#F59E0B', '#FED7AA', '#FFF7ED', '#FEF3C7', '#FFFBEB'] },
    { holiday: 'Earth Day', colors: ['#0C4A6E', '#0E7490', '#14B8A6', '#5EEAD4', '#99F6E4', '#F0FDFA', '#F5F5F4', '#F9FAFB'] },
  
    // ---- Cultural ----
    { holiday: 'Chinese New Year', colors: ['#7F1D1D', '#991B1B', '#B91C1C', '#DC2626', '#D4AF37', '#FEF3C7', '#F5E6C8', '#FFFBEB'] },
    { holiday: 'Mid-Autumn Festival', colors: ['#431407', '#78350F', '#B45309', '#D4AF37', '#FEF3C7', '#FFFBEB', '#F5E6C8', '#FDF6E3'] },
    { holiday: 'Vesak', colors: ['#431407', '#78350F', '#B45309', '#D4AF37', '#FEF3C7', '#FFFBEB', '#F5E6C8', '#FDF6E3'] },
    { holiday: 'Holi', colors: ['#7C2D12', '#BE185D', '#E11D48', '#7C3AED', '#0EA5E9', '#FBBF24', '#FDF2F8', '#FCE7F3'] },
    { holiday: 'Vaisakhi', colors: ['#431407', '#7C2D12', '#B45309', '#D4AF37', '#FEF3C7', '#FFFBEB', '#BBF7D0', '#FDF6E3'] },
    { holiday: 'Diwali', colors: ['#7F1D1D', '#9F1239', '#B45309', '#D4AF37', '#F97316', '#FEF3C7', '#F5E6C8', '#FFFBEB'] },
    { holiday: 'Ramadan (Begins)', colors: ['#0F172A', '#1E293B', '#334155', '#64748B', '#D4AF37', '#F5E6C8', '#F8FAFC', '#FDF6E3'] },
    { holiday: 'Eid al-Fitr', colors: ['#064E3B', '#065F46', '#047857', '#10B981', '#D4AF37', '#ECFDF5', '#F5E6C8', '#FDF6E3'] },
    { holiday: 'Eid al-Adha', colors: ['#064E3B', '#065F46', '#047857', '#10B981', '#D4AF37', '#ECFDF5', '#F5E6C8', '#FDF6E3'] },
    { holiday: 'Rosh Hashanah', colors: ['#1E3A8A', '#1D4ED8', '#3B82F6', '#D4AF37', '#FEF3C7', '#EFF6FF', '#F5E6C8', '#FDF6E3'] },
    { holiday: 'Yom Kippur', colors: ['#1F2937', '#374151', '#6B7280', '#A1A1AA', '#D1D5DB', '#F3F4F6', '#F9FAFB', '#F5F5F4'] },
    { holiday: 'Hanukkah', colors: ['#1E3A8A', '#1D4ED8', '#3B82F6', '#D4AF37', '#BFDBFE', '#EFF6FF', '#F5E6C8', '#FDF6E3'] },
  ];
  
  export const TEMPLATE_MOODS: Record<string, string> = {
    'clean-corporate': 'measured, corporate, sincere',
    'bold-gradient': 'bold, upbeat, celebratory',
    'minimalist-dark': 'considered, quietly confident',
    'professional-blue': 'steady, dependable, corporate',
    'earthy-sa': 'warm, earthy, communal',
    'modern-split': 'crisp, forward-looking',
    'tech-grid': 'innovative, future-facing',
    'playful': 'light, warm, joyful',
  };
  
  export function getTemplateMood(templateId?: string | null): string {
    if (!templateId) return 'warm, grounded';
    return TEMPLATE_MOODS[templateId] || 'warm, grounded';
  }
  
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
   * Picks a holiday color that passes contrast against the template background.
   * Solid backgrounds use a 4.5 threshold (WCAG AA).
   * Gradient backgrounds use 3.5 because text sits in the middle band, not on
   * every stop simultaneously.
   */
  export function pickHolidayColor(
    holidayName: string | undefined,
    backgroundColors: string[],
    seed: string
  ): string {
    if (!holidayName) return '';
    const palette = HOLIDAY_PALETTES.find((p) => p.holiday === holidayName);
    if (!palette) return '';
  
    const threshold = backgroundColors.length > 1 ? 3.5 : 4.5;
    const candidates = palette.colors.filter((c) => {
      return minContrastAcrossBackgrounds(c, backgroundColors) >= threshold;
    });
  
    if (candidates.length === 0) return '';
    const idx = hashSeed(seed + holidayName) % candidates.length;
    return candidates[idx];
  }
  
  export function ensureAccentContrast(
    accent: string,
    backgroundColors: string[],
    fallback: string
  ): string {
    const threshold = backgroundColors.length > 1 ? 3 : 3.5;
    return minContrastAcrossBackgrounds(accent, backgroundColors) >= threshold
      ? accent
      : fallback;
  }