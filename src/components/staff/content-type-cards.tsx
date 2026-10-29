import { ClipboardList, FlaskConical, FolderUp, PenLine } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ContentType } from "@/lib/types";

const TYPES: { value: ContentType; icon: typeof ClipboardList; title: string; description: string }[] = [
  {
    value: "quiz",
    icon: ClipboardList,
    title: "Quiz (MCQ)",
    description: "Multiple-choice questions with auto-grading — build manually or bulk-upload via CSV / Excel.",
  },
  {
    value: "practical",
    icon: FlaskConical,
    title: "Lab Practical",
    description: "Problem statement, aim, instructions, sample input/output, attachments and marks.",
  },
  {
    value: "written",
    icon: PenLine,
    title: "Written / Short Answer",
    description: "Descriptive questions with marks and a word limit for students.",
  },
  {
    value: "other",
    icon: FolderUp,
    title: "Other",
    description: "Custom title, description and file attachments — assignments, notes, references.",
  },
];

export function ContentTypeCards({
  value,
  onSelect,
}: {
  value: ContentType | null;
  onSelect: (type: ContentType) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onSelect(t.value)}
          className={cn(
            "group rounded-2xl border bg-card p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop",
            value === t.value
              ? "border-primary ring-2 ring-primary/25"
              : "border-border hover:border-primary/40",
          )}
        >
          <span
            className={cn(
              "mb-4 flex size-11 items-center justify-center rounded-xl transition-colors",
              value === t.value
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary group-hover:bg-primary/15",
            )}
          >
            <t.icon className="size-5" />
          </span>
          <span className="block font-semibold text-foreground">{t.title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{t.description}</span>
        </button>
      ))}
    </div>
  );
}
