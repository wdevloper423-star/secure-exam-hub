import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";

/** Current wall-clock time, mounted client-side only (null during SSR). */
export function useNow(intervalMs = 30_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

import { Badge } from "@/components/ui/badge";
import { CONTENT_TYPE_LABELS, type AttemptStatus, type ContentType } from "@/lib/types";

export function FullPageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function TypeBadge({ type }: { type: ContentType }) {
  const variant =
    type === "quiz" ? "info" : type === "practical" ? "success" : type === "written" ? "warning" : "secondary";
  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {CONTENT_TYPE_LABELS[type]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: AttemptStatus }) {
  if (status === "active") {
    return (
      <Badge variant="info" className="gap-1.5 whitespace-nowrap">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        Active
      </Badge>
    );
  }
  return status === "submitted" ? (
    <Badge variant="success" className="whitespace-nowrap">
      Submitted
    </Badge>
  ) : (
    <Badge variant="destructive" className="whitespace-nowrap">
      Terminated
    </Badge>
  );
}

export function formatDateTime(isoStr?: string): string {
  if (!isoStr) return "—";
  return format(new Date(isoStr), "dd MMM yyyy, h:mm a");
}

export function formatDateTimeShort(isoStr?: string): string {
  if (!isoStr) return "—";
  return format(new Date(isoStr), "dd MMM, h:mm a");
}
