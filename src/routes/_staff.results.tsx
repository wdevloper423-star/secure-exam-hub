import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { StatusBadge, TypeBadge, formatDateTime } from "@/components/shared/bits";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listResults } from "@/lib/mock-api";
import type { AttemptWithExam } from "@/lib/types";

export const Route = createFileRoute("/_staff/results")({
  head: () => ({
    meta: [
      { title: "Results · QuizLab Pro" },
      { name: "description", content: "Scores and outcomes for all submitted and terminated attempts." },
      { property: "og:title", content: "Results · QuizLab Pro" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const [rows, setRows] = useState<AttemptWithExam[]>([]);

  useEffect(() => {
    void listResults().then(setRows);
  }, []);

  const exportCsv = () => {
    const header = "Student,Exam,Type,Status,Score,Total,Finished,Violations,Reason";
    const lines = rows.map((r) =>
      [
        r.attempt.studentName,
        r.exam.title,
        r.exam.type,
        r.attempt.status,
        r.attempt.score ?? "",
        r.attempt.totalMarks ?? "",
        r.attempt.endedAt ?? "",
        r.attempt.violations,
        r.attempt.terminateReason ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quizlab-results.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported as CSV.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Results</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every submitted or terminated attempt across your exams.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="hidden lg:table-cell">Finished</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No completed attempts yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.attempt.id}>
                  <TableCell className="font-medium text-foreground">{r.attempt.studentName}</TableCell>
                  <TableCell className="max-w-52">
                    <p className="truncate text-sm text-foreground">{r.exam.title}</p>
                    {r.attempt.terminateReason && (
                      <p className="text-xs text-destructive">{r.attempt.terminateReason}</p>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <TypeBadge type={r.exam.type} />
                  </TableCell>
                  <TableCell>
                    {r.attempt.score !== undefined ? (
                      <span className="text-sm font-semibold text-foreground">
                        {r.attempt.score}/{r.attempt.totalMarks}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending manual grading</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {formatDateTime(r.attempt.endedAt)}
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
    </div>
  );
}
