import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIAS, NIVELES, TIEMPOS } from "@/lib/categorias";
import { ArrowLeft, Play } from "lucide-react";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/partida/nueva")({
  component: NuevaPartida,
});

function NuevaPartida() {
  const nav = useNavigate();
  const [settings] = useSettings();
  const [categoria, setCategoria] = useState<string>("");
  const [nivel, setNivel] = useState<string>("");
  const [cantidad, setCantidad] = useState<number>(10);
  const [tiempo, setTiempo] = useState<number>(10);

  // Apply saved defaults once
  useEffect(() => {
    setCantidad(settings.cantidadDefault);
    setTiempo(settings.tiempoDefault);
  }, [settings.cantidadDefault, settings.tiempoDefault]);

  const start = () => {
    const params = new URLSearchParams();
    if (categoria) params.set("categoria", categoria);
    if (nivel) params.set("nivel", nivel);
    params.set("cantidad", String(cantidad));
    params.set("tiempo", String(tiempo));
    nav({ to: "/partida/jugar", search: Object.fromEntries(params) as Record<string, string> });
  };

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400">
        <ArrowLeft className="size-4" /> Regresar
      </Link>
      <h2 className="mb-6 font-display text-2xl font-bold">Nueva partida</h2>

      <section className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Categoría</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCategoria("")}
            className={`rounded-xl border p-3 text-left text-sm font-medium transition ${categoria === "" ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-800 bg-zinc-900 text-zinc-300"}`}
          >
            🎲 Todas
          </button>
          {CATEGORIAS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoria(c.id)}
              className={`rounded-xl border p-3 text-left text-sm font-medium transition ${categoria === c.id ? "border-white/60 bg-white/5" : "border-zinc-800 bg-zinc-900"}`}
              style={categoria === c.id ? { borderColor: c.color, backgroundColor: `${c.color}15`, color: c.color } : {}}
            >
              <span className="mr-1">{c.emoji}</span>
              {c.nombre}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Dificultad</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setNivel("")}
            className={`rounded-xl border p-3 text-sm font-medium ${nivel === "" ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-800 bg-zinc-900 text-zinc-300"}`}
          >
            Cualquiera
          </button>
          {NIVELES.map((n) => (
            <button
              key={n.id}
              onClick={() => setNivel(n.id)}
              className={`rounded-xl border p-3 text-sm font-medium ${nivel === n.id ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-800 bg-zinc-900 text-zinc-300"}`}
            >
              {n.nombre}
            </button>
          ))}
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
