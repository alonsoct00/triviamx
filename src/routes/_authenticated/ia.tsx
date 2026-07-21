import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIAS, NIVELES } from "@/lib/categorias";
import { generarPreguntasIA } from "@/lib/ia.functions";

export const Route = createFileRoute("/_authenticated/ia")({
  component: IAGen,
});

const TIPOS = [
  { id: "opcion_multiple", nombre: "Opción múltiple" },
  { id: "verdadero_falso", nombre: "Verdadero / Falso" },
  { id: "abierta", nombre: "Respuesta abierta" },
  { id: "completar", nombre: "Completar frase" },
];

function IAGen() {
  const qc = useQueryClient();
  const [categoria, setCategoria] = useState("cultura_general");
  const [nivel, setNivel] = useState("media");
  const [tipo, setTipo] = useState("opcion_multiple");
  const [cantidad, setCantidad] = useState(5);
  const [tema, setTema] = useState("");

  const gen = useMutation({
    mutationFn: () =>
      generarPreguntasIA({ data: { categoria, nivel, cantidad, tipo, tema: tema || undefined } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["preguntas"] });
      qc.invalidateQueries({ queryKey: ["contar"] });
    },
  });

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400">
        <ArrowLeft className="size-4" /> Regresar
      </Link>

      <div className="mb-6 rounded-2xl border border-purple-800/40 bg-gradient-to-br from-purple-600/10 to-transparent p-5">
        <div className="mb-2 flex items-center gap-2 text-purple-400">
          <Sparkles className="size-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Generación con IA</p>
        </div>
        <h2 className="font-display text-2xl font-bold">Nuevas preguntas al instante</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Impulsado por Lovable AI. Las preguntas se guardan automáticamente en tu banco.
        </p>
      </div>

      <section className="mb-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Categoría</p>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm"
        >
          {CATEGORIAS.map((c) => (
            <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>
          ))}
        </select>
      </section>

      <section className="mb-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Nivel</p>
        <div className="grid grid-cols-3 gap-2">
          {NIVELES.map((n) => (
            <button
              key={n.id}
              onClick={() => setNivel(n.id)}
              className={`rounded-xl border p-2 text-xs font-semibold ${nivel === n.id ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-zinc-800 bg-zinc-900 text-zinc-400"}`}
            >
              {n.nombre}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Tipo</p>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTipo(t.id)}
              className={`rounded-xl border p-2 text-xs font-semibold ${tipo === t.id ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-zinc-800 bg-zinc-900 text-zinc-400"}`}
            >
              {t.nombre}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Cantidad ({cantidad})</p>
        <input
          type="range"
          min={1}
          max={10}
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
      </section>

      <section className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Tema específico (opcional)</p>
        <input
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          placeholder="Ej: rock de los 80s, presidentes de México, ecuaciones cuadráticas"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-purple-500"
        />
      </section>

      <button
        onClick={() => gen.mutate()}
        disabled={gen.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-5 font-display text-sm font-bold uppercase tracking-widest text-white shadow-xl disabled:opacity-60"
      >
        {gen.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {gen.isPending ? "Generando…" : "Generar preguntas"}
      </button>

      {gen.isError && (
        <p className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-300">
          {(gen.error as Error).message}
        </p>
      )}
      {gen.isSuccess && gen.data && (
        <div className="mt-6 rounded-2xl border border-green-900/40 bg-green-950/20 p-4">
          <p className="text-sm font-semibold text-green-300">✓ Se generaron {gen.data.generadas} preguntas.</p>
          <p className="mt-1 text-xs text-green-500/80">Guardadas en el banco. Puedes usarlas en tu próxima partida.</p>
          <div className="mt-3 flex gap-2">
            <Link to="/banco" className="rounded-lg border border-green-800/50 px-3 py-1.5 text-xs font-semibold text-green-200">
              Ver banco
            </Link>
            <Link to="/partida/nueva" className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white">
              Jugar ahora
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
