import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Library, Sparkles, History, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Inicio", Icon: Home },
  { to: "/banco", label: "Banco", Icon: Library },
  { to: "/ia", label: "IA Gen", Icon: Sparkles },
  { to: "/historial", label: "Historial", Icon: History },
  { to: "/ajustes", label: "Ajustes", Icon: Settings },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 py-3">
        {items.map(({ to, label, Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 ${active ? "text-blue-500" : "text-zinc-500"}`}
            >
              <Icon className="size-5" strokeWidth={2.25} />
              <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
