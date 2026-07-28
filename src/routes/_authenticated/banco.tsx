import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Pencil, Search, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryBadge } from "@/components/CategoryBadge";
import { CATEGORIAS, NIVELES } from "@/lib/categorias";
import { eliminarPregunta, guardarPregunta, listPreguntas } from "@/lib/preguntas.functions";

export const Route = createFileRoute("/_authenticated/banco")({
  component: Banco,
});

type PreguntaLite = {
  id: string;
  pregunta: string;
  respuesta: string;
  explicacion: string | null;
  categoria: string;
  nivel: string;
  tipo: string;
  opciones: unknown;
  fuente: string | null;
  origen: string;
  fecha_actualizacion: string;
};

function Banco() {
  const qc = useQueryClient();
  const [categoria, setCategoria] = useState<string>("");
  const [nivel, setNivel] = useState<string>("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<PreguntaLite | "new" | null>(null);

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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Banco de preguntas</h2>
        <button
          onClick={() => setEditing("new")}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
        >
          + Nueva
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
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

      {isLoading && <p className="text-center text-zinc-400">Cargando…</p>}
      <ul className="space-y-3">
        {(data ?? []).map((p) => (
          <li key={p.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center justify-between">
              <CategoryBadge id={p.categoria} />
              <span className="text-[10px] uppercase text-zinc-400">{p.nivel.replace("_", " ")}</span>
            </div>
            <p className="text-sm font-medium leading-snug text-zinc-100">{p.pregunta}</p>
            <p className="mt-2 text-xs text-zinc-400">
              <span className="font-bold text-zinc-300">R:</span> {p.respuesta}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                {p.origen === "ia" ? "IA" : p.origen === "manual" ? "Manual" : "Semilla"} · {p.fecha_actualizacion}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(p as PreguntaLite)}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-2 py-1 text-[10px] text-blue-400 hover:bg-blue-950/30"
                >
                  <Pencil className="size-3" /> Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar esta pregunta?")) del.mutate(p.id);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-2 py-1 text-[10px] text-red-400 hover:bg-red-950/30"
                >
                  <Trash2 className="size-3" /> Eliminar
                </button>
              </div>
            </div>
          </li>
        ))}
        {data && data.length === 0 && (
          <li className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-400">
            No hay preguntas con estos filtros.
          </li>
        )}
      </ul>

      {editing && (
        <EditorModal
          pregunta={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["preguntas"] });
            qc.invalidateQueries({ queryKey: ["contar"] });
          }}
        />
      )}
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

function EditorModal({
  pregunta,
  onClose,
  onSaved,
}: {
  pregunta: PreguntaLite | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const opcionesIniciales = Array.isArray(pregunta?.opciones) ? (pregunta!.opciones as string[]) : [];
  const [texto, setTexto] = useState(pregunta?.pregunta ?? "");
  const [respuesta, setRespuesta] = useState(pregunta?.respuesta ?? "");
  const [explicacion, setExplicacion] = useState(pregunta?.explicacion ?? "");
  const [categoria, setCategoria] = useState(pregunta?.categoria ?? "cultura_general");
  const [nivel, setNivel] = useState(pregunta?.nivel ?? "media");
  const [tipo, setTipo] = useState(pregunta?.tipo ?? "abierta");
  const [opciones, setOpciones] = useState<string>(opcionesIniciales.join("\n"));
  const [fuente, setFuente] = useState(pregunta?.fuente ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    if (!texto.trim() || !respuesta.trim()) {
      setError("Pregunta y respuesta son requeridas");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await guardarPregunta({
        data: {
          id: pregunta?.id,
          pregunta: texto.trim(),
          respuesta: respuesta.trim(),
          explicacion: explicacion.trim() || undefined,
          categoria,
          nivel,
          tipo,
          opciones: tipo === "opcion_multiple"
            ? opciones.split("\n").map((s) => s.trim()).filter(Boolean)
            : [],
          fuente: fuente.trim() || undefined,
        },
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border border-zinc-800 bg-zinc-950 p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{pregunta ? "Editar pregunta" : "Nueva pregunta"}</h3>
          <button onClick={onClose} className="text-zinc-400"><X className="size-5" /></button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <Field label="Pregunta">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm outline-none focus:border-blue-500"
            />
          </Field>
          <Field label="Respuesta">
            <input
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm outline-none focus:border-blue-500"
            />
          </Field>
          <Field label="Explicación (opcional)">
            <textarea
              value={explicacion}
              onChange={(e) => setExplicacion(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm outline-none focus:border-blue-500"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoría">
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Nivel">
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm"
              >
                {NIVELES.map((n) => (
                  <option key={n.id} value={n.id}>{n.nombre}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Tipo">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm"
            >
              <option value="abierta">Abierta</option>
              <option value="opcion_multiple">Opción múltiple</option>
              <option value="verdadero_falso">Verdadero / Falso</option>
            </select>
          </Field>
          {tipo === "opcion_multiple" && (
            <Field label="Opciones (una por línea)">
              <textarea
                value={opciones}
                onChange={(e) => setOpciones(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm"
              />
            </Field>
          )}
          <Field label="Fuente (opcional)">
            <input
              value={fuente}
              onChange={(e) => setFuente(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm"
            />
          </Field>
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-zinc-800 py-3 text-sm">Cancelar</button>
          <button
            onClick={guardar}
            disabled={saving}
            className="flex-1 rounded-xl bg-white py-3 text-sm font-bold uppercase tracking-widest text-black disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
      {children}
    </label>
  );
}
