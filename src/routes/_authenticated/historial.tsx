import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { eliminarPartida, listPartidas } from "@/lib/partidas.functions";
import { getCategoria } from "@/lib/categorias";

export const Route = createFileRoute("/_authenticated/historial")({
  component: Historial,
});

function Historial() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["partidas"],
    queryFn: () => listPartidas(),
  });
  const del = useMutation({
    mutationFn: (id: string) => eliminarPartida({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partidas"] }),
  });

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400">
        <ArrowLeft className="size-4" /> Regresar
      </Link>
      <h2 className="mb-4 font-display text-2xl font-bold">Historial</h2>

      {isLoading && <p className="text-center text-zinc-500">Cargando…</p>}
      {data && data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
          Aún no has jugado ninguna partida.
        </div>
      )}
      <ul className="space-y-3">
        {(data ?? []).map((p) => {
          const cat = getCategoria(p.categoria ?? "");
          const total = p.correctas + p.incorrectas;
          const fecha = new Date(p.created_at).toLocaleString("es-MX", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <li key={p.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: cat.color }}>
                  {p.categoria ? `${cat.emoji} ${cat.nombre}` : "🎲 Todas las categorías"}
                </span>
                <span className="text-[10px] uppercase text-zinc-500">{p.estado.replace("_", " ")}</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-display text-2xl font-bold">
                    <span className="text-green-500">{p.correctas}</span>
                    <span className="text-zinc-600"> / {total || p.cantidad}</span>
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {p.nivel ? `${p.nivel.replace("_", " ")} · ` : ""}{p.tiempo_segundos}s · {fecha}
                  </p>
                </div>
                <button
                  onClick={() => del.mutate(p.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-2 py-1 text-[10px] text-red-400 hover:bg-red-950/30"
                >
                  <Trash2 className="size-3" /> Borrar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
