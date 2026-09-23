// apps/web/src/app/(dashboard)/special-dates/_components/constants.ts
// Static option lists for the Special Dates hub. Split out of page.tsx during SD-3.

export const TEMPLATES = [
    { id: "clean-corporate", label: "Clean", bg: "bg-white border border-gray-200" },
    { id: "bold-gradient", label: "Gradient", bg: "bg-gradient-to-r from-purple-500 to-pink-500" },
    { id: "minimalist-dark", label: "Dark", bg: "bg-gray-900" },
    { id: "professional-blue", label: "Blue", bg: "bg-[#0A66C2]" },
    { id: "earthy-sa", label: "Earthy", bg: "bg-gradient-to-r from-amber-700 to-amber-900" },
    { id: "modern-split", label: "Split", bg: "bg-gradient-to-r from-slate-800 to-slate-600" },
    { id: "tech-grid", label: "Tech", bg: "bg-slate-900 border border-cyan-500/40" },
    { id: "playful", label: "Playful", bg: "bg-gradient-to-r from-pink-400 to-orange-400" },
  ];
  
  export const LOGO_POSITIONS = [
    { id: "top", label: "Top" },
    { id: "center", label: "Center" },
    { id: "bottom", label: "Bottom" },
  ] as const;
  
  export const CATEGORIES: { id: string; label: string; description: string }[] = [
    { id: "public", label: "Public holidays", description: "National days off" },
    { id: "awareness", label: "Awareness days", description: "Health, environment, social causes" },
    { id: "cultural", label: "Cultural moments", description: "Heritage, community, seasonal" },
    { id: "religious", label: "Religious observances", description: "Faith-based celebrations" },
    { id: "commercial", label: "Commercial moments", description: "Gift-giving and retail days" },
  ];
  
  export const ALL_PLATFORMS = [
    "linkedin",
    "facebook",
    "twitter",
    "instagram",
    "youtube",
    "tiktok",
    "pinterest",
    "threads",
  ];
  
  export const DEFAULT_ENABLED_CATEGORIES = [
    "public",
    "awareness",
    "cultural",
    "religious",
    "commercial",
  ];