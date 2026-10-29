import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  ShieldCheck,
  Timer,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { formatDateTime } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { getStudentExamContext, startAttempt, submitAttempt, terminateAttempt } from "@/lib/mock-api";
import type { AnswerValue, ExamWithAttempt, Question } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_student/exam/$id")({
  head: () => ({
    meta: [
      { title: "Secure Exam · QuizLab Pro" },
      { name: "description", content: "Proctored exam screen — tab switches and focus loss terminate the attempt." },
      { property: "og:title", content: "Secure Exam · QuizLab Pro" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExamScreen,
});

type Phase = "loading" | "rules" | "active" | "terminated";

const shuffleArr = <T,>(arr: T[]): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
};

const formatClock = (totalSeconds: number): string => {
  const s = Math.max(0, totalSeconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

function ExamScreen() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("loading");
  const [ctx, setCtx] = useState<ExamWithAttempt | null>(null);
  const [order, setOrder] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [termination, setTermination] = useState<{ reason: string; at: string } | null>(null);

  // Refs keep the anti-cheat listeners and timer callbacks from going stale.
  const ctxRef = useRef<ExamWithAttempt | null>(null);
  const answersRef = useRef<Record<string, AnswerValue>>({});
  const terminatedRef = useRef(false);
  const hadFullscreenRef = useRef(false);

  useEffect(() => {
    ctxRef.current = ctx;
  }, [ctx]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Load exam context; redirect to the result page if already finished.
  useEffect(() => {
    void (async () => {
      const data = await getStudentExamContext(id);
      if (!data) {
        toast.error("Exam not found.");
        void navigate({ to: "/student", replace: true });
        return;
      }
      if (data.attempt && data.attempt.status !== "active") {
        void navigate({ to: "/student/result/$id", params: { id }, replace: true });
        return;
      }
      setCtx(data);
      setPhase("rules");
    })();
  }, [id, navigate]);

  /** Immediate termination: auto-submit answers so far, then show the red screen. */
  const terminate = useCallback(async (reason: string) => {
    if (terminatedRef.current || !ctxRef.current) return;
    terminatedRef.current = true;
    await terminateAttempt({
      examId: ctxRef.current.exam.id,
      answers: answersRef.current,
      reason,
    }).catch(() => undefined);
    document.exitFullscreen?.().catch(() => undefined);
    setTermination({ reason, at: new Date().toISOString() });
    setPhase("terminated");
  }, []);

  // Anti-cheat listeners + input blocking, active only while the exam runs.
  useEffect(() => {
    if (phase !== "active") return;

    const onVisibility = () => {
      if (document.hidden) void terminate("Tab switch detected");
    };
    const onBlur = () => void terminate("Window focus lost (tab switch or minimize detected)");
    const onFullscreenChange = () => {
      if (document.fullscreenElement) hadFullscreenRef.current = true;
      else if (hadFullscreenRef.current) void terminate("Fullscreen exited");
    };
    const block = (e: Event) => e.preventDefault();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("dragstart", block);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("dragstart", block);
    };
  }, [phase, terminate]);

  /** Final submission (manual or timer-driven) → result screen. */
  const submit = useCallback(
    async (auto = false) => {
      if (terminatedRef.current || !ctxRef.current) return;
      terminatedRef.current = true;
      await submitAttempt({ examId: ctxRef.current.exam.id, answers: answersRef.current }).catch(
        () => undefined,
      );
      document.exitFullscreen?.().catch(() => undefined);
      if (auto) toast.info("Time is up — your exam was auto-submitted.");
      void navigate({ to: "/student/result/$id", params: { id: ctxRef.current.exam.id } });
    },
    [navigate],
  );

  const startExam = async () => {
    if (!ctx) return;
    // Must run inside the click gesture; preview iframes may deny fullscreen — continue anyway.
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // fullscreen unavailable — monitoring still covers tab switch & focus loss
    }
    const attempt = await startAttempt(ctx.exam.id);
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    setSecondsLeft(Math.max(1, ctx.exam.durationMinutes * 60 - elapsedSeconds));
    setOrder(ctx.exam.type === "quiz" ? (ctx.exam.shuffleQuestions ? shuffleArr(ctx.exam.questions) : ctx.exam.questions) : []);
    setPhase("active");
  };

  // Countdown
  useEffect(() => {
    if (phase !== "active") return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "active" && secondsLeft <= 0 && secondsLeft !== 0) return;
    if (phase === "active" && secondsLeft === 0) void submit(true);
  }, [secondsLeft, phase, submit]);

  // ------------------------------------------------------------------ render

  if (phase === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Preparing secure exam…</p>
      </div>
    );
  }

  if (!ctx) return null;
  const exam = ctx.exam;
  const isQuiz = exam.type === "quiz";
  const current = isQuiz ? order[qIndex] : null;
  const answerKey = isQuiz ? current?.id ?? "" : "answer";
  const answeredCount = isQuiz
    ? order.filter((q) => answers[q.id] !== undefined).length
    : typeof answers["answer"] === "string" && (answers["answer"] as string).trim().length > 0
      ? 1
      : 0;
  const totalQuestions = isQuiz ? order.length : 1;
  const lowTime = secondsLeft < 120;

  // -------- terminated: red screen with reason + timestamp --------
  if (phase === "terminated" && termination) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center shadow-pop">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/15">
            <XCircle className="size-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-destructive">Exam Terminated</h1>
          <p className="mt-2 font-semibold text-foreground">{termination.reason}</p>
          <p className="mt-1 text-sm text-muted-foreground">at {formatDateTime(termination.at)}</p>
          <p className="mx-auto mt-5 max-w-sm rounded-lg border bg-card p-3 text-xs text-muted-foreground">
            Your answers up to this point were auto-submitted. Contact your faculty if you believe
            this was an error.
          </p>
          <Button className="mt-6" onClick={() => void navigate({ to: `/student/result/$id`, params: { id } })}>
            View Result
          </Button>
        </div>
      </div>
    );
  }

  // -------- rules modal (before starting) --------
  if (phase === "rules") {
    return (
      <div>
        <Card className="mx-auto max-w-xl shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-xl">{exam.title}</CardTitle>
            <CardDescription>
              {exam.subject} · {exam.durationMinutes} minutes · {exam.totalMarks} marks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Badge variant="warning">
                <Timer className="mr-1 size-3" /> Starts at {formatDateTime(exam.startAt)}
              </Badge>
            </p>
            <p>Review the exam rules to begin. The exam runs in fullscreen secure mode.</p>
          </CardContent>
        </Card>

        <AlertDialog open>
          <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Exam Rules & Security Notice</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <ul className="mt-1 space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    The exam runs in fullscreen. Exiting fullscreen ends the attempt immediately.
                  </li>
                  <li className="flex gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    Switching tabs, minimising the window, or losing window focus terminates the
                    exam and auto-submits your answers so far.
                    {exam.maxWarnings === 0
                      ? " No warnings are allowed for this exam."
                      : " You will receive one warning before termination."}
                  </li>
                  <li className="flex gap-2">
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    Right-click, copy, paste and text selection are disabled.
                  </li>
                  <li className="flex gap-2">
                    <Timer className="mt-0.5 size-4 shrink-0 text-primary" />
                    The countdown starts as soon as you agree. When time runs out, the exam is
                    submitted automatically.
                  </li>
                  <li className="flex gap-2">
                    <ClipboardList className="mt-0.5 size-4 shrink-0 text-primary" />
                    {isQuiz
                      ? `${exam.questions.length} multiple-choice questions · ${exam.totalMarks} marks${exam.shuffleQuestions ? " · question order is shuffled" : ""}.`
                      : "Answer in the provided box. Your work is saved with each submission."}
                  </li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => void navigate({ to: "/student", replace: true })}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => void startExam()}>
                <ShieldCheck className="size-4" /> Agree & Start Secure Exam
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // -------- active exam --------
  const setAnswer = (value: AnswerValue) => setAnswers((prev) => ({ ...prev, [answerKey]: value }));

  return (
    <div className="space-y-4 pb-10">
      {/* Top bar: title, secure badge, timer */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-card">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-foreground">{exam.title}</p>
          <p className="truncate text-xs text-muted-foreground">{exam.subject}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="success" className="gap-1.5">
            <ShieldCheck className="size-3.5" /> Secure Mode Active
          </Badge>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-base font-bold tabular-nums",
              lowTime ? "animate-pulse bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
            )}
          >
            <Clock className="size-4" /> {formatClock(secondsLeft)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* Question area */}
        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {isQuiz ? `Question ${qIndex + 1} of ${order.length}` : "Answer"}
                </CardTitle>
                {isQuiz && current && <Badge variant="info">{current.marks} mark{current.marks > 1 ? "s" : ""}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isQuiz && current ? (
                <>
                  <p className="text-lg font-medium text-foreground">{current.text}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {current.options.map((opt, oi) => {
                      const selected = answers[current.id] === oi;
                      return (
                        <button
                          key={oi}
                          type="button"
                          onClick={() => setAnswer(oi)}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                            selected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                              : "border-border hover:border-primary/40",
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={cn(
                                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                                selected ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
                              )}
                            >
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="text-foreground">{opt}</span>
                          </span>
                          {selected && <Check className="size-4 shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  {exam.instructions && (
                    <div className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                      <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                        <ClipboardList className="size-4" /> Instructions
                      </p>
                      <p className="whitespace-pre-wrap">{exam.instructions}</p>
                    </div>
                  )}
                  {exam.description && (
                    <p className="whitespace-pre-wrap text-base text-foreground">{exam.description}</p>
                  )}
                  <Textarea
                    rows={10}
                    placeholder="Type your answer here…"
                    value={typeof answers[answerKey] === "string" ? (answers[answerKey] as string) : ""}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="select-text"
                  />
                  {exam.wordLimit ? (
                    <p className="text-right text-xs text-muted-foreground">
                      {String(answers[answerKey] ?? "").trim().split(/\s+/).filter(Boolean).length} /{" "}
                      {exam.wordLimit} words
                    </p>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={!isQuiz || qIndex === 0}
              onClick={() => setQIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            {isQuiz && qIndex < order.length - 1 ? (
              <Button onClick={() => setQIndex((i) => Math.min(order.length - 1, i + 1))}>
                Next <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                <FileText className="size-4" /> Last question
              </Button>
            )}
          </div>
        </div>

        {/* Palette */}
        <aside className="h-fit lg:sticky lg:top-20">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Question Palette
              </CardTitle>
              <CardDescription>
                Answered {answeredCount} of {totalQuestions}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
                {(isQuiz ? order : [null]).map((q, i) => {
                  const key = isQuiz ? q!.id : "answer";
                  const isAnswered = answers[key] !== undefined &&
                    (typeof answers[key] !== "string" || (answers[key] as string).trim().length > 0);
                  const isCurrent = isQuiz ? i === qIndex : true;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => isQuiz && setQIndex(i)}
                      className={cn(
                        "flex h-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                        isCurrent
                          ? "border-primary bg-primary text-primary-foreground"
                          : isAnswered
                            ? "border-success/50 bg-success/15 text-success"
                            : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="size-3 rounded bg-primary" /> Current
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-3 rounded bg-success/40" /> Answered
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-3 rounded border bg-muted" /> Not answered
                </li>
              </ul>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" variant="destructive">
                    Submit Exam
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Submit and finish the exam?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You have answered {answeredCount} of {totalQuestions} question
                      {totalQuestions > 1 ? "s" : ""}. Unanswered questions score zero. This cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep working</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void submit(false)}>Submit exam</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </aside>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Signed in as {user?.name} · violations terminate the exam instantly
      </p>
    </div>
  );
}
