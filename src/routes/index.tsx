import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ClipboardList,
  GraduationCap,
  MonitorPlay,
  Presentation,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in · QuizLab Pro" },
      {
        name: "description",
        content:
          "Secure sign-in for staff and students — quizzes, lab practicals and proctored online examinations.",
      },
      { property: "og:title", content: "Sign in · QuizLab Pro" },
      {
        property: "og:description",
        content:
          "Secure sign-in for staff and students — quizzes, lab practicals and proctored online examinations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const ROLE_OPTIONS: { value: Role; icon: typeof Presentation; title: string; sub: string }[] = [
  { value: "staff", icon: Presentation, title: "Staff", sub: "Faculty & Lab Instructors" },
  { value: "student", icon: GraduationCap, title: "Student", sub: "Attempt exams & view results" },
];

function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (ready && user) {
      void navigate({ to: user.role === "staff" ? "/dashboard" : "/student", replace: true });
    }
  }, [ready, user, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim().includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }
    signIn(role);
    void navigate({ to: role === "staff" ? "/dashboard" : "/student", replace: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="brand-texture relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary-foreground/15">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight">QuizLab Pro</p>
            <p className="text-sm text-primary-foreground/70">Secure Examination Platform</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-8">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Examinations that stay fair,
            <br />
            even online.
          </h1>
          <ul className="space-y-5">
            {[
              { icon: MonitorPlay, text: "Tab-switch, blur and fullscreen monitoring on every attempt" },
              { icon: ClipboardList, text: "Quizzes, lab practicals and written tests in one library" },
              { icon: ShieldCheck, text: "Instant termination and auto-submit on any violation" },
            ].map((f) => (
              <li key={f.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                  <f.icon className="size-4" />
                </span>
                <span className="text-sm leading-relaxed text-primary-foreground/85">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/60">
          © 2026 QuizLab Pro · Department of Computer Science
        </p>
      </div>

      {/* Sign-in form */}
      <div className="flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </div>
            <p className="font-display text-lg font-bold text-foreground">QuizLab Pro</p>
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose your role and continue with your college email.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all",
                    role === opt.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "mb-2 flex size-9 items-center justify-center rounded-lg",
                      role === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <opt.icon className="size-4" />
                  </span>
                  <span className="block text-sm font-semibold text-foreground">{opt.title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{opt.sub}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder={role === "staff" ? "faculty@college.edu" : "student@college.edu"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" size="lg" className="w-full">
              Sign in as {role === "staff" ? "Staff" : "Student"}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-6 rounded-lg bg-muted px-4 py-3 text-center text-xs text-muted-foreground">
            Demo build — any email and password will sign you in. Real authentication arrives
            with the backend.
          </p>
        </div>
      </div>
    </div>
  );
}
