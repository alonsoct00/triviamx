import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play, Library, Sparkles, History, BarChart3, Settings, RefreshCw, Globe } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { contarPreguntas } from "@/lib/preguntas.functions";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [{ title: "Trivia Master MX — Panel del Moderador" }],
  }),
});

function Home() {
  const { data } = useQuery({
    queryKey: ["contar"],
    queryFn: () => contarPreguntas(),
  });
  const total = data?.total ?? 0;

  return (
    <AppShell>
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-gradient-to-br from-blue-600/10 to-transparent p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Banco activo</p>
        <p className="mt-1 font-display text-3xl font-bold">{total.toLocaleString("es-MX")} <span className="text-sm font-medium text-zinc-400">preguntas</span></p>
        <p className="mt-1 text-xs text-zinc-500">Español (México) · Actualizable con IA</p>
      </section>

      <Link
        to="/partida/nueva"
        className="mb-4 flex w-full items-center justify-between rounded-2xl bg-white p-5 text-black shadow-[0_10px_40px_-10px_rgba(255,255,255,0.15)] active:scale-[0.98]"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-black/60">Empezar</p>
          <p className="mt-0.5 font-display text-xl font-bold uppercase tracking-tight">Nueva partida</p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-full bg-black text-white">
          <Play className="size-5" fill="currentColor" />
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Tile to="/banco" icon={<Library className="size-5" />} label="Banco de preguntas" hint="Filtra y edita" />
        <Tile to="/ia" icon={<Sparkles className="size-5" />} label="Generar con IA" hint="Crea preguntas nuevas" accent="text-purple-400" />
        <Tile to="/historial" icon={<History className="size-5" />} label="Historial" hint="Partidas anteriores" />
        <Tile to="/estadisticas" icon={<BarChart3 className="size-5" />} label="Estadísticas" hint="Uso por categoría" />
        <Tile to="/importar" icon={<Globe className="size-5" />} label="Importar de la web" hint="Scraping + IA" accent="text-cyan-400" />
        <Tile to="/sincronizar" icon={<RefreshCw className="size-5" />} label="Sincronizar" hint="Datos actualizados" accent="text-cyan-400" />

        <Tile to="/ajustes" icon={<Settings className="size-5" />} label="Configuración" hint="Tiempo, sonido, tema" />
      </div>
    </AppShell>
  );
}

function Tile({
  to,
  icon,
  label,
  hint,
  accent = "text-zinc-300",
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  accent?: string;
}) {
  return (
    <Link
      to={to}
      className="flex aspect-square flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 active:scale-[0.98]"
    >
      <div className={`flex size-10 items-center justify-center rounded-xl bg-zinc-800 ${accent}`}>{icon}</div>
      <div>
        <p className="text-sm font-semibold leading-tight text-zinc-100">{label}</p>
        <p className="mt-1 text-[11px] text-zinc-500">{hint}</p>
      </div>
    </Link>
  );
}
