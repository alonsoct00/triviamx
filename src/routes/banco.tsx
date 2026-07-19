import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryBadge } from "@/components/CategoryBadge";
import { CATEGORIAS, NIVELES } from "@/lib/categorias";
import { eliminarPregunta, listPreguntas } from "@/lib/preguntas.functions";

export const Route = createFileRoute("/banco")({
  component: Banco,
});

function Banco() {
  const qc = useQueryClient();
  const [categoria, setCategoria] = useState<string>("");
  const [nivel, setNivel] = useState<string>("");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["preguntas", categoria, nivel, q],
    queryFn: () => listPreguntas({ data: { categoria: categoria || undefined, nivel: nivel || undefined, q: q || undefined } }),
  });

  const del = useMutation({
    mutationFn: (id: string) => eliminarPregunta({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["preguntas"] }),
  });

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400">
        <ArrowLeft className="size-4" /> Regresar
      </Link>
      <h2 className="mb-4 font-display text-2xl font-bold">Banco de preguntas</h2>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar pregunta…"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
        />
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
        <Chip active={categoria === ""} onClick={() => setCategoria("")}>Todas</Chip>
        {CATEGORIAS.map((c) => (
          <Chip key={c.id} active={categoria === c.id} onClick={() => setCategoria(c.id)} color={c.color}>
            {c.emoji} {c.nombre}
          </Chip>
        ))}
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <Chip active={nivel === ""} onClick={() => setNivel("")}>Cualquier nivel</Chip>
        {NIVELES.map((n) => (
          <Chip key={n.id} active={nivel === n.id} onClick={() => setNivel(n.id)}>{n.nombre}</Chip>
        ))}
      </div>

      {isLoading && <p className="text-center text-zinc-500">Cargando…</p>}
      <ul className="space-y-3">
        {(data ?? []).map((p) => (
          <li key={p.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center justify-between">
              <CategoryBadge id={p.categoria} />
              <span className="text-[10px] uppercase text-zinc-500">{p.nivel.replace("_", " ")}</span>
            </div>
            <p className="text-sm font-medium leading-snug text-zinc-100">{p.pregunta}</p>
            <p className="mt-2 text-xs text-zinc-400">
              <span className="font-bold text-zinc-300">R:</span> {p.respuesta}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                {p.origen === "ia" ? "IA" : p.origen === "manual" ? "Manual" : "Semilla"} · {p.fecha_actualizacion}
              </span>
              <button
                onClick={() => del.mutate(p.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-2 py-1 text-[10px] text-red-400 hover:bg-red-950/30"
              >
                <Trash2 className="size-3" /> Eliminar
              </button>
            </div>
          </li>
        ))}
        {data && data.length === 0 && (
          <li className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
            No hay preguntas con estos filtros.
          </li>
        )}
      </ul>
    </AppShell>
  );
}

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
      style={
        active
          ? { borderColor: color ?? "#3b82f6", backgroundColor: `${color ?? "#3b82f6"}20`, color: color ?? "#60a5fa" }
          : { borderColor: "#27272a", backgroundColor: "#18181b", color: "#a1a1aa" }
      }
    >
      {children}
    </button>
  );
}
