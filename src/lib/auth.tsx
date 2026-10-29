/*
 * Mock authentication context.
 *
 * The signIn/signOut surface mirrors what a Supabase auth client would expose,
 * so swapping this for real auth later only touches this file.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Role } from "./types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  batch?: string;
}

/** Demo users. Ids match the seed rows in lib/mock-api.ts. */
export const MOCK_USERS: Record<Role, AuthUser> = {
  staff: { id: "staff-1", name: "Dr. Ananya Sharma", email: "staff@college.edu", role: "staff" },
  student: {
    id: "student-1",
    name: "Aditya Verma",
    email: "student@college.edu",
    role: "student",
    batch: "CS-3A",
  },
};

const STORAGE_KEY = "quizlab.session";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (role: Role) => AuthUser;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // corrupted session — ignore, stay signed out
    }
    setReady(true);
  }, []);

  const signIn = (role: Role): AuthUser => {
    const u = MOCK_USERS[role];
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {
      // storage unavailable — session lives in memory only
    }
    setUser(u);
    return u;
  };

  const signOut = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Route guard: redirects to the login page unless signed in with the given role. */
export function useRequireRole(role: Role) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && (!user || user.role !== role)) {
      void navigate({ to: "/", replace: true });
    }
  }, [ready, user, role, navigate]);

  const allowed = ready && !!user && user.role === role;
  return { user: allowed ? user : null, ready: allowed };
}
