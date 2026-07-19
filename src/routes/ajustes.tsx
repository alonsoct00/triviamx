import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/ajustes")({
  component: Ajustes,
});

function Ajustes() {
  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400">
        <ArrowLeft className="size-4" /> Regresar
      </Link>
      <h2 className="mb-4 font-display text-2xl font-bold">Configuración</h2>
      <ul className="space-y-3">
        <Row label="Tema" value="Oscuro (por defecto)" />
        <Row label="Idioma" value="Español (México)" />
        <Row label="Vibración" value="Activada si el dispositivo lo soporta" />
        <Row label="Sonidos" value="Próximamente" />
      </ul>
      <p className="mt-6 text-center text-[10px] uppercase tracking-widest text-zinc-600">
        Trivia Master MX · v0.1
      </p>
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
