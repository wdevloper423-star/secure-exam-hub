import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LogOut, ShieldCheck } from "lucide-react";

import { FullPageLoader } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth, useRequireRole } from "@/lib/auth";

export const Route = createFileRoute("/student")({
  component: StudentLayout,
});

function StudentLayout() {
  const { user, ready } = useRequireRole("student");
  const { signOut } = useAuth();
  const navigate = useNavigate();

  if (!ready || !user) return <FullPageLoader label="Loading your exams…" />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 md:px-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <p className="font-display text-sm font-bold text-foreground">QuizLab Pro</p>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:inline-flex">
              <GraduationCap className="mr-1 size-3.5" />
              {user.batch}
            </Badge>
            <span className="text-sm font-medium text-foreground">{user.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              aria-label="Sign out"
              onClick={() => {
                signOut();
                void navigate({ to: "/", replace: true });
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
