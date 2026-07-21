import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, Play, SkipForward, X, Check, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryBadge } from "@/components/CategoryBadge";
import { getRandomPreguntas } from "@/lib/preguntas.functions";
import { crearPartida, finalizarPartida, registrarRespuesta } from "@/lib/partidas.functions";
import { getCategoria } from "@/lib/categorias";
import { beep, useSettings } from "@/lib/settings";

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
  const [settings] = useSettings();

  const { data: preguntas, isLoading, refetch } = useQuery({
    queryKey: ["partida", search.categoria, search.nivel, cantidad],
    queryFn: () =>
      getRandomPreguntas({
        data: { categoria: search.categoria, nivel: search.nivel, cantidad },
      }),
    staleTime: 0,
  });

  const [idx, setIdx] = useState(0);
  const [fase, setFase] = useState<Fase>("leer");
  const [tiempo, setTiempo] = useState(tiempoBase);
  const [correctas, setCorrectas] = useState(0);
  const [incorrectas, setIncorrectas] = useState(0);
  const [presentador, setPresentador] = useState(false);
  const [partidaId, setPartidaId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inicioRef = useRef<number>(Date.now());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const creadaRef = useRef(false);

  // Create partida once preguntas are loaded
  useEffect(() => {
    if (creadaRef.current) return;
    if (!preguntas || preguntas.length === 0) return;
    creadaRef.current = true;
    crearPartida({
      data: {
        categoria: search.categoria,
        nivel: search.nivel,
        cantidad: preguntas.length,
        tiempo_segundos: tiempoBase,
      },
    })
      .then((row) => setPartidaId(row.id))
      .catch(() => {
        /* si falla persistencia, seguimos jugando */
      });
  }, [preguntas, search.categoria, search.nivel, tiempoBase]);

  // Auto-presentador setting
  useEffect(() => {
    if (settings.presentador && !presentador) setPresentador(true);
     
  }, [settings.presentador]);

  const preguntaActual = preguntas?.[idx];
  const categoriaId = preguntaActual?.categoria ?? search.categoria ?? "cultura_general";
  const catColor = useMemo(() => getCategoria(categoriaId).color, [categoriaId]);

  useEffect(() => {
    if (fase !== "corriendo") return;
    inicioRef.current = Date.now();
    if (settings.sonido) beep(0.1, 660, 100);
    timerRef.current = setInterval(() => {
      setTiempo((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setFase("tiempo_fuera");
          if (settings.vibracion && typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate?.([200, 100, 200]);
          }
          if (settings.sonido) beep(0.2, 220, 400);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fase, settings.sonido, settings.vibracion]);

  const iniciarCrono = () => {
    setTiempo(tiempoBase);
    setFase("corriendo");
  };

  const revelar = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFase("revelada");
  };

  const siguiente = (resultado?: "correcta" | "incorrecta") => {
    const usados = Math.min(tiempoBase, Math.round((Date.now() - inicioRef.current) / 1000));
    if (resultado === "correcta") setCorrectas((n) => n + 1);
    if (resultado === "incorrecta") setIncorrectas((n) => n + 1);
    // persist
    if (partidaId && preguntaActual) {
      registrarRespuesta({
        data: {
          partida_id: partidaId,
          pregunta_id: preguntaActual.id,
          orden: idx + 1,
          resultado: resultado ?? "sin_responder",
          segundos_usados: usados,
        },
      }).catch(() => {});
    }
    if (idx + 1 >= (preguntas?.length ?? 0)) {
      if (partidaId) finalizarPartida({ data: { partida_id: partidaId } }).catch(() => {});
      nav({ to: "/historial", replace: true });
      return;
    }
    setIdx((n) => n + 1);
    setTiempo(tiempoBase);
    setFase("leer");
  };

  const cambiarPregunta = () => {
    refetch();
    setFase("leer");
    setTiempo(tiempoBase);
  };

  const salir = () => {
    if (partidaId) finalizarPartida({ data: { partida_id: partidaId, estado: "abandonada" } }).catch(() => {});
    nav({ to: "/", replace: true });
  };

  const togglePresentador = async () => {
    const next = !presentador;
    setPresentador(next);
    try {
      if (next && containerRef.current && containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      } else if (!next && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      /* fullscreen may be blocked in iframe */
    }
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
            No encontramos preguntas para estos filtros. Prueba con otros o genera con IA.
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

  // ==== Modo presentador (fullscreen, letras gigantes) ====
  if (presentador) {
    return (
      <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white">
        <header className="flex items-center justify-between border-b border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <CategoryBadge id={categoriaId} />
            <span className="text-sm text-zinc-500">
              {String(idx + 1).padStart(2, "0")}/{preguntas.length}
            </span>
          </div>
          <div className="flex items-center gap-4 text-lg font-bold">
            <span className="text-green-500">✓ {correctas}</span>
            <span className="text-red-500">✗ {incorrectas}</span>
            <button
              onClick={togglePresentador}
              className="rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:bg-zinc-900"
              aria-label="Salir de pantalla completa"
            >
              <Minimize2 className="size-4" />
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-8 px-8 text-center">
          <p
            className="font-display font-bold leading-tight"
            style={{ fontSize: "clamp(2rem, 6vw, 5rem)", color: fase === "revelada" ? "#71717a" : "#fff" }}
          >
            {preguntaActual.pregunta}
          </p>

          {opciones.length > 0 && fase !== "revelada" && (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ maxWidth: "80vw" }}>
              {opciones.map((op, i) => (
                <li
                  key={i}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4 text-left"
                  style={{ fontSize: "clamp(1rem, 2.4vw, 2rem)" }}
                >
                  <span className="mr-3 font-bold text-zinc-500">{String.fromCharCode(65 + i)}.</span>
                  {op}
                </li>
              ))}
            </ul>
          )}

          {fase === "revelada" && (
            <div
              className="rounded-3xl border-4 p-8"
              style={{ borderColor: catColor, backgroundColor: `${catColor}15` }}
            >
              <p
                className="font-bold uppercase tracking-[0.3em]"
                style={{ color: catColor, fontSize: "clamp(0.9rem, 1.2vw, 1.2rem)" }}
              >
                Respuesta
              </p>
              <p
                className="mt-2 font-display font-bold"
                style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
              >
                {preguntaActual.respuesta}
              </p>
              {preguntaActual.explicacion && (
                <p className="mt-4 text-zinc-300" style={{ fontSize: "clamp(1rem, 2vw, 1.6rem)" }}>
                  {preguntaActual.explicacion}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-8">
            <div
              className={`flex items-center justify-center rounded-full border-8 border-zinc-900 ${fase === "tiempo_fuera" ? "animate-pulse-red" : ""}`}
              style={{ width: "min(30vw,20vh)", height: "min(30vw,20vh)" }}
            >
              {fase === "corriendo" && (
                <div
                  className="absolute animate-spin-slow rounded-full border-8 border-t-transparent"
                  style={{
                    width: "min(30vw,20vh)",
                    height: "min(30vw,20vh)",
                    borderColor: catColor,
                    borderTopColor: "transparent",
                  }}
                />
              )}
              <span
                className="font-display font-bold tabular-nums"
                style={{
                  fontSize: "clamp(4rem, 12vw, 10rem)",
                  color: fase === "tiempo_fuera" ? "#ef4444" : "#fff",
                }}
              >
                {tiempo}
              </span>
            </div>
          </div>
        </main>

        <footer className="border-t border-zinc-800 p-4">
          <PresenterControls
            fase={fase}
            onStart={iniciarCrono}
            onReveal={revelar}
            onCorrect={() => siguiente("correcta")}
            onWrong={() => siguiente("incorrecta")}
            onSkip={() => siguiente()}
            onExit={salir}
          />
        </footer>
      </div>
    );
  }

  // ==== Vista mobile normal ====
  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={salir} className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
          <ArrowLeft className="size-4" /> Salir
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-500">
            Pregunta <span className="text-white">{String(idx + 1).padStart(2, "0")}</span>/{preguntas.length}
          </span>
          <button
            onClick={togglePresentador}
            className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-900"
            aria-label="Modo presentador"
            title="Modo presentador"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>
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
          <span
            className="font-display text-6xl font-bold tabular-nums tracking-tighter"
            style={{ color: fase === "tiempo_fuera" ? "#ef4444" : "#fff" }}
          >
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

function PresenterControls({
  fase,
  onStart,
  onReveal,
  onCorrect,
  onWrong,
  onSkip,
  onExit,
}: {
  fase: Fase;
  onStart: () => void;
  onReveal: () => void;
  onCorrect: () => void;
  onWrong: () => void;
  onSkip: () => void;
  onExit: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl items-center justify-center gap-3">
      <button onClick={onExit} className="rounded-xl border border-zinc-800 px-4 py-3 text-sm text-zinc-400">
        Salir
      </button>
      {fase === "leer" && (
        <button
          onClick={onStart}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-4 font-display text-base font-bold uppercase tracking-widest text-black"
        >
          <Play className="size-5" fill="currentColor" /> Iniciar cronómetro
        </button>
      )}
      {fase === "corriendo" && (
        <button
          onClick={onReveal}
          className="flex-1 rounded-2xl bg-zinc-800 py-4 font-display text-base font-bold uppercase tracking-widest text-zinc-200"
        >
          Detener y revelar
        </button>
      )}
      {fase === "tiempo_fuera" && (
        <button
          onClick={onReveal}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 font-display text-base font-bold uppercase tracking-widest text-white"
        >
          <Eye className="size-5" /> Mostrar respuesta
        </button>
      )}
      {fase === "revelada" && (
        <>
          <button
            onClick={onWrong}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-red-600 py-4 font-bold uppercase text-red-500"
          >
            <X className="size-5" /> Incorrecta
          </button>
          <button
            onClick={onCorrect}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-green-600 py-4 font-bold uppercase text-green-500"
          >
            <Check className="size-5" /> Correcta
          </button>
          <button
            onClick={onSkip}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-bold uppercase text-black"
          >
            <SkipForward className="size-5" /> Siguiente
          </button>
        </>
      )}
    </div>
  );
}
