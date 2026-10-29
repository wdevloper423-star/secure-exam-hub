import { useRef, useState } from "react";
import { Check, FileSpreadsheet, FileUp, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";

let questionSeq = 0;
const newQuestion = (): Question => ({
  id: `q_new_${Date.now()}_${questionSeq++}`,
  text: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  marks: 1,
});

/** Editor for the manual question list of a quiz. */
export function QuestionEditor({
  value,
  onChange,
}: {
  value: Question[];
  onChange: (questions: Question[]) => void;
}) {
  const update = (index: number, patch: Partial<Question>) =>
    onChange(value.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const setOption = (qi: number, oi: number, text: string) => {
    const q = value[qi];
    const options = q.options.map((o, i) => (i === oi ? text : o));
    update(qi, { options });
  };

  return (
    <div className="space-y-4">
      {value.map((q, qi) => (
        <div key={q.id} className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Question {qi + 1}</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor={`marks-${q.id}`} className="text-xs text-muted-foreground">
                  Marks
                </Label>
                <Input
                  id={`marks-${q.id}`}
                  type="number"
                  min={1}
                  value={q.marks}
                  onChange={(e) => update(qi, { marks: Math.max(1, Number(e.target.value) || 1) })}
                  className="h-8 w-16"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => onChange(value.filter((_, i) => i !== qi))}
                aria-label={`Remove question ${qi + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <Input
            placeholder="Type the question…"
            value={q.text}
            onChange={(e) => update(qi, { text: e.target.value })}
            className="mb-3"
          />

          <RadioGroup
            value={String(q.correctIndex)}
            onValueChange={(v) => update(qi, { correctIndex: Number(v) })}
            className="grid gap-2 sm:grid-cols-2"
          >
            {q.options.map((opt, oi) => (
              <div
                key={oi}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
                  q.correctIndex === oi ? "border-success/60 bg-success/5" : "border-border",
                )}
              >
                <RadioGroupItem value={String(oi)} id={`opt-${q.id}-${oi}`} />
                <Input
                  placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                  value={opt}
                  onChange={(e) => setOption(qi, oi, e.target.value)}
                  className="h-8 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                />
                {q.correctIndex === oi && <Check className="ml-auto size-4 shrink-0 text-success" />}
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={() => onChange([...value, newQuestion()])}>
        <Plus className="size-4" /> Add question
      </Button>
    </div>
  );
}

/**
 * Minimal CSV parser with quoted-field support.
 * Expected columns: question, option A-D, correct answer (1-4 or A-D), marks.
 */
export function parseQuizCsv(text: string): { questions: Question[]; errors: string[] } {
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else inQuotes = false;
        } else cur += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const letterIndex = (raw: string): number | null => {
    const v = raw.trim().toUpperCase();
    if (/^[1-4]$/.test(v)) return Number(v) - 1;
    if (/^[A-D]$/.test(v)) return v.charCodeAt(0) - 65;
    return null;
  };

  const questions: Question[] = [];
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  lines.forEach((line, li) => {
    const cols = parseLine(line);
    if (li === 0 && /^question$/i.test(cols[0])) return; // header row
    if (cols.length < 6) {
      errors.push(`Row ${li + 1}: expected at least 6 columns (question, 4 options, correct answer).`);
      return;
    }
    const correct = letterIndex(cols[5]);
    if (correct === null) {
      errors.push(`Row ${li + 1}: correct answer must be 1-4 or A-D.`);
      return;
    }
    questions.push({
      id: `q_csv_${Date.now()}_${li}`,
      text: cols[0],
      options: [cols[1], cols[2], cols[3], cols[4]],
      correctIndex: correct,
      marks: Math.max(1, Number(cols[6]) || 1),
    });
  });

  return { questions, errors };
}

/** Drag-and-drop CSV / Excel importer for quiz questions. */
export function CsvImport({ onImport }: { onImport: (questions: Question[]) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<Question[] | null>(null);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    if (!/\.(csv|txt)$/i.test(file.name) && file.type !== "text/csv") {
      // Excel files are accepted by the UI; the demo parser reads CSV text.
      toast.info("Tip: export your Excel sheet as CSV for the demo parser.");
    }
    try {
      const text = await file.text();
      const { questions, errors } = parseQuizCsv(text);
      if (questions.length === 0) {
        toast.error("No questions could be parsed from this file.", {
          description: errors[0] ?? "Check the column format.",
        });
        setParsed(null);
        return;
      }
      if (errors.length > 0) toast.warning(`${errors.length} row(s) skipped`, { description: errors[0] });
      setParsed(questions);
    } catch {
      toast.error("Could not read the file.");
    }
  };

  return (
    <div className="rounded-xl border border-dashed bg-muted/40 p-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <FileUp className="size-6 text-primary" />
        <p className="text-sm font-medium text-foreground">Drag & drop your CSV / Excel file here</p>
        <p className="text-xs text-muted-foreground">
          Columns: question, option A–D, correct answer (1–4 or A–D), marks
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" /> Browse files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {parsed && (
        <div className="mt-3 rounded-lg border bg-card p-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileSpreadsheet className="size-4 text-success" />
              {fileName} — {parsed.length} question{parsed.length > 1 ? "s" : ""} parsed
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onImport(parsed);
                setParsed(null);
                setFileName("");
                toast.success(`${parsed.length} question(s) imported.`);
              }}
            >
              Import
            </Button>
          </div>
          <ul className="mt-2 space-y-1">
            {parsed.slice(0, 3).map((q, i) => (
              <li key={q.id} className="truncate text-xs text-muted-foreground">
                {i + 1}. {q.text}
              </li>
            ))}
            {parsed.length > 3 && (
              <li className="text-xs text-muted-foreground">…and {parsed.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
