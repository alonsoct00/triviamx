import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { contarPreguntas } from "@/lib/preguntas.functions";
import { getCategoria } from "@/lib/categorias";

export const Route = createFileRoute("/_authenticated/estadisticas")({
  component: Estadisticas,
});

function Estadisticas() {
  const { data } = useQuery({ queryKey: ["contar"], queryFn: () => contarPreguntas() });
  const total = data?.total ?? 0;
  const entries = Object.entries(data?.porCategoria ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400">
        <ArrowLeft className="size-4" /> Regresar
      </Link>
      <h2 className="mb-4 font-display text-2xl font-bold">Estadísticas</h2>
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total</p>
        <p className="font-display text-4xl font-bold">{total}</p>
      </div>

      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Distribución por categoría</p>
      <ul className="space-y-2">
        {entries.map(([id, n]) => {
          const cat = getCategoria(id);
          const pct = total ? Math.round((n / total) * 100) : 0;
          return (
            <li key={id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: cat.color }}>{cat.emoji} {cat.nombre}</span>
                <span className="text-zinc-400">{n} · {pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
              </div>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
