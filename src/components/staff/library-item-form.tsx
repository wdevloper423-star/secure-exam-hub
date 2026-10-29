import { useRef, useState } from "react";
import { ArrowLeft, Paperclip, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CsvImport, QuestionEditor } from "./quiz-questions";
import { CONTENT_TYPE_LABELS, type Attachment, type ContentType, type LibraryItem, type LibraryItemInput, type Question } from "@/lib/types";

interface Props {
  type: ContentType;
  initial?: LibraryItem | null;
  submitLabel?: string;
  onSubmit: (values: LibraryItemInput) => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * One form per content type, shared between the Create page and the
 * Edit dialog in My Library.
 */
export function LibraryItemForm({ type, initial, submitLabel = "Save to My Library", onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [questions, setQuestions] = useState<Question[]>(initial?.questions ?? []);
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [inputOutput, setInputOutput] = useState(initial?.inputOutput ?? "");
  const [marks, setMarks] = useState(String(initial?.marks ?? (type === "quiz" ? 1 : 10)));
  const [wordLimit, setWordLimit] = useState(String(initial?.wordLimit ?? 150));
  const [attachments, setAttachments] = useState<Attachment[]>(initial?.attachments ?? []);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList) => {
    const next = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`,
    }));
    setAttachments((prev) => [...prev, ...next]);
  };

  const validate = (): LibraryItemInput | null => {
    if (!title.trim()) {
      toast.error("Please enter a title.");
      return null;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject.");
      return null;
    }
    if (type === "quiz") {
      if (questions.length === 0) {
        toast.error("Add at least one question — manually or via CSV import.");
        return null;
      }
      if (questions.some((q) => !q.text.trim() || q.options.some((o) => !o.trim()))) {
        toast.error("Every question needs text and all four options filled in.");
        return null;
      }
      return {
        type, title: title.trim(), subject: subject.trim(), topic: topic.trim(),
        description: description.trim(), questions, instructions: "", inputOutput: "",
        marks: questions.reduce((s, q) => s + q.marks, 0), attachments,
      };
    }
    if (type === "practical") {
      if (!instructions.trim()) {
        toast.error("Please enter the aim / instructions.");
        return null;
      }
      return {
        type, title: title.trim(), subject: subject.trim(), topic: topic.trim(),
        description: description.trim(), questions: [], instructions: instructions.trim(),
        inputOutput: inputOutput.trim(), marks: Math.max(1, Number(marks) || 10), attachments,
      };
    }
    if (type === "written") {
      if (!description.trim()) {
        toast.error("Please enter the question text.");
        return null;
      }
      return {
        type, title: title.trim(), subject: subject.trim(), topic: topic.trim(),
        description: description.trim(), questions: [], instructions: instructions.trim(),
        inputOutput: "", marks: Math.max(1, Number(marks) || 10),
        wordLimit: Math.max(0, Number(wordLimit) || 0) || undefined, attachments,
      };
    }
    // other
    return {
      type, title: title.trim(), subject: subject.trim(), topic: topic.trim(),
      description: description.trim(), questions: [], instructions: "", inputOutput: "",
      marks: 0, attachments,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = validate();
    if (!values) return;
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Button type="button" variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={onCancel}>
        <ArrowLeft className="size-4" /> Back to content types
      </Button>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            {initial ? `Edit ${CONTENT_TYPE_LABELS[type]}` : `New ${CONTENT_TYPE_LABELS[type]}`}
          </CardTitle>
          <CardDescription>Basic details shown to students and in your library.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="li-title">Title</Label>
            <Input id="li-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit Test 1 — Normalization" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="li-subject">Subject</Label>
            <Input id="li-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Database Management Systems" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="li-topic">Topic (optional)</Label>
            <Input id="li-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Normalization & Functional Dependencies" />
          </div>
        </CardContent>
      </Card>

      {type === "quiz" && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Questions</CardTitle>
            <CardDescription>
              Add questions manually, or bulk-upload a CSV / Excel sheet. Total marks:{" "}
              <span className="font-semibold text-foreground">{questions.reduce((s, q) => s + q.marks, 0)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <QuestionEditor value={questions} onChange={setQuestions} />
            <div className="space-y-2">
              <Label>Bulk upload</Label>
              <CsvImport
                onImport={(imported) => setQuestions((prev) => [...prev, ...imported])}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {type === "practical" && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Problem statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="li-aim">Aim / Instructions</Label>
              <Textarea id="li-aim" rows={5} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Aim: … Steps: …" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="li-io">Sample Input / Output</Label>
              <Textarea id="li-io" rows={4} value={inputOutput} onChange={(e) => setInputOutput(e.target.value)} placeholder="Input: …&#10;Output: …" />
            </div>
            <div className="space-y-2 sm:max-w-xs">
              <Label htmlFor="li-marks">Marks</Label>
              <Input id="li-marks" type="number" min={1} value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {type === "written" && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="li-qtext">Question text</Label>
              <Textarea id="li-qtext" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Q1. …" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="li-wmarks">Marks</Label>
                <Input id="li-wmarks" type="number" min={1} value={marks} onChange={(e) => setMarks(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="li-wlimit">Word limit</Label>
                <Input id="li-wlimit" type="number" min={0} value={wordLimit} onChange={(e) => setWordLimit(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(type === "other" || type === "practical") && (
        <Card className="shadow-card">
          {type === "other" && (
            <CardHeader>
              <CardTitle className="font-display text-lg">Description</CardTitle>
            </CardHeader>
          )}
          {type === "other" && (
            <CardContent className="pb-0">
              <div className="space-y-2">
                <Label htmlFor="li-desc">Description</Label>
                <Textarea id="li-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe this content…" />
              </div>
            </CardContent>
          )}
          <CardHeader className={type === "other" ? "pb-0 pt-6" : undefined}>
            <CardTitle className="font-display text-lg">Attachments</CardTitle>
            <CardDescription>Optional files students can download (stored with the backend later).</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <Paperclip className="size-4" /> Attach files
            </Button>
            {attachments.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <li key={`${a.name}-${i}`} className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-xs">
                    <Paperclip className="size-3 text-muted-foreground" />
                    <span className="font-medium text-foreground">{a.name}</span>
                    <span className="text-muted-foreground">({a.size})</span>
                    <button
                      type="button"
                      aria-label={`Remove ${a.name}`}
                      onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <X className="size-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">
          <Save className="size-4" /> {submitLabel}
        </Button>
      </div>
    </form>
  );
}
