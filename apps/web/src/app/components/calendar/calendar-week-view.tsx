// apps/web/src/app/components/calendar/calendar-week-view.tsx
"use client";

import { useState, DragEvent } from "react";
import { cn } from "@/lib/utils";
import { PostChip, PostChipPost } from "./post-chip";

interface DayData {
  date: Date;
  isToday: boolean;
  posts: PostChipPost[];
}

interface CalendarWeekViewProps {
  days: DayData[];
  onPostClick: (post: any) => void;   // widened to accept Post or PostChipPost
  onPostDrop: (postId: string, newDate: Date, hour: number) => void;
  selectionMode?: boolean;
  selectedPostIds?: string[];
  onToggleSelection?: (postId: string) => void;
  onQuickStatusChange?: (postId: string, status: string) => void;
  onQuickDelete?: (postId: string) => void;
}

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>, dayIndex: number, hour?: number) => {
    e.preventDefault();
    setDragOverDay(dayIndex);
    if (hour !== undefined) setDragOverHour(hour);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dayIndex: number, hour?: number) => {
    e.preventDefault();
    setDragOverDay(null);
    setDragOverHour(null);
    const postId = e.dataTransfer.getData("postId");
    if (postId && onPostDrop) {
      onPostDrop(postId, days[dayIndex].date, hour ?? 9);
    }
  };

  const MobileAgenda = () => (
    <div className="flex flex-col gap-2 p-2 sm:hidden">
      {days.map((day, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-2">
          <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-800">
            {day.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            {day.isToday && <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-medium text-white">Today</span>}
          </div>
          {day.posts.length === 0 ? (
            <div className="py-1 text-xs text-gray-300">No posts</div>
          ) : (
            <div className="space-y-1">
              {day.posts.map((post) => (
                <div key={post.id} onDragOver={(e) => handleDragOver(e, i)} onDrop={(e) => handleDrop(e, i)}>
                  <PostChip
                    post={post}
                    compact
                    selectionMode={selectionMode}
                    selected={selectedPostIds.includes(post.id)}
                    onSelect={onToggleSelection}
                    onQuickStatusChange={onQuickStatusChange}
                    onQuickDelete={onQuickDelete}
                    onReschedule={(postId, newDate) => onPostDrop(postId, newDate, 9)}
                    onPostClick={onPostClick}
                    date={day.date}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const DesktopWeekGrid = () => (
    <div className="hidden sm:block">
      <div className="grid grid-cols-7 gap-px bg-gray-100">
        {days.map((day, i) => (
          <div key={i} className={cn("flex min-h-[420px] flex-col bg-white p-1.5", day.isToday && "bg-blue-50/40")}>
            <div className="mb-1.5 flex items-center justify-between px-0.5">
              <span className="text-[10px] font-semibold uppercase text-gray-400">{DAYS_SHORT[day.date.getDay()]}</span>
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold", day.isToday ? "bg-blue-600 text-white" : "text-gray-700")}>
                {day.date.getDate()}
              </span>
            </div>
            <div
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              className={cn("flex-1 space-y-1 rounded-md p-1 transition-colors", dragOverDay === i && "bg-blue-100 ring-2 ring-blue-400 ring-inset")}
            >
              {day.posts.map((post) => (
                <PostChip
                  key={post.id}
                  post={post}
                  selectionMode={selectionMode}
                  selected={selectedPostIds.includes(post.id)}
                  onSelect={onToggleSelection}
                  onQuickStatusChange={onQuickStatusChange}
                  onQuickDelete={onQuickDelete}
                  onReschedule={(postId, newDate) => onPostDrop(postId, newDate, 9)}
                  onPostClick={onPostClick}
                  date={day.date}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <MobileAgenda />
      <DesktopWeekGrid />
    </>
  );
}