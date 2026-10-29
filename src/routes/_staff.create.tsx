import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ContentTypeCards } from "@/components/staff/content-type-cards";
import { LibraryItemForm } from "@/components/staff/library-item-form";
import { createLibraryItem } from "@/lib/mock-api";
import type { ContentType, LibraryItemInput } from "@/lib/types";

export const Route = createFileRoute("/_staff/create")({
  head: () => ({
    meta: [
      { title: "Create / Upload Content · QuizLab Pro" },
      { name: "description", content: "Create quizzes, lab practicals, written tests and other content." },
      { property: "og:title", content: "Create / Upload Content · QuizLab Pro" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateContentPage,
});

function CreateContentPage() {
  const [type, setType] = useState<ContentType | null>(null);

  const handleCreate = async (values: LibraryItemInput) => {
    await createLibraryItem(values);
    toast.success("Saved to My Library", { description: values.title });
    setType(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Create / Upload Content
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose what you want to upload — each type has its own form.
        </p>
      </div>

      {!type ? (
        <>
          <ContentTypeCards value={null} onSelect={setType} />
          <p className="flex items-start gap-2 rounded-xl border bg-card p-4 text-sm text-muted-foreground shadow-card">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            Everything you create lands in <span className="font-medium text-foreground">My Library</span>, ready
            to be scheduled as an exam for any batch. Quizzes are auto-graded; practicals and written tests go
            to manual grading.
          </p>
        </>
      ) : (
        <LibraryItemForm type={type} onSubmit={handleCreate} onCancel={() => setType(null)} />
      )}
    </div>
  );
}
