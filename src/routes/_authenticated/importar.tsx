import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Download, Loader2, Globe } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIAS, NIVELES } from "@/lib/categorias";
import { importarDesdeURL } from "@/lib/importar.functions";

export const Route = createFileRoute("/_authenticated/importar")({
  component: Importar,
});

const PRESETS: { url: string; label: string; categoria: string; nivel: string }[] = [
  { url: "https://www.culturagenial.com/es/preguntas-de-cultura-general-para-ninos/", label: "Cultura general para niños", categoria: "cultura_general", nivel: "muy_facil" },
  { url: "https://www.todamateria.com/preguntas-de-historia-cultura-general-de-mexico/", label: "Historia y cultura de México", categoria: "historia_mexico", nivel: "media" },
  { url: "https://www.ejemplos.co/preguntas-de-cultura-general/", label: "Preguntas de cultura general", categoria: "cultura_general", nivel: "media" },
  { url: "https://psicologiaymente.com/cultura/preguntas-cultura-general", label: "Psicología y Mente — cultura general", categoria: "cultura_general", nivel: "media" },
  { url: "https://wordwall.net/es/resource/14992155/el-rival-m%C3%A1s-d%C3%A9bil", label: "El Rival Más Débil (Wordwall)", categoria: "cultura_general", nivel: "media" },
  { url: "https://www.cosmopolitan.com/es/consejos-planes/familia-amigos/a40706432/200-preguntas-de-cultura-general-y-su-respuesta/", label: "Cosmopolitan — 200+ preguntas de cultura general", categoria: "cultura_general", nivel: "media" },
];

function Importar() {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [categoria, setCategoria] = useState("cultura_general");
  const [nivel, setNivel] = useState("media");
  const [max, setMax] = useState(20);
  const [log, setLog] = useState<{ url: string; ok: boolean; msg: string }[]>([]);

  const imp = useMutation({
    mutationFn: (u: string) =>
      importarDesdeURL({ data: { url: u, categoriaSugerida: categoria, nivelSugerido: nivel, max } }),
    onSuccess: (res, u) => {
      setLog((l) => [{ url: u, ok: true, msg: `+${res.generadas} preguntas${res.nota ? " · " + res.nota : ""}` }, ...l]);
      qc.invalidateQueries({ queryKey: ["preguntas"] });
      qc.invalidateQueries({ queryKey: ["contar"] });
    },
    onError: (e, u) => {
      setLog((l) => [{ url: u, ok: false, msg: e instanceof Error ? e.message : "Error" }, ...l]);
    },
  });

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400">
        <ArrowLeft className="size-4" /> Regresar
      </Link>

      <div className="mb-6 rounded-2xl border border-cyan-800/40 bg-gradient-to-br from-cyan-600/10 to-transparent p-5">
        <div className="mb-2 flex items-center gap-2 text-cyan-400">
          <Globe className="size-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Importar desde la web</p>
        </div>
        <h2 className="font-display text-2xl font-bold">Trae preguntas desde una URL</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Descargamos la página y la IA extrae pares pregunta+respuesta. Se guardan en tu banco sin duplicados.
        </p>
      </div>

      <section className="mb-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">URL</p>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-cyan-500"
        />
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Categoría sugerida</p>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm">
            {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
          </select>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Nivel sugerido</p>
          <select value={nivel} onChange={(e) => setNivel(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm">
            {NIVELES.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Máximo por URL ({max})</p>
        <input type="range" min={5} max={40} value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-full accent-cyan-500" />
      </div>

      <button
        onClick={() => url && imp.mutate(url)}
        disabled={imp.isPending || !url}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 py-4 font-display text-sm font-bold uppercase tracking-widest text-white disabled:opacity-60"
      >
        {imp.isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        {imp.isPending ? "Importando…" : "Importar de esta URL"}
      </button>

      <section className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Fuentes sugeridas</p>
        <ul className="space-y-2">
          {PRESETS.map((p) => (
            <li key={p.url} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-sm font-semibold">{p.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-zinc-400">{p.url}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => { setUrl(p.url); setCategoria(p.categoria); setNivel(p.nivel); }}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-[11px] text-zinc-300"
                >
                  Usar
                </button>
                <button
                  onClick={() => { setUrl(p.url); setCategoria(p.categoria); setNivel(p.nivel); imp.mutate(p.url); }}
                  disabled={imp.isPending}
                  className="rounded-lg bg-cyan-600 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                >
                  Importar ahora
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {log.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Resultado</p>
          <ul className="space-y-2">
            {log.map((l, i) => (
              <li key={i} className={`rounded-xl border p-3 text-xs ${l.ok ? "border-green-900/50 bg-green-950/20 text-green-300" : "border-red-900/50 bg-red-950/20 text-red-300"}`}>
                <p className="font-semibold">{l.ok ? "✓" : "✗"} {l.msg}</p>
                <p className="mt-0.5 truncate text-[10px] opacity-70">{l.url}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
