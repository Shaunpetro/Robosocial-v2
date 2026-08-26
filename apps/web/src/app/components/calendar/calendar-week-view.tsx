// apps/web/src/app/components/calendar/calendar-week-view.tsx
"use client";

import { useState, DragEvent, MouseEvent } from "react";
import {
  Linkedin,
  Instagram,
  Twitter,
  Facebook,
  Globe,
  GripVertical,
  Check,
  Send,
  Calendar,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  content: string;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  topic: string | null;
  tone: string | null;
  hashtags: string[];
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
  companyId: string;
  platform: {
    id: string;
    type: string;
    name: string | null;
  } | null;
  postMedia: Array<{
    id: string;
    media: {
      id: string;
      url: string;
      type: string;
      filename: string;
    };
  }>;
}

interface DayData {
  date: Date;
  isToday: boolean;
  posts: Post[];
}

interface CalendarWeekViewProps {
  days: DayData[];
  onPostClick: (post: Post) => void;
  onPostDrop: (postId: string, newDate: Date, hour: number) => void;
  selectionMode?: boolean;
  selectedPostIds?: string[];
  onToggleSelection?: (postId: string) => void;
  onQuickStatusChange?: (postId: string, status: string) => void;
  onQuickDelete?: (postId: string) => void;
}

const PLATFORM_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  linkedin: { icon: Linkedin, color: "text-[#0A66C2]" },
  instagram: { icon: Instagram, color: "text-pink-600" },
  twitter: { icon: Twitter, color: "text-gray-900 dark:text-white" },
  x: { icon: Twitter, color: "text-gray-900 dark:text-white" },
  facebook: { icon: Facebook, color: "text-[#1877F2]" },
  wordpress: { icon: Globe, color: "text-[#21759B]" },
};

const TOPIC_COLORS: Record<string, string> = {
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

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-blue-500",
  PUBLISHED: "bg-green-500",
  DRAFT: "bg-gray-400",
  FAILED: "bg-red-500",
  PUBLISHING: "bg-yellow-500",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700",
  PUBLISHED: "bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700",
  DRAFT: "bg-[var(--bg-secondary)] border-[var(--border-default)]",
  FAILED: "bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700",
  PUBLISHING: "bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700",
};

const DISPLAY_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function CalendarWeekView({
  days,
  onPostClick,
  onPostDrop,
  selectionMode = false,
  selectedPostIds = [],
  onToggleSelection,
  onQuickStatusChange,
  onQuickDelete,
}: CalendarWeekViewProps) {
  const [dragOverSlot, setDragOverSlot] = useState<{ dayIndex: number; hour: number } | null>(null);
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const [popoverTimeout, setPopoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const getPlatformType = (platform: Post["platform"]): string => {
    if (!platform) return "unknown";
    return (platform.type || "").toLowerCase().replace(/[^a-z]/g, "");
  };

  const isPostSelected = (postId: string): boolean => selectedPostIds.includes(postId);
  const canSelectPost = (post: Post): boolean => post.status !== "PUBLISHED" && post.status !== "PUBLISHING";
  const getPostHour = (post: Post): number => {
    if (!post.scheduledFor) return 9;
    return new Date(post.scheduledFor).getHours();
  };

  const getPostsForHour = (dayPosts: Post[], hour: number): Post[] =>
    dayPosts.filter((post) => getPostHour(post) === hour);

  const handleDragOver = (e: DragEvent<HTMLDivElement>, dayIndex: number, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlot({ dayIndex, hour });
  };
  const handleDragLeave = () => setDragOverSlot(null);
  const handleDrop = (e: DragEvent<HTMLDivElement>, dayIndex: number, hour: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    const postId = e.dataTransfer.getData("postId");
    if (postId) onPostDrop(postId, days[dayIndex].date, hour);
  };

  const handlePostDragStart = (e: DragEvent<HTMLDivElement>, post: Post) => {
    if (selectionMode) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("postId", post.id);
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
  };

  const handlePostDragEnd = (e: DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
  };

  const handleCheckboxClick = (e: MouseEvent, postId: string) => {
    e.stopPropagation();
    onToggleSelection?.(postId);
  };

  const handleQuickPublish = (e: MouseEvent, postId: string) => {
    e.stopPropagation();
    onQuickStatusChange?.(postId, "PUBLISHED");
  };
  const handleQuickReschedule = (e: MouseEvent, post: Post, dayIndex: number, hour: number) => {
    e.stopPropagation();
    onPostDrop(post.id, days[dayIndex].date, hour);
  };
  const handleQuickDelete = (e: MouseEvent, post: Post) => {
    e.stopPropagation();
    onQuickDelete?.(post.id);
  };

  const showPopover = (postId: string) => {
    if (popoverTimeout) clearTimeout(popoverTimeout);
    setHoveredPostId(postId);
  };
  const hidePopover = () => {
    setPopoverTimeout(setTimeout(() => setHoveredPostId(null), 150));
  };

  const PostChip = ({ post, dayIndex, hour, compact = false }: {
    post: Post;
    dayIndex: number;
    hour: number;
    compact?: boolean;
  }) => {
    const platformType = getPlatformType(post.platform);
    const config = PLATFORM_CONFIG[platformType] || PLATFORM_CONFIG.wordpress;
    const Icon = config.icon;
    const statusColor = STATUS_COLORS[post.status] || STATUS_COLORS.DRAFT;
    const isDraggable = !selectionMode && canSelectPost(post);
    const isSelected = isPostSelected(post.id);
    const canSelect = canSelectPost(post);
    const topicBorderColor = post.topic && TOPIC_COLORS[post.topic] ? TOPIC_COLORS[post.topic] : "border-l-transparent";
    const statusDotColor = STATUS_STYLES[post.status] || "bg-gray-400";

    return (
      <div
        key={post.id}
        draggable={isDraggable}
        onDragStart={(e) => handlePostDragStart(e, post)}
        onDragEnd={handlePostDragEnd}
        onClick={() => onPostClick(post)}
        onMouseEnter={() => showPopover(post.id)}
        onMouseLeave={hidePopover}
        className={cn(
          "relative px-1 py-0.5 rounded border text-[10px] cursor-pointer transition-all hover:shadow-sm overflow-visible group",
          statusColor,
          topicBorderColor,
          "border-l-4",
          isDraggable && "cursor-grab active:cursor-grabbing",
          selectionMode && canSelect && "hover:ring-2 hover:ring-purple-400",
          isSelected && "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/50",
          selectionMode && !canSelect && "opacity-50 cursor-not-allowed",
          compact && "text-[11px] py-1"
        )}
      >
        <div className="flex items-center gap-0.5 min-w-0">
          {selectionMode ? (
            canSelect && (
              <button onClick={(e) => handleCheckboxClick(e, post.id)} className={cn(
                "w-3 h-3 rounded border flex items-center justify-center flex-shrink-0",
                isSelected ? "bg-purple-500 border-purple-500 text-white" : "border-[var(--border-default)] hover:border-purple-400"
              )}>
                {isSelected && <Check className="h-2 w-2" />}
              </button>
            )
          ) : (
            isDraggable && <GripVertical className="h-2.5 w-2.5 text-[var(--text-tertiary)] flex-shrink-0" />
          )}
          <Icon className={cn("h-2.5 w-2.5 flex-shrink-0", config.color)} />
          <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusDotColor)} />
          <span className="truncate text-[var(--text-primary)] font-medium min-w-0">
            {post.topic || post.content.substring(0, 15)}
          </span>

          {/* Quick action buttons (desktop: hover, mobile: always visible) */}
          <div className="hidden sm:group-hover:flex items-center gap-0.5 ml-auto flex-shrink-0">
            {canSelect && (
              <>
                <button onClick={(e) => handleQuickPublish(e, post.id)} className="p-0.5 text-green-600 hover:bg-green-50 rounded" title="Publish">
                  <Send className="h-3 w-3" />
                </button>
                <button onClick={(e) => handleQuickReschedule(e, post, dayIndex, hour)} className="p-0.5 text-brand-600 hover:bg-brand-50 rounded" title="Reschedule here">
                  <Calendar className="h-3 w-3" />
                </button>
                <button onClick={(e) => handleQuickDelete(e, post)} className="p-0.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
          {/* Mobile quick actions (always visible) */}
          <div className="flex sm:hidden items-center gap-0.5 ml-auto flex-shrink-0">
            {canSelect && (
              <>
                <button onClick={(e) => handleQuickPublish(e, post.id)} className="p-0.5 text-green-600" title="Publish"><Send className="h-3 w-3" /></button>
                <button onClick={(e) => handleQuickReschedule(e, post, dayIndex, hour)} className="p-0.5 text-brand-600" title="Reschedule"><Calendar className="h-3 w-3" /></button>
                <button onClick={(e) => handleQuickDelete(e, post)} className="p-0.5 text-red-600" title="Delete"><Trash2 className="h-3 w-3" /></button>
              </>
            )}
          </div>
        </div>

        {/* Hover popover */}
        {hoveredPostId === post.id && !selectionMode && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg shadow-xl z-20"
            onMouseEnter={() => showPopover(post.id)}
            onMouseLeave={hidePopover}
          >
            <p className="text-xs text-[var(--text-primary)] line-clamp-2">{post.content}</p>
            {post.topic && (
              <div className="mt-1 text-xs text-[var(--text-tertiary)]">Topic: {post.topic}</div>
            )}
            <div className="flex items-center gap-1 mt-1">
              <div className={cn("w-2 h-2 rounded-full", statusDotColor)} />
              <span className="text-[10px] text-[var(--text-secondary)] capitalize">{post.status.toLowerCase()}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Mobile rendering: vertical day cards
  const MobileWeekView = () => (
    <div className="sm:hidden flex flex-col gap-2 p-2 overflow-y-auto flex-1 min-h-0">
      {days.map((day, dayIndex) => (
        <div key={dayIndex} className="border border-[var(--border-subtle)] rounded-lg p-2">
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            {day.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            {day.isToday && (
              <span className="ml-1 px-1 py-0.5 bg-brand-500 text-white text-[10px] rounded-full">Today</span>
            )}
          </div>
          {day.posts.length === 0 ? (
            <div className="text-xs text-[var(--text-tertiary)] py-2">No posts</div>
          ) : (
            <div className="space-y-1">
              {DISPLAY_HOURS.map(hour => {
                const hourPosts = getPostsForHour(day.posts, hour);
                if (hourPosts.length === 0) return null;
                return (
                  <div key={hour} className="pl-2">
                    <div className="text-[10px] text-[var(--text-tertiary)] font-medium">{formatHour(hour)}</div>
                    <div className="space-y-0.5 mt-0.5">
                      {hourPosts.map(post => (
                        <PostChip key={post.id} post={post} dayIndex={dayIndex} hour={hour} compact />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Desktop: existing grid
  const DesktopWeekView = () => (
    <div className="hidden sm:flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-default)]">
            <div className="py-2 px-1 text-center text-[10px] font-semibold text-[var(--text-tertiary)] uppercase border-r border-[var(--border-subtle)]">
              Time
            </div>
            {days.map((day, index) => (
              <div
                key={index}
                className={cn(
                  "py-2 px-1 text-center border-r border-[var(--border-subtle)] last:border-r-0",
                  day.isToday && "bg-brand-500/5 dark:bg-brand-500/10"
                )}
              >
                <div className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase">
                  {DAYS_SHORT[day.date.getDay()]}
                </div>
                <div
                  className={cn(
                    "text-sm font-bold",
                    day.isToday
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-[var(--text-primary)]"
                  )}
                >
                  {day.date.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            {DISPLAY_HOURS.map((hour) => (
              <div key={hour} className="contents">
                <div className="h-12 border-b border-r border-[var(--border-subtle)] flex items-start justify-end pr-1 pt-0.5">
                  <span className="text-[10px] text-[var(--text-tertiary)]">{formatHour(hour)}</span>
                </div>
                {days.map((day, dayIndex) => {
                  const hourPosts = getPostsForHour(day.posts, hour);
                  const isDragOver =
                    dragOverSlot?.dayIndex === dayIndex && dragOverSlot?.hour === hour;
                  return (
                    <div
                      key={dayIndex}
                      onDragOver={(e) => handleDragOver(e, dayIndex, hour)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dayIndex, hour)}
                      className={cn(
                        "h-12 border-b border-r border-[var(--border-subtle)] last:border-r-0 p-0.5 transition-colors overflow-visible",
                        day.isToday && "bg-brand-500/5 dark:bg-brand-500/10",
                        isDragOver && "bg-brand-500/10 dark:bg-brand-500/20 ring-2 ring-inset ring-brand-500"
                      )}
                    >
                      <div className="space-y-0.5 h-full overflow-hidden">
                        {hourPosts.slice(0, 2).map((post) => (
                          <PostChip key={post.id} post={post} dayIndex={dayIndex} hour={hour} />
                        ))}
                        {hourPosts.length > 2 && (
                          <div className="text-[9px] text-[var(--text-tertiary)] px-0.5 truncate">
                            +{hourPosts.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <DesktopWeekView />
      <MobileWeekView />
    </>
  );
}