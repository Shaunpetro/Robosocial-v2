// apps/web/src/lib/templates/index.ts
export type DecorationType =
  | 'none'
  | 'top-bar'
  | 'dual-circles'
  | 'corner-accent'
  | 'thin-rule'
  | 'grain'
  | 'side-divider'
  | 'dots-grid'
  | 'corner-blobs';

export interface TemplateDefinition {
  id: string;
  name: string;
  background: {
    type: 'solid' | 'gradient';
    colors: string[];
    angle?: number;
  };
  logoPosition: 'top' | 'center' | 'bottom';
  textColor: string;
  fontFamily: string;
  companyNameSize: number;
  taglineSize: number;
  websiteSize: number;
  showWebsite: boolean;
  showHandles: boolean;
  decoration: DecorationType;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'clean-corporate',
    name: 'Clean Corporate',
    background: { type: 'solid', colors: ['#FFFFFF'] },
    logoPosition: 'top',
    textColor: '#111827',
    fontFamily: 'Inter',
    companyNameSize: 26,
    taglineSize: 14,
    websiteSize: 18,
    showWebsite: true,
    showHandles: true,
    decoration: 'top-bar',
  },
  {
    id: 'bold-gradient',
    name: 'Bold Gradient',
    background: { type: 'gradient', colors: ['#6366F1', '#A855F7'], angle: 135 },
    logoPosition: 'top',
    textColor: '#FFFFFF',
    fontFamily: 'Inter',
    companyNameSize: 26,
    taglineSize: 14,
    websiteSize: 18,
    showWebsite: true,
    showHandles: true,
    decoration: 'dual-circles',
  },
  {
    id: 'minimalist-dark',
    name: 'Minimalist Dark',
    background: { type: 'solid', colors: ['#111827'] },
    logoPosition: 'top',
    textColor: '#FFFFFF',
    fontFamily: 'Inter',
    companyNameSize: 26,
    taglineSize: 14,
    websiteSize: 18,
    showWebsite: true,
    showHandles: true,
    decoration: 'corner-accent',
  },
  {
    id: 'professional-blue',
    name: 'Professional Blue',
    background: { type: 'solid', colors: ['#0A66C2'] },
    logoPosition: 'top',
    textColor: '#FFFFFF',
    fontFamily: 'Inter',
    companyNameSize: 26,
    taglineSize: 14,
    websiteSize: 18,
    showWebsite: true,
    showHandles: true,
    decoration: 'thin-rule',
  },
  {
    id: 'earthy-sa',
    name: 'Earthy South African',
    background: { type: 'gradient', colors: ['#B45309', '#78350F'], angle: 160 },
    logoPosition: 'top',
    textColor: '#FFFBEB',
    fontFamily: 'Inter',
    companyNameSize: 26,
    taglineSize: 14,
    websiteSize: 18,
    showWebsite: true,
    showHandles: true,
    decoration: 'grain',
  },
  {
    id: 'modern-split',
    name: 'Modern Split',
    background: { type: 'gradient', colors: ['#1E293B', '#334155'], angle: 90 },
    logoPosition: 'top',
    textColor: '#F8FAFC',
    fontFamily: 'Inter',
    companyNameSize: 26,
    taglineSize: 14,
    websiteSize: 18,
    showWebsite: true,
    showHandles: true,
    decoration: 'side-divider',
  },
  {
    id: 'tech-grid',
    name: 'Tech Grid',
    background: { type: 'solid', colors: ['#0F172A'] },
    logoPosition: 'top',
    textColor: '#E2E8F0',
    fontFamily: 'Inter',
    companyNameSize: 24,
    taglineSize: 13,
    websiteSize: 17,
    showWebsite: true,
    showHandles: true,
    decoration: 'dots-grid',
  },
  {
    id: 'playful',
    name: 'Playful',
    background: { type: 'gradient', colors: ['#F472B6', '#FB923C'], angle: 120 },
    logoPosition: 'top',
    textColor: '#1F2937',
    fontFamily: 'Inter',
    companyNameSize: 26,
    taglineSize: 14,
    websiteSize: 18,
    showWebsite: true,
    showHandles: true,
    decoration: 'corner-blobs',
  },
];