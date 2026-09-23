// apps/web/src/app/(dashboard)/special-dates/_components/SaveStatusIndicator.tsx

"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { SaveStatus } from "./types";

interface Props {
  status: SaveStatus;
}

export default function SaveStatusIndicator({ status }: Props) {
  return (
    <div className="text-xs text-[var(--text-tertiary)]">
      {status === "saving" && (
        <span className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving...
        </span>
      )}
      {status === "saved" && (
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-3 w-3" /> Saved
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-3 w-3" /> Save failed
        </span>
      )}
    </div>
  );
}