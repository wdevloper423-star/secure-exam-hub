import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Trophy,
  XCircle,
} from "lucide-react";

import { StatusBadge, TypeBadge, formatDateTime } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStudentExamContext } from "@/lib/mock-api";
import type { Attempt, Exam } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_student/result/$id")({
  head: () => ({
    meta: [
      { title: "Exam Result · QuizLab Pro" },
      { name: "description", content: "Your result, including any termination reason and timestamp." },
      { property: "og:title", content: "Exam Result · QuizLab Pro" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{ exam: Exam; attempt: Attempt } | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void (async () => {
      const ctx = await getStudentExamContext(id);
      if (!ctx || !ctx.attempt || ctx.attempt.status === "active") {
        setMissing(true);
        return;
      }
      setData({ exam: ctx.exam, attempt: ctx.attempt });
    })();
  }, [id]);

  if (missing) {
    return (
      <Card className="mx-auto max-w-lg text-center shadow-card">
        <CardContent className="py-10">
          <p className="text-sm text-muted-foreground">No completed result for this exam yet.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/student">Back to My Exams</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading result…</p>
      </div>
    );
  }

  const { exam, attempt } = data;
  const terminated = attempt.status === "terminated";
  const isQuiz = exam.type === "quiz";
  const scorePct =
    attempt.score !== undefined && attempt.totalMarks ? Math.round((attempt.score / attempt.totalMarks) * 100) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
        <Link to="/student">
          <ArrowLeft className="size-4" /> Back to My Exams
        </Link>
      </Button>

      {/* Header card */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-display text-xl text-foreground">{exam.title}</CardTitle>
              <CardDescription>
                {exam.subject} · {exam.durationMinutes} min · {exam.totalMarks} marks
              </CardDescription>
            </div>
            <StatusBadge status={attempt.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {terminated ? "Terminated at" : "Submitted at"}{" "}
            <span className="font-medium text-foreground">{formatDateTime(attempt.endedAt)}</span>
          </p>

          {terminated ? (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Exam Terminated: {attempt.terminateReason}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The exam ended automatically because a security rule was violated. Your answers up to that
                  point were auto-submitted.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <p className="font-semibold text-success">Exam submitted successfully</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isQuiz
                    ? "Your answers were graded automatically."
                    : "Your answers were sent to the faculty for manual grading."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score card (auto-graded quizzes) */}
      {attempt.score !== undefined ? (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Trophy className="size-4 text-warning" /> Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">
              {attempt.score}
              <span className="text-lg font-medium text-muted-foreground">/{attempt.totalMarks}</span>
            </p>
            {scorePct !== null && (
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", scorePct >= 50 ? "bg-success" : "bg-destructive")}
                    style={{ width: `${scorePct}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground">{scorePct}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-3 py-5">
            <FileText className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Awaiting manual grading by {exam.createdBy}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Per-question review for quizzes */}
      {isQuiz && exam.questions.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Answer review</CardTitle>
            <CardDescription>Your responses compared with the correct answers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exam.questions.map((q, i) => {
              const given = attempt.answers[q.id];
              const correct = given === q.correctIndex;
              return (
                <div key={q.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {i + 1}. {q.text}
                    </p>
                    {correct ? (
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="size-4 shrink-0 text-destructive" />
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <Badge variant={correct ? "success" : "destructive"}>
                      Your answer: {given === undefined ? "Not answered" : q.options[given as number] ?? "—"}
                    </Badge>
                    {!correct && <Badge variant="success">Correct: {q.options[q.correctIndex]}</Badge>}
                    <Badge variant="outline">{q.marks} mark{q.marks > 1 ? "s" : ""}</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Descriptive answers for written / practical / other */}
      {!isQuiz && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Your submission</CardTitle>
          </CardHeader>
          <CardContent>
            {typeof attempt.answers.answer === "string" && attempt.answers.answer.trim() ? (
              <p className="whitespace-pre-wrap text-sm text-foreground">{attempt.answers.answer}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {terminated ? "No answer text was recorded before termination." : "No answer recorded."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Attempted as {attempt.studentName} · <TypeBadge type={exam.type} />
      </p>
    </div>
  );
}
