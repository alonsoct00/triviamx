import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useSettings } from "@/lib/settings";
import { TIEMPOS } from "@/lib/categorias";

export const Route = createFileRoute("/_authenticated/ajustes")({
  component: Ajustes,
});

function Ajustes() {
  const [s, update] = useSettings();

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400">
        <ArrowLeft className="size-4" /> Regresar
      </Link>
      <h2 className="mb-4 font-display text-2xl font-bold">Configuración</h2>

      <section className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Tiempo por defecto</p>
        <div className="grid grid-cols-5 gap-2">
          {TIEMPOS.map((t) => (
            <button
              key={t}
              onClick={() => update({ tiempoDefault: t })}
              className={`rounded-xl border p-3 font-display text-lg font-bold ${s.tiempoDefault === t ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-800 bg-zinc-900"}`}
            >
              {t}s
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Cantidad por defecto</p>
        <div className="grid grid-cols-5 gap-2">
          {[5, 10, 15, 20, 30].map((n) => (
            <button
              key={n}
              onClick={() => update({ cantidadDefault: n })}
              className={`rounded-xl border p-3 font-display text-lg font-bold ${s.cantidadDefault === n ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-800 bg-zinc-900"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <ul className="space-y-3">
        <Toggle
          label="Vibración"
          hint="Al acabarse el tiempo"
          value={s.vibracion}
          onChange={(v) => update({ vibracion: v })}
        />
        <Toggle
          label="Sonidos"
          hint="Beep al iniciar/terminar el cronómetro"
          value={s.sonido}
          onChange={(v) => update({ sonido: v })}
        />
        <Toggle
          label="Modo presentador"
          hint="Entrar automáticamente en pantalla completa al iniciar partida"
          value={s.presentador}
          onChange={(v) => update({ presentador: v })}
        />
        <Row label="Tema" value="Oscuro (Neon Console)" />
        <Row label="Idioma" value="Español (México)" />
      </ul>
      <p className="mt-6 text-center text-[10px] uppercase tracking-widest text-zinc-600">Trivia MX · v0.2</p>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      <span className="text-xs text-zinc-500">{value}</span>
    </li>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${value ? "bg-blue-600" : "bg-zinc-700"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${value ? "left-5" : "left-0.5"}`}
        />
      </button>
    </li>
  );
}
