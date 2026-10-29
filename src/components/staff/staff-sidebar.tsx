import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  CalendarClock,
  ClipboardCheck,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/create", label: "Create / Upload Content", icon: Upload, exact: false },
  { to: "/library", label: "My Library", icon: LibraryBig, exact: false },
  { to: "/schedule", label: "Schedule Exam", icon: CalendarClock, exact: false },
  { to: "/monitoring", label: "Live Monitoring", icon: Activity, exact: false },
  { to: "/results", label: "Results", icon: ClipboardCheck, exact: false },
];

export function StaffSidebar({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-display text-sm font-bold text-foreground">QuizLab Pro</p>
            <p className="truncate text-xs text-muted-foreground">Staff Console</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link to={item.to} className={cn(!active && "text-muted-foreground")}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <UserRound className="size-4" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">Faculty · Lab Instructor</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onSignOut}
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
