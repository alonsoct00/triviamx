import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, Play, SkipForward, X, Check, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryBadge } from "@/components/CategoryBadge";
import { getRandomPreguntas } from "@/lib/preguntas.functions";
import { getCategoria } from "@/lib/categorias";

type SearchParams = {
  categoria?: string;
  nivel?: string;
  cantidad?: string;
  tiempo?: string;
};

export const Route = createFileRoute("/partida/jugar")({
  component: Jugar,
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    categoria: (s.categoria as string) || undefined,
    nivel: (s.nivel as string) || undefined,
    cantidad: (s.cantidad as string) || "10",
    tiempo: (s.tiempo as string) || "10",
  }),
});

type Fase = "leer" | "corriendo" | "tiempo_fuera" | "revelada";

function Jugar() {
  const search = Route.useSearch();
  const cantidad = Number(search.cantidad ?? "10");
  const tiempoBase = Number(search.tiempo ?? "10");
  const nav = useNavigate();

  const { data: preguntas, isLoading, refetch } = useQuery({
    queryKey: ["partida", search.categoria, search.nivel, cantidad],
    queryFn: () =>
      getRandomPreguntas({
        data: {
          categoria: search.categoria,
          nivel: search.nivel,
          cantidad,
        },
      }),
    staleTime: 0,
  });

  const [idx, setIdx] = useState(0);
  const [fase, setFase] = useState<Fase>("leer");
  const [tiempo, setTiempo] = useState(tiempoBase);
  const [correctas, setCorrectas] = useState(0);
  const [incorrectas, setIncorrectas] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const preguntaActual = preguntas?.[idx];
  const categoriaId = preguntaActual?.categoria ?? search.categoria ?? "cultura_general";
  const catColor = useMemo(() => getCategoria(categoriaId).color, [categoriaId]);

  useEffect(() => {
    if (fase !== "corriendo") return;
    timerRef.current = setInterval(() => {
      setTiempo((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setFase("tiempo_fuera");
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate?.([200, 100, 200]);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fase]);

  const iniciarCrono = () => {
    setTiempo(tiempoBase);
    setFase("corriendo");
  };

  const revelar = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFase("revelada");
  };

  const siguiente = (resultado?: "correcta" | "incorrecta") => {
    if (resultado === "correcta") setCorrectas((n) => n + 1);
    if (resultado === "incorrecta") setIncorrectas((n) => n + 1);
    if (idx + 1 >= (preguntas?.length ?? 0)) {
      nav({ to: "/", replace: true });
      return;
    }
    setIdx((n) => n + 1);
    setTiempo(tiempoBase);
    setFase("leer");
  };

  const cambiarPregunta = () => {
    // shuffle remainder: pull a new pool
    refetch();
    setFase("leer");
    setTiempo(tiempoBase);
  };

  if (isLoading) {
    return (
      <AppShell>
        <p className="text-center text-zinc-500">Cargando preguntas…</p>
      </AppShell>
    );
  }
  if (!preguntas?.length || !preguntaActual) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <p className="mb-2 font-display text-lg font-bold">No hay preguntas</p>
          <p className="mb-4 text-sm text-zinc-400">
            No encontramos preguntas para estos filtros. Prueba con otros filtros o genera preguntas con IA.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/partida/nueva" className="rounded-xl border border-zinc-700 py-2 text-sm">
              Cambiar filtros
            </Link>
            <Link to="/ia" className="rounded-xl bg-purple-600 py-2 text-sm font-semibold">
              Generar con IA
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const opciones = Array.isArray(preguntaActual.opciones) ? (preguntaActual.opciones as string[]) : [];

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
          <ArrowLeft className="size-4" /> Salir
        </Link>
        <span className="text-xs font-medium text-zinc-500">
          Pregunta <span className="text-white">{String(idx + 1).padStart(2, "0")}</span>/{preguntas.length}
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <CategoryBadge id={categoriaId} />
        <div className="flex gap-3 text-[11px] font-bold uppercase tracking-wider">
          <span className="text-green-500">✓ {correctas}</span>
          <span className="text-red-500">✗ {incorrectas}</span>
        </div>
      </div>

      <section className="relative">
        <div
          className="absolute -inset-0.5 rounded-2xl blur-sm"
          style={{ background: `linear-gradient(to bottom, ${catColor}33, transparent)` }}
        />
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
          <div className="mb-4 flex items-start justify-between">
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-400">
              Nivel: {preguntaActual.nivel.replace("_", " ")}
            </span>
            <span className="text-[10px] uppercase text-zinc-500">Tipo: {preguntaActual.tipo.replace("_", " ")}</span>
          </div>

          <h2 className="mb-6 font-display text-2xl font-medium leading-tight">{preguntaActual.pregunta}</h2>

          {opciones.length > 0 && fase !== "revelada" && (
            <ul className="mb-4 space-y-2">
              {opciones.map((op, i) => (
                <li key={i} className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                  <span className="mr-2 font-bold text-zinc-500">{String.fromCharCode(65 + i)}.</span>
                  {op}
                </li>
              ))}
            </ul>
          )}

          {fase !== "revelada" ? (
            <div className="border-t border-zinc-800 pt-6">
              <button
                onClick={revelar}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 py-4 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              >
                <Eye className="mr-2 inline size-4" /> Revelar respuesta correcta
              </button>
            </div>
          ) : (
            <div className="rounded-xl border p-4" style={{ borderColor: `${catColor}55`, backgroundColor: `${catColor}12` }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: catColor }}>
                Respuesta correcta
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-white">{preguntaActual.respuesta}</p>
              {preguntaActual.explicacion && (
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{preguntaActual.explicacion}</p>
              )}
              {preguntaActual.fuente && (
                <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">
                  Fuente: {preguntaActual.fuente} · {preguntaActual.fecha_actualizacion}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Timer */}
      <section className="my-6 flex flex-col items-center">
        <div
          className={`relative flex size-40 items-center justify-center rounded-full border-4 border-zinc-900 ${fase === "tiempo_fuera" ? "animate-pulse-red" : ""}`}
        >
          {fase === "corriendo" && (
            <div
              className="absolute inset-0 animate-spin-slow rounded-full border-4 border-t-transparent"
              style={{ borderColor: catColor, borderTopColor: "transparent" }}
            />
          )}
          <span className="font-display text-6xl font-bold tabular-nums tracking-tighter" style={{ color: fase === "tiempo_fuera" ? "#ef4444" : "#fff" }}>
            {tiempo}
          </span>
        </div>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          {fase === "leer" && "Lee la pregunta"}
          {fase === "corriendo" && "Tiempo restante"}
          {fase === "tiempo_fuera" && "¡Se acabó el tiempo!"}
          {fase === "revelada" && "Marca el resultado"}
        </p>
      </section>

      {/* Actions */}
      {fase === "leer" && (
        <button
          onClick={iniciarCrono}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-5 font-display text-sm font-bold uppercase tracking-widest text-black shadow-xl active:scale-95"
        >
          <Play className="size-4" fill="currentColor" /> Iniciar cronómetro
        </button>
      )}
      {fase === "corriendo" && (
        <button
          onClick={revelar}
          className="w-full rounded-2xl bg-zinc-800 py-5 font-display text-sm font-bold uppercase tracking-widest text-zinc-200"
        >
          Detener y revelar
        </button>
      )}
      {fase === "tiempo_fuera" && (
        <button
          onClick={revelar}
          className="w-full rounded-2xl bg-red-600 py-5 font-display text-sm font-bold uppercase tracking-widest text-white shadow-xl"
        >
          <Eye className="mr-2 inline size-4" /> Mostrar respuesta
        </button>
      )}
      {fase === "revelada" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => siguiente("incorrecta")}
              className="flex flex-col items-center justify-center rounded-2xl border border-red-900/40 bg-zinc-900 py-5 hover:bg-red-950/20"
            >
              <X className="mb-1 size-6 text-red-500" />
              <span className="text-sm font-bold uppercase text-red-500">Incorrecta</span>
            </button>
            <button
              onClick={() => siguiente("correcta")}
              className="flex flex-col items-center justify-center rounded-2xl border border-green-900/40 bg-zinc-900 py-5 hover:bg-green-950/20"
            >
              <Check className="mb-1 size-6 text-green-500" />
              <span className="text-sm font-bold uppercase text-green-500">Correcta</span>
            </button>
          </div>
          <button
            onClick={() => siguiente()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-display text-sm font-bold uppercase tracking-widest text-black active:scale-95"
          >
            <SkipForward className="size-4" /> Siguiente pregunta
          </button>
          <button
            onClick={cambiarPregunta}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 py-3 text-xs uppercase tracking-widest text-zinc-400"
          >
            <RotateCcw className="size-3.5" /> Cambiar preguntas
          </button>
        </div>
      )}
    </AppShell>
  );
}
