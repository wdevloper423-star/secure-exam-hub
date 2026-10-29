import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";

import { FullPageLoader } from "@/components/shared/bits";
import { StaffSidebar } from "@/components/staff/staff-sidebar";
import { useAuth, useRequireRole } from "@/lib/auth";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_staff")({
  component: StaffLayout,
});

function StaffLayout() {
  const { user, ready } = useRequireRole("staff");
  const { signOut } = useAuth();
  const navigate = useNavigate();

  if (!ready || !user) return <FullPageLoader label="Loading staff workspace…" />;

  return (
    <SidebarProvider>
      <StaffSidebar
        user={user}
        onSignOut={() => {
          signOut();
          void navigate({ to: "/", replace: true });
        }}
      />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Staff Console</span>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
