import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { TypeBadge, formatDateTimeShort } from "@/components/shared/bits";
import { LibraryItemForm } from "@/components/staff/library-item-form";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deleteLibraryItem,
  duplicateLibraryItem,
  listMyLibrary,
  listSharedLibrary,
  updateLibraryItem,
} from "@/lib/mock-api";
import { CONTENT_TYPE_LABELS, type ContentType, type LibraryItem, type LibraryItemInput } from "@/lib/types";

export const Route = createFileRoute("/_staff/library")({
  head: () => ({
    meta: [
      { title: "My Library · QuizLab Pro" },
      { name: "description", content: "Manage your uploaded content — edit, duplicate, delete or reuse shared items." },
      { property: "og:title", content: "My Library · QuizLab Pro" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

const TYPE_FILTERS: { value: ContentType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "quiz", label: "Quiz" },
  { value: "practical", label: "Practical" },
  { value: "written", label: "Written" },
  { value: "other", label: "Other" },
];

function LibraryPage() {
  const [tab, setTab] = useState<"mine" | "shared">("mine");
  const [mine, setMine] = useState<LibraryItem[]>([]);
  const [shared, setShared] = useState<LibraryItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [deleting, setDeleting] = useState<LibraryItem | null>(null);

  const load = useCallback(async () => {
    const [m, s] = await Promise.all([listMyLibrary(), listSharedLibrary()]);
    setMine(m);
    setShared(s);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = tab === "mine" ? mine : shared;
  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (typeFilter === "all" || i.type === typeFilter) &&
          (search.trim() === "" ||
            `${i.title} ${i.subject} ${i.topic}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [items, typeFilter, search],
  );

  const handleEdit = async (values: LibraryItemInput) => {
    if (!editing) return;
    await updateLibraryItem(editing.id, values);
    toast.success("Changes saved", { description: values.title });
    setEditing(null);
    void load();
  };

  const handleDuplicate = async (item: LibraryItem) => {
    await duplicateLibraryItem(item.id);
    toast.success("Duplicated", { description: `${item.title} (Copy)` });
    void load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteLibraryItem(deleting.id);
    toast.success("Deleted", { description: deleting.title });
    setDeleting(null);
    void load();
  };

  const handleCopyShared = async (item: LibraryItem) => {
    await duplicateLibraryItem(item.id);
    toast.success("Copied to My Library", { description: item.title });
    void load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">My Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you've uploaded — plus a shared library from other staff.
          </p>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "mine" | "shared")}>
          <TabsList>
            <TabsTrigger value="mine">My Library</TabsTrigger>
            <TabsTrigger value="shared">Shared Library</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={
                typeFilter === f.value
                  ? "rounded-full border border-primary bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
                  : "rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Subject</TableHead>
              <TableHead>{tab === "mine" ? "Marks / Questions" : "By"}</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-10 text-right">{tab === "mine" ? "Actions" : ""}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  {tab === "mine"
                    ? "Nothing here yet — create content to fill your library."
                    : "No shared content matches your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{item.title}</p>
                    {item.attachments.length > 0 && (
                      <p className="text-xs text-muted-foreground">{item.attachments.length} attachment(s)</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={item.type} />
                  </TableCell>
                  <TableCell className="hidden max-w-48 truncate text-sm text-muted-foreground md:table-cell">
                    {item.subject}
                  </TableCell>
                  <TableCell className="text-sm">
                    {tab === "mine" ? (
                      item.type === "quiz" ? (
                        <span className="text-muted-foreground">
                          {item.questions.length} Q · <span className="font-semibold text-foreground">{item.marks}</span> marks
                        </span>
                      ) : (
                        <span className="font-semibold text-foreground">{item.marks} marks</span>
                      )
                    ) : (
                      <Badge variant="outline">{item.ownerName}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {formatDateTimeShort(item.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {tab === "mine" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${item.title}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(item)}>
                            <Pencil className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void handleDuplicate(item)}>
                            <Copy className="size-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleting(item)}
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => void handleCopyShared(item)}>
                        <UserPlus className="size-3.5" /> Copy
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog reuses the full per-type form */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Edit content</DialogTitle>
            <DialogDescription>
              {editing ? `${CONTENT_TYPE_LABELS[editing.type]} · ${editing.title}` : ""}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <LibraryItemForm
              type={editing.type}
              initial={editing}
              submitLabel="Save changes"
              onSubmit={handleEdit}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this content?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `"${deleting.title}" will be removed from your library. Scheduled exams that use it keep their own copy of the questions.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
