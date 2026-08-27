// apps/web/src/app/(dashboard)/calendar/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ChevronLeft, ChevronRight, RefreshCw, Calendar as CalendarIcon, Rows3,
  LayoutGrid, CheckSquare, X, Filter, ChevronDown, Check, Send, Trash2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PostChip, PostChipPost } from "@/app/components/calendar/post-chip";
import { CalendarWeekView } from "@/app/components/calendar/calendar-week-view";
import { PostDetailModal } from "@/app/components/calendar/post-detail-modal";
import { BulkActions } from "@/app/components/calendar/bulk-actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Company { id: string; name: string; }
interface Post {
  id: string;
  content: string;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  topic: string | null;
  tone: string | null;
  hashtags: string[];
  likes?: number; comments?: number; shares?: number; impressions?: number;
  companyId: string;
  platform: { id: string; type: string; name: string | null } | null;
  postMedia: Array<{ id: string; media: { id: string; url: string; type: string; filename: string } }>;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function startOfWeek(date: Date): Date {
  const d = new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d;
}
function addDays(date: Date, n: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function startOfDay(date: Date): Date {
  const d = new Date(date); d.setHours(0,0,0,0); return d;
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function toLocalISOString(date: Date): string {
  const year = date.getFullYear(); const month = String(date.getMonth()+1).padStart(2,"0"); const day = String(date.getDate()).padStart(2,"0");
  const hours = String(date.getHours()).padStart(2,"0"); const minutes = String(date.getMinutes()).padStart(2,"0"); const seconds = String(date.getSeconds()).padStart(2,"0");
  const tzOffset = -date.getTimezoneOffset(); const offsetHours = String(Math.floor(Math.abs(tzOffset)/60)).padStart(2,"0"); const offsetMinutes = String(Math.abs(tzOffset)%60).padStart(2,"0");
  const sign = tzOffset >= 0 ? "+" : "-";
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMinutes}`;
}
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const ROWS_DEFAULT = 4;
const ROWS_MAX = 26;

export default function GlobalCalendarPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [anchorDate, setAnchorDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "rolling">("rolling");
  const [weekRowCount, setWeekRowCount] = useState(ROWS_DEFAULT);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const draggingId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) setCompanies(await res.json());
      } catch (e) { console.error(e); }
      finally { setCompaniesLoading(false); }
    };
    fetchCompanies();
  }, []);

  const fetchPosts = useCallback(async () => {
    if (companies.length === 0) return;
    setLoading(true);
    try {
      const rangeStart = startOfWeek(anchorDate);
      const rangeEnd = addDays(rangeStart, weekRowCount * 7 - 1);
      const companyIds = selectedCompanyIds.length > 0 ? selectedCompanyIds : companies.map(c => c.id);
      const allPosts: Post[] = [];
      for (const companyId of companyIds) {
        const res = await fetch(`/api/posts?companyId=${companyId}&startDate=${encodeURIComponent(toLocalISOString(rangeStart))}&endDate=${encodeURIComponent(toLocalISOString(rangeEnd))}`);
        if (res.ok) {
          const data = await res.json();
          allPosts.push(...data.map((p: any) => ({ ...p, companyId })));
        }
      }
      setPosts(allPosts);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [companies, selectedCompanyIds, anchorDate, weekRowCount]);

  useEffect(() => {
    if (!companiesLoading) fetchPosts();
  }, [fetchPosts, companiesLoading]);

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(p.platform?.type?.toLowerCase() || "")) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status)) return false;
      return true;
    });
  }, [posts, selectedPlatforms, selectedStatuses]);

  function postsForDate(date: Date): Post[] {
    return filteredPosts.filter(p => p.scheduledFor && isSameDay(new Date(p.scheduledFor), date)).sort((a,b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime());
  }

  const weekStart = useMemo(() => startOfWeek(anchorDate), [anchorDate]);
  const weekDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return { date, isToday: isSameDay(date, today), posts: postsForDate(date) };
    });
  }, [weekStart, filteredPosts]);

  const rollingWeeks = useMemo(() => {
    const today = startOfDay(new Date());
    const rows = [];
    for (let w = 0; w < weekRowCount; w++) {
      const rowStart = addDays(weekStart, w * 7);
      const days = Array.from({ length: 7 }, (_, d) => {
        const date = addDays(rowStart, d);
        return { date, isToday: isSameDay(date, today), posts: postsForDate(date) };
      });
      const crossesIntoNewMonth = days.some((d) => d.date.getDate() === 1);
      const labelDate = w === 0 ? rowStart : days.find((d) => d.date.getDate() === 1)?.date;
      rows.push({
        key: w,
        days,
        label: w === 0 || crossesIntoNewMonth ? `${MONTHS[labelDate!.getMonth()]} ${labelDate!.getFullYear()}` : null,
      });
    }
    return rows;
  }, [weekStart, filteredPosts, weekRowCount]);

  useEffect(() => {
    if (viewMode !== "rolling") return;
    const node = sentinelRef.current;
    const root = scrollRef.current;
    if (!node || !root) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setWeekRowCount(c => Math.min(c + 3, ROWS_MAX));
    }, { root, rootMargin: "300px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [viewMode, weekRowCount]);

  const goToday = () => { setAnchorDate(new Date()); setWeekRowCount(ROWS_DEFAULT); };
  const goPrev = () => { if (viewMode === "week") setAnchorDate(d => addDays(d, -7)); else { setAnchorDate(d => addDays(d, -ROWS_DEFAULT * 7)); setWeekRowCount(ROWS_DEFAULT); } };
  const goNext = () => { if (viewMode === "week") setAnchorDate(d => addDays(d, 7)); else { setAnchorDate(d => addDays(d, ROWS_DEFAULT * 7)); setWeekRowCount(ROWS_DEFAULT); } };

  const reschedule = async (id: string, newDate: Date) => {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduledFor: toLocalISOString(newDate), status: "SCHEDULED" }) });
      if (res.ok) fetchPosts();
    } catch (e) { console.error(e); }
  };
  const setStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (res.ok) fetchPosts();
    } catch (e) { console.error(e); }
  };
  const removePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) fetchPosts();
    } catch (e) { console.error(e); }
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const clearSelection = () => { setSelectedIds([]); setSelectionMode(false); };
  const bulkPublish = async () => {
    try {
      await fetch("/api/posts/bulk", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postIds: selectedIds, action: "changeStatus", data: { status: "PUBLISHED" } }) });
      clearSelection(); fetchPosts();
    } catch (e) { console.error(e); }
  };
  const bulkDelete = async () => {
    if (!confirm("Delete selected posts?")) return;
    try {
      await fetch("/api/posts/bulk", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postIds: selectedIds, action: "delete" }) });
      clearSelection(); fetchPosts();
    } catch (e) { console.error(e); }
  };
  const bulkReschedule = async () => {
    const target = new Date(); target.setDate(target.getDate() + 1); target.setHours(9,0,0,0);
    try {
      await fetch("/api/posts/bulk", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postIds: selectedIds, action: "reschedule", data: { scheduledFor: toLocalISOString(target) } }) });
      clearSelection(); fetchPosts();
    } catch (e) { console.error(e); }
  };

  const onChipDragStart = (post: Post) => (e: React.DragEvent) => {
    if (selectionMode || post.status === "PUBLISHED" || post.status === "PUBLISHING") { e.preventDefault(); return; }
    draggingId.current = post.id;
    e.dataTransfer.effectAllowed = "move";
  };
  const onCellDragOver = (key: string) => (e: React.DragEvent) => { e.preventDefault(); setDragOverKey(key); };
  const onCellDrop = (date: Date, hour?: number) => (e: React.DragEvent) => {
    e.preventDefault(); setDragOverKey(null);
    const id = draggingId.current; draggingId.current = null;
    if (!id) return;
    const post = posts.find(p => p.id === id);
    const newDate = new Date(date);
    if (typeof hour === "number") newDate.setHours(hour, 0, 0, 0);
    else if (post) newDate.setHours(new Date(post.scheduledFor!).getHours(), new Date(post.scheduledFor!).getMinutes(), 0, 0);
    reschedule(id, newDate);
  };

  const visiblePosts = viewMode === "week" ? weekDays.flatMap(d => d.posts) : rollingWeeks.flatMap(row => row.days.flatMap(d => d.posts));
  const stats = {
    scheduled: visiblePosts.filter(p => p.status === "SCHEDULED").length,
    published: visiblePosts.filter(p => p.status === "PUBLISHED").length,
    draft: visiblePosts.filter(p => p.status === "DRAFT").length,
  };

  const headerLabel = viewMode === "week" ? `${weekStart.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${addDays(weekStart,6).toLocaleDateString(undefined,{month:"short",day:"numeric"})}` : `${weekStart.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${addDays(weekStart, weekRowCount*7-1).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`;

  if (companiesLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-500" /></div>;
  if (companies.length === 0) return <div className="p-8 text-center">No companies found. Create a company first.</div>;

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="flex items-center gap-1.5 text-base font-bold text-gray-900">
            <CalendarIcon className="h-4 w-4 text-blue-500" /> Content Calendar
          </h1>
          <div className="hidden md:flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> {stats.scheduled} scheduled
            </span>
            <span className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {stats.published} published
            </span>
            <span className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> {stats.draft} drafts
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => setSelectionMode(s => !s)} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${selectionMode ? "bg-purple-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
            <CheckSquare className="h-3.5 w-3.5" /> {selectionMode ? "Done" : "Select"}
          </button>
          <button onClick={() => fetchPosts()} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={goToday} className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">
            {viewMode === "week" ? "This week" : "Back to today"}
          </button>
          <div className="flex items-center gap-0.5 rounded-md border border-gray-200 p-0.5">
            <button onClick={goPrev} className="rounded p-1 hover:bg-gray-100"><ChevronLeft className="h-3.5 w-3.5 text-gray-500" /></button>
            <span className="min-w-[120px] px-1 text-center text-xs font-semibold text-gray-800">{headerLabel}</span>
            <button onClick={goNext} className="rounded p-1 hover:bg-gray-100"><ChevronRight className="h-3.5 w-3.5 text-gray-500" /></button>
          </div>
          <div className="flex items-center gap-0.5 rounded-md bg-gray-100 p-0.5">
            <button onClick={() => setViewMode("week")} className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${viewMode === "week" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              <Rows3 className="h-3 w-3" /> Week
            </button>
            <button onClick={() => { setViewMode("rolling"); setWeekRowCount(ROWS_DEFAULT); }} className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${viewMode === "rolling" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              <LayoutGrid className="h-3 w-3" /> Weeks
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
        <span className="flex items-center gap-1 text-xs text-gray-400"><Filter className="h-3 w-3" /> Filters:</span>
        <div className="relative">
          <button onClick={() => { setShowPlatformDropdown(s => !s); setShowStatusDropdown(false); }} className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${selectedPlatforms.length ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>
            Platform {selectedPlatforms.length > 0 && `(${selectedPlatforms.length})`} <ChevronDown className="h-3 w-3" />
          </button>
          {showPlatformDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPlatformDropdown(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {["linkedin","instagram","twitter","facebook","wordpress"].map(key => (
                  <button key={key} onClick={() => setSelectedPlatforms(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])} className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                    <div className={`h-4 w-4 rounded ${key === "linkedin" ? "bg-blue-600" : key === "instagram" ? "bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500" : key === "twitter" ? "bg-black" : key === "facebook" ? "bg-blue-700" : "bg-slate-600"}`}></div>
                    <span className="flex-1 text-left capitalize">{key}</span>
                    {selectedPlatforms.includes(key) && <Check className="h-3 w-3 text-blue-500" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="relative">
          <button onClick={() => { setShowStatusDropdown(s => !s); setShowPlatformDropdown(false); }} className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${selectedStatuses.length ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>
            Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`} <ChevronDown className="h-3 w-3" />
          </button>
          {showStatusDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {Object.entries({ DRAFT: "Draft", SCHEDULED: "Scheduled", PUBLISHING: "Publishing", PUBLISHED: "Published", FAILED: "Failed" }).map(([key,label]) => (
                  <button key={key} onClick={() => setSelectedStatuses(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])} className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                    <span className={`h-2 w-2 rounded-full ${key === "DRAFT" ? "bg-gray-400" : key === "SCHEDULED" ? "bg-blue-500" : key === "PUBLISHING" ? "bg-yellow-500" : key === "PUBLISHED" ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="flex-1 text-left">{label}</span>
                    {selectedStatuses.includes(key) && <Check className="h-3 w-3 text-blue-500" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {(selectedPlatforms.length > 0 || selectedStatuses.length > 0) && (
          <button onClick={() => { setSelectedPlatforms([]); setSelectedStatuses([]); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /> Clear</button>
        )}
      </div>

      {/* Calendar body */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        ) : viewMode === "week" ? (
          <CalendarWeekView
            days={weekDays.map(d => ({ ...d, posts: d.posts as PostChipPost[] }))}
            onPostClick={(post) => setActivePost(post as unknown as Post)}
            onPostDrop={reschedule}
            selectionMode={selectionMode}
            selectedPostIds={selectedIds}
            onToggleSelection={toggleSelect}
            onQuickStatusChange={setStatus}
            onQuickDelete={removePost}
          />
        ) : (
          <div>
            <div className="grid grid-cols-7 border-b border-gray-100 sticky top-0 bg-white z-10">
              {DAYS_SHORT.map(d => <div key={d} className="py-1.5 text-center text-[10px] font-semibold uppercase text-gray-400">{d}</div>)}
            </div>
            {rollingWeeks.map((row) => (
              <div key={row.key}>
                {row.label && <div className="bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-500 border-b border-gray-100">{row.label}</div>}
                <div className="grid grid-cols-7">
                  {row.days.map((day, i) => (
                    <div key={i} onDragOver={onCellDragOver(`r-${row.key}-${i}`)} onDrop={onCellDrop(day.date)} className={`flex h-24 flex-col overflow-hidden border-b border-r border-gray-100 p-1 ${day.isToday ? "bg-blue-50/40" : ""} ${dragOverKey === `r-${row.key}-${i}` ? "ring-2 ring-blue-400 ring-inset" : ""}`}>
                      <span className={`mb-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${day.isToday ? "bg-blue-600 text-white" : "text-gray-700"}`}>{day.date.getDate()}</span>
                      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                        {day.posts.slice(0,3).map(post => (
                          <PostChip key={post.id} post={post as PostChipPost} compact selectionMode={selectionMode} selected={selectedIds.includes(post.id)} onSelect={toggleSelect} onQuickStatusChange={setStatus} onQuickDelete={removePost} onReschedule={(id,newDate)=>reschedule(id,newDate)} onPostClick={(p) => setActivePost(p as unknown as Post)} />
                        ))}
                        {day.posts.length > 3 && <span className="px-1 text-[10px] font-medium text-blue-600">+{day.posts.length-3} more</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={sentinelRef} className="flex items-center justify-center py-3 text-[11px] text-gray-300">
              {weekRowCount >= ROWS_MAX ? "That's as far as we go" : "Loading more weeks..."}
            </div>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <BulkActions
          selectedCount={selectedIds.length}
          selectedPostIds={selectedIds}
          onBulkReschedule={bulkReschedule}
          onBulkDelete={bulkDelete}
          onBulkStatusChange={(status) => bulkPublish()}
          onClearSelection={clearSelection}
          isProcessing={false}
        />
      )}

      {/* Post detail modal */}
      {activePost && (
        <PostDetailModal
          isOpen={!!activePost}
          onClose={() => setActivePost(null)}
          post={activePost}
          onUpdate={fetchPosts}
        />
      )}
    </div>
  );
}