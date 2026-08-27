// apps/web/src/app/components/calendar/post-chip.tsx
"use client";

import { GripVertical, Check, Send, Calendar, Trash2, Linkedin, Instagram, Twitter, Facebook, Globe, Clock, CheckCircle2, XCircle, Loader2, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PostChipPost {
  id: string;
  content: string;
  status: string;
  scheduledFor: string | null;
  topic: string | null;
  platform: {
    id: string;
    type: string;
    name: string | null;
  } | null;
}

interface PostChipProps {
  post: PostChipPost;
  compact?: boolean;
  mini?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: (postId: string) => void;
  onQuickStatusChange?: (postId: string, status: string) => void;
  onQuickDelete?: (postId: string) => void;
  onReschedule?: (postId: string, newDate: Date) => void;
  onPostClick?: (post: any) => void;
  date?: Date;
}

interface PlatformConfig {
  icon: typeof Linkedin;
  chip: string;
  label: string;
}

const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  linkedin: { icon: Linkedin, chip: "bg-blue-600", label: "LinkedIn" },
  instagram: { icon: Instagram, chip: "bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500", label: "Instagram" },
  twitter: { icon: Twitter, chip: "bg-black", label: "X (Twitter)" },
  facebook: { icon: Facebook, chip: "bg-blue-700", label: "Facebook" },
  wordpress: { icon: Globe, chip: "bg-slate-600", label: "WordPress" },
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  DRAFT: { icon: Edit3, color: "text-gray-400" },
  SCHEDULED: { icon: Clock, color: "text-blue-500" },
  PUBLISHING: { icon: Loader2, color: "text-yellow-500" },
  PUBLISHED: { icon: CheckCircle2, color: "text-green-500" },
  FAILED: { icon: XCircle, color: "text-red-500" },
};

const TOPIC_BORDER: Record<string, string> = {
  educational: "border-l-blue-500",
  tips: "border-l-cyan-500",
  engagement: "border-l-pink-500",
  community: "border-l-purple-500",
  behindTheScenes: "border-l-orange-500",
  caseStudy: "border-l-indigo-500",
  testimonial: "border-l-green-500",
  promotional: "border-l-red-500",
  motivational: "border-l-yellow-500",
  news: "border-l-teal-500",
};

function formatTime(dateString: string): string {
  const d = new Date(dateString);
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const displayHours = hours % 12 || 12;
  const ampm = hours < 12 ? "AM" : "PM";
  return `${displayHours}:${minutes} ${ampm}`;
}

export function PostChip({
  post,
  compact = false,
  mini = false,
  selectionMode = false,
  selected = false,
  onSelect,
  onQuickStatusChange,
  onQuickDelete,
  onReschedule,
  onPostClick,
  date,
}: PostChipProps) {
  const platformKey = post.platform?.type?.toLowerCase() || "wordpress";
  const config = PLATFORM_CONFIG[platformKey] || PLATFORM_CONFIG.wordpress;
  const Icon = config.icon;
  const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = statusConfig.icon;
  const isDraggable = !selectionMode && post.status !== "PUBLISHED" && post.status !== "PUBLISHING";
  const canSelect = post.status !== "PUBLISHED" && post.status !== "PUBLISHING";

  const handleQuickPublish = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickStatusChange?.(post.id, "PUBLISHED");
  };
  const handleQuickDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickDelete?.(post.id);
  };
  const handleReschedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (date) onReschedule?.(post.id, date);
  };

  const handleClick = () => {
    if (selectionMode) {
      if (canSelect) onSelect?.(post.id);
    } else {
      onPostClick?.(post);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("postId", post.id);
    e.dataTransfer.effectAllowed = "move";
    if (post.scheduledFor) {
      const d = new Date(post.scheduledFor);
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      e.dataTransfer.setData("originalTime", `${hours}:${minutes}`);
    }
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
  };

  const topicBorder = post.topic && TOPIC_BORDER[post.topic] ? TOPIC_BORDER[post.topic] : "border-l-transparent";

  // Mini mode – vertical quick actions on hover
  if (mini) {
    return (
      <div
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        className={cn(
          "group relative flex items-center justify-center gap-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5 shadow-sm hover:shadow cursor-pointer w-full min-w-0 overflow-visible",
          selected && "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30",
          post.status === "PUBLISHED" && "opacity-60",
          isDraggable && "cursor-grab active:cursor-grabbing"
        )}
        title={`${post.status}${post.scheduledFor ? ` • ${formatTime(post.scheduledFor)}` : ""}`}
      >
        {!selectionMode && isDraggable && (
          <GripVertical className="absolute left-0 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 flex-shrink-0" />
        )}
        <div className={cn("flex h-4 w-4 flex-shrink-0 items-center justify-center rounded", config.chip)}>
          <Icon className="h-3 w-3 text-white" strokeWidth={2.5} />
        </div>
        <StatusIcon className={cn("h-3 w-3 flex-shrink-0", statusConfig.color)} />

        {/* Vertical quick actions */}
        {!selectionMode && canSelect && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleQuickPublish} className="p-0.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded" title="Publish">
              <Send className="h-3 w-3" />
            </button>
            <button onClick={handleReschedule} className="p-0.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded" title="Reschedule to this day">
              <Calendar className="h-3 w-3" />
            </button>
            <button onClick={handleQuickDelete} className="p-0.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Delete">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Standard mode – vertical quick actions on hover (right side)
  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={cn(
        "group relative flex items-center gap-1.5 rounded-md border-l-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 py-1 text-left shadow-sm hover:shadow transition-shadow cursor-pointer w-full min-w-0 overflow-hidden",
        topicBorder,
        selected && "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/30",
        post.status === "PUBLISHED" && "opacity-60",
        isDraggable && "cursor-grab active:cursor-grabbing"
      )}
    >
      {selectionMode && canSelect && (
        <div className={cn("flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border", selected ? "border-purple-500 bg-purple-500 text-white" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800")}>
          {selected && <Check className="h-2.5 w-2.5" />}
        </div>
      )}
      {!selectionMode && isDraggable && <GripVertical className="h-3 w-3 flex-shrink-0 text-gray-300 dark:text-gray-600" />}
      <div className={cn("flex items-center justify-center rounded", config.chip, "h-4 w-4 flex-shrink-0")}>
        <Icon className="h-3 w-3 text-white" strokeWidth={2.5} />
      </div>
      <StatusIcon className={cn("h-3.5 w-3.5 flex-shrink-0", statusConfig.color)} />
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700 dark:text-gray-300">
        {compact ? post.content : post.scheduledFor ? formatTime(post.scheduledFor) : "—"}
      </span>

      {!selectionMode && canSelect && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleQuickPublish} className="p-0.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded" title="Publish">
            <Send className="h-3 w-3" />
          </button>
          <button onClick={handleReschedule} className="p-0.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded" title="Reschedule to this day">
            <Calendar className="h-3 w-3" />
          </button>
          <button onClick={handleQuickDelete} className="p-0.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Delete">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="sm:hidden flex items-center gap-0.5 flex-shrink-0">
        {canSelect && (
          <>
            <button onClick={handleQuickPublish} className="p-0.5 text-green-600" title="Publish"><Send className="h-3 w-3" /></button>
            <button onClick={handleReschedule} className="p-0.5 text-brand-600" title="Reschedule"><Calendar className="h-3 w-3" /></button>
            <button onClick={handleQuickDelete} className="p-0.5 text-red-600" title="Delete"><Trash2 className="h-3 w-3" /></button>
          </>
        )}
      </div>
    </div>
  );
}