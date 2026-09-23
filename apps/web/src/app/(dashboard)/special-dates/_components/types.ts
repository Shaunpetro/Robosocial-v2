// apps/web/src/app/(dashboard)/special-dates/_components/types.ts
// Shared types for the Special Dates hub. Split out of page.tsx during SD-3.

export interface Company {
    id: string;
    name: string;
    logoUrl: string | null;
    website: string | null;
  }
  
  export interface SidebarCompany {
    id: string;
    name: string;
    logoUrl: string | null;
    industry: string | null;
    platforms: Array<{ id: string; type: string; platformName: string }>;
    intelligence: { id: string; onboardingCompleted: boolean } | null;
  }
  
  export interface HolidaySet {
    id: string;
    label: string;
    description: string;
  }
  
  export interface UpcomingHoliday {
    name: string;
    date: string;
    isoDate: string;
    description: string;
    setId: string;
    categories: string[];
    major: boolean;
    tone?: string;
    hashtags?: string[];
  }
  
  export interface Config {
    enabled: boolean;
    holidaySets: string[];
    excludedHolidays: string[];
    logoMediaId?: string | null;
    generatedMediaId?: string | null;
    templateId?: string | null;
    compositionId?: string | null;
    logoPosition?: "top" | "center" | "bottom";
    showWebsite?: boolean;
    showHandles?: boolean;
    tagline?: string | null;
    dedication?: string | null;
    useStockBackgrounds?: boolean;
    lastScheduledTermId?: string | null;
  }
  
  export interface BrandInfo {
    website?: string | null;
    socialLinks?: Record<string, string> | null;
    socialHandles?: Record<string, string> | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    contactWhatsapp?: string | null;
    brandColors?: Record<string, string> | null;
  }
  
  export interface TermPlan {
    term: {
      id: string;
      label: string;
      startIso: string;
      endIso: string;
      effectiveStartIso: string;
      effectiveEndIso: string;
      daysRemaining: number;
      isMidTerm: boolean;
    };
    holidays: Array<{
      name: string;
      isoDate: string;
      displayDate: string;
      description: string;
      tone: string;
      setId: string;
      categories: string[];
    }>;
    platforms: Array<{
      id: string;
      type: string;
      label: string;
      name: string;
      compatible: boolean;
      skipReason?: string;
    }>;
    totalPosts: number;
    canCommit: boolean;
    blockReason?: string;
    alreadyScheduled: boolean;
    lastScheduledTermId: string | null;
  }
  
  export interface ScheduledPostRef {
    postId: string;
    platformId: string;
    platformLabel: string;
    status: string;
    mediaId: string | null;
    mediaUrl: string | null;
  }
  
  export interface SchedulableHoliday {
    name: string;
    isoDate: string;
    displayDate: string;
    description: string;
    tone: string;
    setId: string;
    categories: string[];
    alreadyScheduledPlatforms: string[];
    scheduledPosts: ScheduledPostRef[];
  }
  
  export interface SchedulableHolidaysResponse {
    window: {
      startIso: string;
      endIso: string;
      daysRemaining: number;
      isShortWindow: boolean;
      termLabel: string | null;
      isBetweenTerms: boolean;
    };
    holidays: SchedulableHoliday[];
    compatiblePlatforms: Array<{
      id: string;
      type: string;
      label: string;
      name: string;
    }>;
  }
  
  export interface CommitProgress {
    holidayName: string;
    index: number;
    total: number;
    status: "pending" | "success" | "error";
    postsCreated: number;
    errors: string[];
  }
  
  export interface ManualProgress {
    holidayName: string;
    status: "pending" | "success" | "error";
    postsCreated: number;
    errors: string[];
  }
  
  export type SaveStatus = "idle" | "saving" | "saved" | "error";
  export type UploadStage = "idle" | "uploading";