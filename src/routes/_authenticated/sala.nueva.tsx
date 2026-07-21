import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIAS, NIVELES, TIEMPOS } from "@/lib/categorias";
import { ArrowLeft, Users } from "lucide-react";
import { crearSala } from "@/lib/sala.functions";

export const Route = createFileRoute("/_authenticated/sala/nueva")({
  component: NuevaSala,
  head: () => ({ meta: [{ title: "Crear sala en grupo" }] }),
});

function NuevaSala() {
  const nav = useNavigate();
  const [categorias, setCategorias] = useState<string[]>([]);
  const [niveles, setNiveles] = useState<string[]>([]);
  const [cantidad, setCantidad] = useState(10);
  const [tiempo, setTiempo] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  async function crear() {
    setLoading(true);
    setError(null);
    try {
      const sala = await crearSala({
        data: { categorias, niveles, cantidad, tiempo_segundos: tiempo },
      });
      nav({ to: "/sala/host/$codigo", params: { codigo: sala.codigo } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear la sala.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-xs text-zinc-500">
        <ArrowLeft className="size-4" /> Volver
      </Link>
      <h1 className="mb-1 font-display text-2xl font-bold">Sala en grupo</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Comparte un enlace con tus amigos. El más rápido en responder gana más puntos. Sin registro.
      </p>

      <Section title="Categorías" hint={categorias.length ? `${categorias.length} elegidas` : "Todas"}>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIAS.map((c) => {
            const on = categorias.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(categorias, setCategorias, c.id)}
                className={`rounded-xl border p-3 text-left text-xs ${
                  on ? "border-white bg-white/10 text-white" : "border-zinc-800 bg-zinc-900 text-zinc-300"
                }`}
              >
                <span className="mr-1">{c.emoji}</span> {c.nombre}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Niveles" hint={niveles.length ? `${niveles.length} elegidos` : "Todos"}>
        <div className="flex flex-wrap gap-2">
          {NIVELES.map((n) => {
            const on = niveles.includes(n.id);
            return (
              <button
                key={n.id}
                onClick={() => toggle(niveles, setNiveles, n.id)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  on ? "border-white bg-white text-black" : "border-zinc-700 text-zinc-300"
                }`}
              >
                {n.nombre}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Preguntas">
        <div className="flex flex-wrap gap-2">
          {[5, 10, 15, 20, 25].map((n) => (
            <button
              key={n}
              onClick={() => setCantidad(n)}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                cantidad === n ? "border-white bg-white text-black" : "border-zinc-700 text-zinc-300"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Segundos por pregunta">
        <div className="flex flex-wrap gap-2">
          {TIEMPOS.map((t) => (
            <button
              key={t}
              onClick={() => setTiempo(t)}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                tiempo === t ? "border-white bg-white text-black" : "border-zinc-700 text-zinc-300"
              }`}
            >
              {t}s
            </button>
          ))}
        </div>
      </Section>

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      <button
        onClick={crear}
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-display text-base font-bold uppercase text-black disabled:opacity-60"
      >
        <Users className="size-5" /> {loading ? "Creando…" : "Crear sala"}
      </button>
    </AppShell>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
        {hint && <span className="text-[10px] text-zinc-600">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
