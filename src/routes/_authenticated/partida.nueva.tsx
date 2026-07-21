import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIAS, NIVELES, TIEMPOS } from "@/lib/categorias";
import { ArrowLeft, Play } from "lucide-react";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/_authenticated/partida/nueva")({
  component: NuevaPartida,
});

function NuevaPartida() {
  const nav = useNavigate();
  const [settings] = useSettings();
  const [categorias, setCategorias] = useState<string[]>([]);
  const [niveles, setNiveles] = useState<string[]>([]);
  const [cantidad, setCantidad] = useState<number>(10);
  const [tiempo, setTiempo] = useState<number>(10);

  useEffect(() => {
    setCantidad(settings.cantidadDefault);
    setTiempo(settings.tiempoDefault);
  }, [settings.cantidadDefault, settings.tiempoDefault]);

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const start = () => {
    const search: Record<string, string> = {
      cantidad: String(cantidad),
      tiempo: String(tiempo),
    };
    if (categorias.length) search.categorias = categorias.join(",");
    if (niveles.length) search.niveles = niveles.join(",");
    nav({ to: "/partida/jugar", search });
  };

  const todasCats = categorias.length === 0;
  const todosNivs = niveles.length === 0;

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400">
        <ArrowLeft className="size-4" /> Regresar
      </Link>
      <h2 className="mb-6 font-display text-2xl font-bold">Nueva partida</h2>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Categorías {categorias.length > 0 && <span className="text-blue-400">({categorias.length})</span>}
          </p>
          {categorias.length > 0 && (
            <button onClick={() => setCategorias([])} className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300">
              Limpiar
            </button>
          )}
        </div>
        <p className="mb-2 text-[11px] text-zinc-500">Toca varias para combinar bancos. Ninguna = todas.</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCategorias([])}
            className={`rounded-xl border p-3 text-left text-sm font-medium transition ${todasCats ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-800 bg-zinc-900 text-zinc-300"}`}
          >
            🎲 Todas
          </button>
          {CATEGORIAS.map((c) => {
            const active = categorias.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(categorias, setCategorias, c.id)}
                className="rounded-xl border p-3 text-left text-sm font-medium transition"
                style={
                  active
                    ? { borderColor: c.color, backgroundColor: `${c.color}22`, color: c.color }
                    : { borderColor: "#27272a", backgroundColor: "#18181b", color: "#d4d4d8" }
                }
              >
                <span className="mr-1">{c.emoji}</span>
                {c.nombre}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
          Dificultad {niveles.length > 0 && <span className="text-blue-400">({niveles.length})</span>}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setNiveles([])}
            className={`rounded-xl border p-3 text-sm font-medium ${todosNivs ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-800 bg-zinc-900 text-zinc-300"}`}
          >
            Cualquiera
          </button>
          {NIVELES.map((n) => {
            const active = niveles.includes(n.id);
            return (
              <button
                key={n.id}
                onClick={() => toggle(niveles, setNiveles, n.id)}
                className={`rounded-xl border p-3 text-sm font-medium ${active ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-800 bg-zinc-900 text-zinc-300"}`}
              >
                {n.nombre}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Cantidad de preguntas</p>
        <div className="grid grid-cols-5 gap-2">
          {[5, 10, 15, 20, 30].map((n) => (
            <button
              key={n}
              onClick={() => setCantidad(n)}
              className={`rounded-xl border p-3 font-display text-lg font-bold ${cantidad === n ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-800 bg-zinc-900"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Cronómetro (segundos)</p>
        <div className="grid grid-cols-5 gap-2">
          {TIEMPOS.map((t) => (
            <button
              key={t}
              onClick={() => setTiempo(t)}
              className={`rounded-xl border p-3 font-display text-lg font-bold ${tiempo === t ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-800 bg-zinc-900"}`}
            >
              {t}s
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={start}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-5 font-display text-sm font-bold uppercase tracking-widest text-black shadow-xl active:scale-95"
      >
        <Play className="size-4" fill="currentColor" /> Iniciar partida
      </button>
    </AppShell>
  );
}
