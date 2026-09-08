// apps/web/src/lib/templates/index.ts
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
    websiteSize: number;
    showWebsite: boolean;
    showHandles: boolean;
  }
  
  export const TEMPLATES: TemplateDefinition[] = [
    {
      id: 'clean-corporate',
      name: 'Clean Corporate',
      background: { type: 'solid', colors: ['#FFFFFF'] },
      logoPosition: 'top',
      textColor: '#111827',
      fontFamily: 'Arial',
      companyNameSize: 48,
      websiteSize: 28,
      showWebsite: true,
      showHandles: true,
    },
    {
      id: 'bold-gradient',
      name: 'Bold Gradient',
      background: { type: 'gradient', colors: ['#6366F1', '#A855F7'], angle: 135 },
      logoPosition: 'top',
      textColor: '#FFFFFF',
      fontFamily: 'Arial',
      companyNameSize: 48,
      websiteSize: 28,
      showWebsite: true,
      showHandles: true,
    },
    {
      id: 'minimalist-dark',
      name: 'Minimalist Dark',
      background: { type: 'solid', colors: ['#111827'] },
      logoPosition: 'top',
      textColor: '#FFFFFF',
      fontFamily: 'Arial',
      companyNameSize: 48,
      websiteSize: 28,
      showWebsite: true,
      showHandles: true,
    },
    {
      id: 'professional-blue',
      name: 'Professional Blue',
      background: { type: 'solid', colors: ['#0A66C2'] },
      logoPosition: 'top',
      textColor: '#FFFFFF',
      fontFamily: 'Arial',
      companyNameSize: 48,
      websiteSize: 28,
      showWebsite: true,
      showHandles: true,
    },
    {
      id: 'earthy-sa',
      name: 'Earthy South African',
      background: { type: 'gradient', colors: ['#B45309', '#92400E'], angle: 160 },
      logoPosition: 'top',
      textColor: '#FFFBEB',
      fontFamily: 'Arial',
      companyNameSize: 48,
      websiteSize: 28,
      showWebsite: true,
      showHandles: true,
    },
    {
      id: 'modern-split',
      name: 'Modern Split',
      background: { type: 'gradient', colors: ['#1E293B', '#334155'], angle: 90 },
      logoPosition: 'center',
      textColor: '#F8FAFC',
      fontFamily: 'Arial',
      companyNameSize: 48,
      websiteSize: 28,
      showWebsite: true,
      showHandles: false,
    },
    {
      id: 'tech-grid',
      name: 'Tech Grid',
      background: { type: 'solid', colors: ['#0F172A'] },
      logoPosition: 'top',
      textColor: '#22D3EE',
      fontFamily: 'Arial',
      companyNameSize: 44,
      websiteSize: 24,
      showWebsite: true,
      showHandles: false,
    },
    {
      id: 'playful',
      name: 'Playful',
      background: { type: 'gradient', colors: ['#F472B6', '#FB923C'], angle: 120 },
      logoPosition: 'top',
      textColor: '#1F2937',
      fontFamily: 'Arial',
      companyNameSize: 48,
      websiteSize: 28,
      showWebsite: true,
      showHandles: true,
    },
  ];