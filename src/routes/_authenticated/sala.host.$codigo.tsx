import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { AppShell } from "@/components/AppShell";
import { estadoSala, iniciarSala, revelarSala, siguienteSala, cerrarSala } from "@/lib/sala.functions";
import { ArrowLeft, Copy, Play, SkipForward, Eye, Square, Trophy, Share2, QrCode } from "lucide-react";


export const Route = createFileRoute("/_authenticated/sala/host/$codigo")({
  component: SalaHost,
  head: () => ({ meta: [{ title: "Anfitrión de sala" }] }),
});

function SalaHost() {
  const { codigo } = Route.useParams();
  const q = useQuery({
    queryKey: ["sala-host", codigo],
    queryFn: () => estadoSala({ data: { codigo } }),
    refetchInterval: 1500,
  });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  const link = useMemo(
    () => (typeof window !== "undefined" ? `${window.location.origin}/sala/${codigo}` : `/sala/${codigo}`),
    [codigo],
  );

  useEffect(() => {
    if (!qrOpen || qrSrc) return;
    QRCode.toDataURL(link, { width: 512, margin: 1, color: { dark: "#000000", light: "#ffffff" } })
      .then(setQrSrc)
      .catch(() => setQrSrc(null));
  }, [qrOpen, qrSrc, link]);

  const compartir = async () => {
    const datos = {
      title: "Trivia Master MX",
      text: `Únete a mi sala de trivia con el código ${codigo}`,
      url: link,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(datos);
        return;
      } catch {
        return;
      }
    }
    await copiar();
  };


  async function accion(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await q.refetch();
    } finally {
      setBusy(false);
    }
  }

  if (q.isLoading || !q.data) return <AppShell><p className="text-zinc-400">Cargando…</p></AppShell>;
  const { sala, jugadores, pregunta } = q.data;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-xs text-zinc-400">
        <ArrowLeft className="size-4" /> Salir
      </Link>

      <section className="mb-5 rounded-2xl border border-zinc-800 bg-gradient-to-br from-cyan-500/10 to-transparent p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Código de sala</p>
        <p className="mt-1 font-display text-5xl font-bold tracking-widest">{sala.codigo}</p>
        <button
          onClick={copiar}
          className="mt-3 flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300"
        >
          <span className="truncate">{link}</span>
          <span className="flex items-center gap-1 text-zinc-400">
            <Copy className="size-3.5" /> {copied ? "¡Copiado!" : "Copiar"}
          </span>
        </button>
      </section>

      <section className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Estado</p>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-300">{sala.estado}</span>
        </div>
        {sala.estado === "esperando" ? (
          <p className="text-sm text-zinc-400">
            {jugadores.length} {jugadores.length === 1 ? "invitado listo" : "invitados listos"}
          </p>
        ) : sala.estado === "finalizada" ? (
          <p className="text-sm text-zinc-400">Sala finalizada.</p>
        ) : (
          <>
            <p className="text-xs text-zinc-400">Pregunta {sala.orden_actual + 1} / {sala.cantidad}</p>
            {pregunta && (
              <p className="mt-2 font-display text-lg font-semibold leading-tight">{pregunta.pregunta}</p>
            )}
            {pregunta?.respuesta && (
              <p className="mt-2 rounded-lg bg-lime-500/10 p-2 text-sm text-lime-300">
                ✓ {pregunta.respuesta}
              </p>
            )}
          </>
        )}
      </section>

      <div className="mb-6 grid grid-cols-2 gap-2">
        {sala.estado === "esperando" && (
          <button
            disabled={busy || jugadores.length === 0}
            onClick={() => accion(() => iniciarSala({ data: { codigo } }))}
            className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold uppercase text-black disabled:opacity-40"
          >
            <Play className="size-4" fill="currentColor" /> Empezar
          </button>
        )}
        {sala.estado === "en_juego" && (
          <>
            <button
              disabled={busy}
              onClick={() => accion(() => revelarSala({ data: { codigo } }))}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-bold uppercase text-black disabled:opacity-40"
            >
              <Eye className="size-4" /> Revelar
            </button>
            <button
              disabled={busy}
              onClick={() => accion(() => siguienteSala({ data: { codigo } }))}
              className="flex items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-3 font-bold uppercase text-white disabled:opacity-40"
            >
              <SkipForward className="size-4" /> Siguiente
            </button>
          </>
        )}
        {sala.estado === "revelada" && (
          <button
            disabled={busy}
            onClick={() => accion(() => siguienteSala({ data: { codigo } }))}
            className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold uppercase text-black disabled:opacity-40"
          >
            <SkipForward className="size-4" /> Siguiente pregunta
          </button>
        )}
        {sala.estado !== "finalizada" && (
          <button
            disabled={busy}
            onClick={() => accion(() => cerrarSala({ data: { codigo } }))}
            className="col-span-2 mt-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-xs text-zinc-400"
          >
            <Square className="size-3" /> Terminar sala
          </button>
        )}
      </div>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <Trophy className="size-3.5" /> Marcador
        </h2>
        {jugadores.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-400">
            Esperando invitados…
          </p>
        ) : (
          <ul className="space-y-1.5">
            {jugadores.map((j, i) => (
              <li
                key={j.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2"
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-zinc-400">{i + 1}</span>
                  <span className="text-sm font-semibold">{j.nickname}</span>
                </span>
                <span className="flex items-center gap-3 text-xs">
                  <span className="text-lime-400">✓ {j.correctas}</span>
                  <span className="text-red-400">✗ {j.incorrectas}</span>
                  <span className="font-display text-base font-bold text-white">{j.puntos}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

