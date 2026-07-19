import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 text-zinc-100 font-sans">
      <div className="mx-auto max-w-md px-4 pt-4">
        <header className="mb-6 flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Moderador</span>
            <h1 className="font-display text-xl font-bold tracking-tight">
              TRIVIA MASTER <span className="text-blue-500">MX</span>
            </h1>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
            <div className="size-2 animate-pulse rounded-full bg-green-500" />
          </div>
        </header>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
