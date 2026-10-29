import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";

import { StatusBadge, formatDateTimeShort, useNow } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listMonitoring } from "@/lib/mock-api";
import type { AttemptWithExam } from "@/lib/types";

export const Route = createFileRoute("/_staff/monitoring")({
  head: () => ({
    meta: [
      { title: "Live Monitoring · QuizLab Pro" },
      { name: "description", content: "Watch students currently attempting exams, with violations and status." },
      { property: "og:title", content: "Live Monitoring · QuizLab Pro" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LiveMonitoringPage,
});

function LiveMonitoringPage() {
  const [rows, setRows] = useState<AttemptWithExam[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const now = useNow(5000);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      const data = await listMonitoring();
      if (!alive) return;
      setRows(data);
      setUpdatedAt(new Date());
    };
    void poll();
    const timer = setInterval(() => void poll(), 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const active = rows.filter((r) => r.attempt.status === "active").length;
  const terminated = rows.filter((r) => r.attempt.status === "terminated").length;
  const submitted = rows.filter((r) => r.attempt.status === "submitted").length;

  const elapsed = (startedAt: string): string => {
    if (now === null) return "—";
    const mins = Math.max(0, Math.round((now - new Date(startedAt).getTime()) / 60_000));
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Live Monitoring</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Students currently attempting exams — auto-refreshing every 5 seconds.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void listMonitoring().then((d) => { setRows(d); setUpdatedAt(new Date()); })}
        >
          <RefreshCw className="size-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Activity, label: "Active now", value: active, tone: "bg-primary/10 text-primary" },
          { icon: CheckCircle2, label: "Submitted", value: submitted, tone: "bg-success/10 text-success" },
          { icon: ShieldAlert, label: "Terminated", value: terminated, tone: "bg-destructive/10 text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="flex items-center gap-4">
              <span className={`flex size-11 items-center justify-center rounded-xl ${s.tone}`}>
                <s.icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead className="hidden md:table-cell">Started</TableHead>
              <TableHead>In exam</TableHead>
              <TableHead>Violations</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No attempts yet today.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.attempt.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{r.attempt.studentName}</p>
                    <p className="text-xs text-muted-foreground">{r.exam.batch}</p>
                  </TableCell>
                  <TableCell className="max-w-52">
                    <p className="truncate text-sm text-foreground">{r.exam.title}</p>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {formatDateTimeShort(r.attempt.startedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.attempt.status === "active" ? elapsed(r.attempt.startedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    {r.attempt.violations > 0 ? (
                      <Badge variant="destructive">{r.attempt.violations} violation{r.attempt.violations > 1 ? "s" : ""}</Badge>
                    ) : (
                      <Badge variant="success">Clean</Badge>
                    )}
                    {r.attempt.terminateReason && (
                      <p className="mt-1 text-xs text-destructive">{r.attempt.terminateReason}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.attempt.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {updatedAt && (
        <p className="text-xs text-muted-foreground">
          Last updated at {formatDateTimeShort(updatedAt.toISOString())}
        </p>
      )}
    </div>
  );
}
