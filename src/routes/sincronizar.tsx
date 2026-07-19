import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/sincronizar")({
  component: Sync,
});

function Sync() {
  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400">
        <ArrowLeft className="size-4" /> Regresar
      </Link>
      <h2 className="mb-4 font-display text-2xl font-bold">Sincronizar preguntas</h2>
      <div className="rounded-2xl border border-cyan-900/40 bg-cyan-950/20 p-5">
        <div className="mb-3 flex items-center gap-2 text-cyan-400">
          <RefreshCw className="size-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Próximamente</p>
        </div>
        <p className="text-sm text-zinc-300">
          Este módulo consultará fuentes públicas (Wikidata, ONU, NASA, OMS) para
          detectar información desactualizada y actualizar preguntas del banco de
          forma automática. Por ahora puedes generar preguntas al instante con IA.
        </p>
        <Link
          to="/ia"
          className="mt-4 inline-flex rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Ir a Generar con IA
        </Link>
      </div>
    </AppShell>
  );
}
