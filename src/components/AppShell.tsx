import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { useCurrentUser, useIsAdmin } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Shield, UserCog } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 text-zinc-100 font-sans">
      <div className="mx-auto max-w-md px-4 pt-4">
        <header className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
              Moderador
              {isAdmin && (
                <span className="inline-flex items-center gap-0.5 rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-400">
                  <Shield className="size-2.5" /> ADMIN
                </span>
              )}
            </span>
            <h1 className="font-display text-xl font-bold tracking-tight">
              TRIVIA<span className="text-blue-500">MX</span>
            </h1>
            {user?.email && <span className="truncate text-[10px] text-zinc-400">{user.email}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/cuenta"
              title="Administrar cuenta"
              className="flex size-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-blue-400 hover:border-blue-500/40"
            >
              <UserCog className="size-4" />
            </Link>
            <button
              onClick={handleSignOut}
              title="Cerrar sesión"
              className="flex size-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-red-400 hover:border-red-500/40"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
