import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  Eye,
  LibraryBig,
  Upload,
} from "lucide-react";

import { StatusBadge, formatDateTimeShort } from "@/components/shared/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listExams, listMonitoring, listMyLibrary, listResults } from "@/lib/mock-api";
import type { AttemptWithExam, Exam, LibraryItem } from "@/lib/types";

export const Route = createFileRoute("/_staff/dashboard")({
  head: () => ({
    meta: [
      { title: "Staff Dashboard · QuizLab Pro" },
      { name: "description", content: "Overview of your content, scheduled exams, live attempts and results." },
      { property: "og:title", content: "Staff Dashboard · QuizLab Pro" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffDashboard,
});

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof Eye; label: string; value: string | number; hint: string }) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StaffDashboard() {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [monitoring, setMonitoring] = useState<AttemptWithExam[]>([]);
  const [results, setResults] = useState<AttemptWithExam[]>([]);

  useEffect(() => {
    void (async () => {
      setLibrary(await listMyLibrary());
      setExams(await listExams());
      setMonitoring(await listMonitoring());
      setResults(await listResults());
    })();
  }, []);

  const activeCount = monitoring.filter((r) => r.attempt.status === "active").length;
  const recent = results.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back — here's what's happening across your courses today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={LibraryBig} label="Library Items" value={library.length} hint="Content you created" />
        <StatCard icon={CalendarClock} label="Scheduled Exams" value={exams.length} hint="Across all batches" />
        <StatCard icon={Activity} label="Active Attempts" value={activeCount} hint="Students writing right now" />
        <StatCard icon={ClipboardCheck} label="Results In" value={results.length} hint="Submitted or terminated" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { to: "/create", label: "Create / Upload Content", desc: "Quiz, practical, written or other", icon: Upload },
              { to: "/schedule", label: "Schedule Exam", desc: "Pick content, set time & batch", icon: CalendarClock },
              { to: "/monitoring", label: "Live Monitoring", desc: "Watch attempts in progress", icon: Activity },
              { to: "/results", label: "View Results", desc: "Scores and terminated attempts", icon: ClipboardCheck },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
              >
                <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <a.icon className="size-4" />
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                  {a.label}
                  <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{a.desc}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="font-display text-base">Recent activity</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary">
              <Link to="/results">All results</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No completed attempts yet.</p>
            ) : (
              <ul className="divide-y">
                {recent.map((r) => (
                  <li key={r.attempt.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{r.attempt.studentName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.exam.title} · {formatDateTimeShort(r.attempt.endedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {r.attempt.score !== undefined && (
                        <span className="text-sm font-semibold text-foreground">
                          {r.attempt.score}/{r.attempt.totalMarks}
                        </span>
                      )}
                      <StatusBadge status={r.attempt.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
