import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Info, Shuffle } from "lucide-react";
import { toast } from "sonner";

import { StatusBadge, TypeBadge, formatDateTime, useNow } from "@/components/shared/bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createExam, listExams, listMyLibrary } from "@/lib/mock-api";
import { CONTENT_TYPE_LABELS, type ContentType, type Exam, type LibraryItem } from "@/lib/types";

export const Route = createFileRoute("/_staff/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule Exam · QuizLab Pro" },
      { name: "description", content: "Schedule library content as a timed, proctored exam for a batch." },
      { property: "og:title", content: "Schedule Exam · QuizLab Pro" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScheduleExamPage,
});

const BATCHES = ["CS-2B", "CS-3A", "CS-3B", "CS-4A"];

function ScheduleExamPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [itemId, setItemId] = useState("");
  const [duration, setDuration] = useState("30");
  const [batch, setBatch] = useState("CS-3A");
  const [startAt, setStartAt] = useState("");
  const [shuffle, setShuffle] = useState(true);
  const [warnings, setWarnings] = useState("1");
  const now = useNow();

  const load = useCallback(async () => {
    const [lib, ex] = await Promise.all([listMyLibrary(), listExams()]);
    setItems(lib);
    setExams(ex);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      toast.error("Select content from your library first.");
      return;
    }
    if (!startAt) {
      toast.error("Pick a start time for the exam.");
      return;
    }
    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) {
      toast.error("The start time is not valid.");
      return;
    }
    try {
      const exam = await createExam({
        itemId,
        examType: item.type,
        durationMinutes: Math.max(1, Number(duration) || 30),
        batch,
        startAt: startDate.toISOString(),
        shuffleQuestions: shuffle,
        maxWarnings: Number(warnings),
      });
      toast.success("Exam scheduled", {
        description: `${exam.title} · ${exam.batch} · ${formatDateTime(exam.startAt)}`,
      });
      setItemId("");
      setStartAt("");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not schedule the exam.");
    }
  };

  const examStatus = (exam: Exam): "live" | "upcoming" | "ended" => {
    if (now === null) return "upcoming";
    const start = new Date(exam.startAt).getTime();
    const end = start + exam.durationMinutes * 60_000;
    if (now < start) return "upcoming";
    if (now <= end) return "live";
    return "ended";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Schedule Exam</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn library content into a timed, proctored exam for a batch.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="h-fit shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Exam settings</CardTitle>
            <CardDescription>Pick content from My Library, then set timing and security options.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSchedule} className="space-y-4">
              <div className="space-y-2">
                <Label>Content</Label>
                <Select value={itemId} onValueChange={setItemId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose from My Library…" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.length === 0 && (
                      <SelectItem value="none" disabled>
                        Your library is empty — create content first
                      </SelectItem>
                    )}
                    {items.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.title} ({CONTENT_TYPE_LABELS[i.type]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input id="duration" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Batch / Class</Label>
                  <Select value={batch} onValueChange={setBatch}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BATCHES.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-at">Start time</Label>
                <Input id="start-at" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              </div>

              <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Shuffle className="mt-0.5 size-4 text-primary" />
                  <div>
                    <Label htmlFor="shuffle" className="text-sm font-medium text-foreground">
                      Shuffle questions
                    </Label>
                    <p className="text-xs text-muted-foreground">Randomise question order per student.</p>
                  </div>
                </div>
                <Switch id="shuffle" checked={shuffle} onCheckedChange={setShuffle} />
              </div>

              <div className="space-y-2 rounded-xl border bg-muted/40 px-4 py-3">
                <Label className="text-sm font-medium text-foreground">Warnings before termination</Label>
                <RadioGroup value={warnings} onValueChange={setWarnings} className="mt-1 gap-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="0" id="warn-0" />
                    <Label htmlFor="warn-0" className="text-sm font-normal">
                      0 — terminate immediately on the first violation
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="1" id="warn-1" />
                    <Label htmlFor="warn-1" className="text-sm font-normal">
                      1 — allow one warning before terminating
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full">
                <CalendarClock className="size-4" /> Schedule exam
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Scheduled exams</CardTitle>
            <CardDescription>All exams currently scheduled by staff.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Exam</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="hidden md:table-cell">Starts</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      No exams scheduled yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  exams.map((exam) => {
                    const status = examStatus(exam);
                    return (
                      <TableRow key={exam.id}>
                        <TableCell className="max-w-52 pl-6">
                          <p className="truncate font-medium text-foreground">{exam.title}</p>
                          <TypeBadge type={exam.type} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{exam.batch}</TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {formatDateTime(exam.startAt)}
                          <span className="block text-xs">· {exam.durationMinutes} min</span>
                        </TableCell>
                        <TableCell>
                          {status === "live" ? (
                            <StatusBadge status="active" />
                          ) : status === "ended" ? (
                            <Badge variant="secondary">Ended</Badge>
                          ) : (
                            <Badge variant="warning">Upcoming</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <p className="mt-2 flex items-start gap-2 px-6 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Students see an exam on their dashboard as soon as it's scheduled, but the Start button only
              unlocks at the start time.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
