import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, Clock, FileText, Lock, PlayCircle, ShieldCheck, Trophy } from "lucide-react";

import { TypeBadge, formatDateTime, useNow } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listStudentExams } from "@/lib/mock-api";
import type { ExamWithAttempt } from "@/lib/types";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "My Exams · QuizLab Pro" },
      { name: "description", content: "Your upcoming and completed exams." },
      { property: "og:title", content: "My Exams · QuizLab Pro" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const [rows, setRows] = useState<ExamWithAttempt[]>([]);
  const now = useNow(1000);

  useEffect(() => {
    void listStudentExams().then(setRows);
  }, []);

  const windowOf = (r: ExamWithAttempt): "live" | "upcoming" | "ended" => {
    if (now === null) return "upcoming";
    const start = new Date(r.exam.startAt).getTime();
    const end = start + r.exam.durationMinutes * 60_000;
    if (now < start) return "upcoming";
    if (now <= end) return "live";
    return "ended";
  };

  const pending = rows.filter((r) => !r.attempt || r.attempt.status === "active");
  const completed = rows.filter((r) => r.attempt && r.attempt.status !== "active");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">My Exams</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upcoming exams unlock automatically at their scheduled time.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarClock className="size-4" /> Upcoming & live
        </h2>
        {pending.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No upcoming exams right now — you're all caught up.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((r) => {
              const win = windowOf(r);
              return (
                <Card key={r.exam.id} className="shadow-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="font-display text-base text-foreground">{r.exam.title}</CardTitle>
                        <CardDescription>{r.exam.subject}</CardDescription>
                      </div>
                      <TypeBadge type={r.exam.type} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
                        <Clock className="size-3.5" /> {r.exam.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
                        <FileText className="size-3.5" /> {r.exam.totalMarks} marks
                      </span>
                      {r.exam.shuffleQuestions && (
                        <span className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
                          <ShieldCheck className="size-3.5" /> Shuffled & proctored
                        </span>
                      )}
                    </div>

                    {win === "live" ? (
                      <Button asChild className="w-full">
                        <Link to="/student/exam/$id" params={{ id: r.exam.id }}>
                          <PlayCircle className="size-4" /> Start Exam
                        </Link>
                      </Button>
                    ) : win === "upcoming" ? (
                      <div>
                        <Button disabled className="w-full">
                          <Lock className="size-4" /> Start Exam
                        </Button>
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                          Unlocks at {formatDateTime(r.exam.startAt)}
                        </p>
                      </div>
                    ) : (
                      <Button disabled variant="outline" className="w-full">
                        Exam window closed
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Trophy className="size-4" /> Completed
        </h2>
        {completed.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Your completed exams and results will appear here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {completed.map((r) => (
              <Card key={r.exam.id} className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="font-display text-base text-foreground">{r.exam.title}</CardTitle>
                      <CardDescription>{r.exam.subject}</CardDescription>
                    </div>
                    <Badge
                      variant={r.attempt!.status === "submitted" ? "success" : "destructive"}
                    >
                      {r.attempt!.status === "submitted" ? "Submitted" : "Terminated"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {r.attempt!.score !== undefined ? (
                    <p className="text-sm text-muted-foreground">
                      Score: <span className="font-semibold text-foreground">{r.attempt!.score}/{r.attempt!.totalMarks}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Awaiting faculty grading</p>
                  )}
                  {r.attempt!.terminateReason && (
                    <p className="text-xs text-destructive">Reason: {r.attempt!.terminateReason}</p>
                  )}
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/student/result/$id" params={{ id: r.exam.id }}>
                      View Result
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
