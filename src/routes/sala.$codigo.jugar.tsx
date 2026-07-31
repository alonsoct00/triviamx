import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { estadoSala, enviarRespuestaSala } from "@/lib/sala.functions";
import { Trophy, Check, X, Clock } from "lucide-react";

export const Route = createFileRoute("/sala/$codigo/jugar")({
  component: JugarSala,
  head: () => ({ meta: [{ title: "Jugando en sala" }] }),
});

function JugarSala() {
  const { codigo } = Route.useParams();
  const nav = useNavigate();
  const [jugadorId, setJugadorId] = useState<string | null>(null);
  const [nick, setNick] = useState<string>("");
  const [respuestaLocal, setRespuestaLocal] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ correcta: boolean; puntos: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [ordenLocal, setOrdenLocal] = useState<number>(-1);

  useEffect(() => {
    const id = sessionStorage.getItem(`sala:${codigo}:jugador`);
    const n = sessionStorage.getItem(`sala:${codigo}:nick`);
    if (!id) {
      nav({ to: "/sala/$codigo", params: { codigo } });
      return;
    }
    setJugadorId(id);
    setNick(n ?? "");
  }, [codigo, nav]);

  const q = useQuery({
    queryKey: ["sala-jugar", codigo, jugadorId],
    queryFn: () => estadoSala({ data: { codigo, jugador_id: jugadorId ?? undefined } }),
    refetchInterval: 1200,
    enabled: !!jugadorId,
  });

  // Reset al cambiar de pregunta
  useEffect(() => {
    if (!q.data) return;
    if (q.data.sala.orden_actual !== ordenLocal) {
      setOrdenLocal(q.data.sala.orden_actual);
      setRespuestaLocal(null);
      setResultado(null);
    }
  }, [q.data, ordenLocal]);

  // Cronómetro
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  const restante = useMemo(() => {
    if (!q.data?.sala.pregunta_started_at) return null;
    const start = new Date(q.data.sala.pregunta_started_at).getTime();
    const total = q.data.sala.tiempo_segundos;
    const el = (ahora - start) / 1000;
    return Math.max(0, Math.ceil(total - el));
  }, [q.data, ahora]);

  async function responder(r: string) {
    const token = typeof window !== "undefined" ? sessionStorage.getItem(`sala:${codigo}:token`) : null;
    if (!jugadorId || !token || enviando || respuestaLocal) return;
    setRespuestaLocal(r);
    setEnviando(true);
    try {
      const res = await enviarRespuestaSala({ data: { codigo, jugador_id: jugadorId, token, respuesta: r } });
      setResultado(res);
    } catch (e) {
      setResultado({ correcta: false, puntos: 0 });
      // eslint-disable-next-line no-console
      console.warn(e);
    } finally {
      setEnviando(false);
    }
  }

  if (!jugadorId || !q.data) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 text-center text-zinc-400">Cargando…</div>
    );
  }

  const { sala, jugadores, pregunta } = q.data;
  const yo = jugadores.find((j) => j.id === jugadorId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-md px-4 pb-24 pt-6">
        <div className="mb-4 flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            Sala <span className="font-mono text-zinc-300">{sala.codigo}</span>
          </span>
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-zinc-300">
            {nick} · <b className="text-white">{yo?.puntos ?? 0}</b>
          </span>
        </div>

        {sala.estado === "esperando" && (
          <EstadoCard title="Esperando al anfitrión" subtitle="La partida arranca en un momento." />
        )}

        {sala.estado === "finalizada" && (
          <ResultadosFinales jugadores={jugadores} miId={jugadorId} />
        )}

        {(sala.estado === "en_juego" || sala.estado === "revelada") && pregunta && (
          <>
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-zinc-400">
                {sala.orden_actual + 1}/{sala.cantidad}
              </span>
              <span className="flex items-center gap-1 text-zinc-300">
                <Clock className="size-3.5" /> {restante ?? "–"}s
              </span>
            </div>

            <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="font-display text-xl font-semibold leading-tight">{pregunta.pregunta}</p>
            </div>

            {pregunta.opciones.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {pregunta.opciones.map((op, i) => {
                  const seleccionada = respuestaLocal === op;
                  const revelada = sala.estado === "revelada";
                  const esCorrecta = revelada && pregunta.respuesta && normalizar(op) === normalizar(pregunta.respuesta);
                  const clase = esCorrecta
                    ? "border-lime-500 bg-lime-500/10 text-lime-300"
                    : revelada && seleccionada
                      ? "border-red-600 bg-red-500/10 text-red-300"
                      : seleccionada
                        ? "border-white bg-white/10"
                        : "border-zinc-800 bg-zinc-900";
                  return (
                    <button
                      key={i}
                      disabled={!!respuestaLocal || sala.estado !== "en_juego"}
                      onClick={() => responder(op)}
                      className={`rounded-xl border p-4 text-left text-base font-medium ${clase} disabled:opacity-70`}
                    >
                      <span className="mr-2 text-zinc-400">{String.fromCharCode(65 + i)}.</span> {op}
                    </button>
                  );
                })}
              </div>
            ) : (
              <RespuestaAbierta
                disabled={!!respuestaLocal || sala.estado !== "en_juego"}
                onSubmit={responder}
              />
            )}

            {resultado && (
              <div
                className={`mt-4 flex items-center justify-between rounded-xl p-3 text-sm ${
                  resultado.correcta ? "bg-lime-500/15 text-lime-300" : "bg-red-500/15 text-red-300"
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  {resultado.correcta ? <Check className="size-4" /> : <X className="size-4" />}
                  {resultado.correcta ? "¡Correcto!" : "Incorrecto"}
                </span>
                <span className="font-display text-lg font-bold">+{resultado.puntos}</span>
              </div>
            )}

            {sala.estado === "revelada" && pregunta.respuesta && (
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Respuesta</p>
                <p className="mt-1 font-semibold text-lime-300">{pregunta.respuesta}</p>
                {pregunta.explicacion && (
                  <p className="mt-2 text-xs text-zinc-400">{pregunta.explicacion}</p>
                )}
              </div>
            )}

            <section className="mt-6">
              <h2 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <Trophy className="size-3.5" /> Marcador
              </h2>
              <ul className="space-y-1.5">
                {jugadores.slice(0, 8).map((j, i) => (
                  <li
                    key={j.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                      j.id === jugadorId ? "border-white bg-white/5" : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-5 text-right text-xs text-zinc-400">{i + 1}</span>
                      <span>{j.nickname}</span>
                    </span>
                    <span className="font-display font-bold">{j.puntos}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function RespuestaAbierta({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (r: string) => void;
}) {
  const [val, setVal] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (val.trim()) onSubmit(val.trim());
      }}
    >
      <input
        autoFocus
        disabled={disabled}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Escribe tu respuesta"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none focus:border-cyan-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !val.trim()}
        className="mt-2 w-full rounded-xl bg-white px-4 py-3 font-bold uppercase text-black disabled:opacity-40"
      >
        Enviar
      </button>
    </form>
  );
}

function EstadoCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-16 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
      <p className="font-display text-2xl font-bold">{title}</p>
      <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
    </div>
  );
}

function ResultadosFinales({
  jugadores,
  miId,
}: {
  jugadores: { id: string; nickname: string; puntos: number; correctas: number; incorrectas: number }[];
  miId: string;
}) {
  const podio = jugadores.slice(0, 3);
  const yo = jugadores.find((j) => j.id === miId);
  const miPos = jugadores.findIndex((j) => j.id === miId) + 1;
  return (
    <div>
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">Resultados</p>
      <h2 className="mb-6 text-center font-display text-3xl font-bold">¡Fin de la partida!</h2>
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-center">
        <p className="text-xs text-zinc-400">Terminaste en</p>
        <p className="font-display text-4xl font-bold">#{miPos}</p>
        <p className="mt-1 text-sm text-zinc-400">{yo?.puntos ?? 0} puntos</p>
      </div>
      <ul className="space-y-2">
        {podio.map((j, i) => (
          <li
            key={j.id}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
          >
            <span className="font-display text-lg">
              {["🥇", "🥈", "🥉"][i]} {j.nickname}
            </span>
            <span className="font-display text-xl font-bold">{j.puntos}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
