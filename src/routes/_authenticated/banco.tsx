import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Pencil, Search, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryBadge } from "@/components/CategoryBadge";
import { CATEGORIAS, NIVELES } from "@/lib/categorias";
import { contarPreguntas, eliminarPregunta, guardarPregunta, listPreguntas } from "@/lib/preguntas.functions";


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

const POR_PAGINA = 12;

function Banco() {
  const qc = useQueryClient();
  const [categoria, setCategoria] = useState<string>("");
  const [nivel, setNivel] = useState<string>("");
  const [q, setQ] = useState("");
  const [pagina, setPagina] = useState(1);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [editing, setEditing] = useState<PreguntaLite | "new" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["preguntas", categoria, nivel, q],
    queryFn: () =>
      listPreguntas({
        data: { categoria: categoria || undefined, nivel: nivel || undefined, q: q || undefined, limit: 1000 },
      }),
  });

  const { data: conteo } = useQuery({ queryKey: ["contar"], queryFn: () => contarPreguntas() });

  useEffect(() => {
    setPagina(1);
    setAbierta(null);
  }, [categoria, nivel, q]);

  const total = data?.length ?? 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = useMemo(
    () => (data ?? []).slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA),
    [data, paginaActual],
  );

  const del = useMutation({
    mutationFn: (id: string) => eliminarPregunta({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["preguntas"] });
      qc.invalidateQueries({ queryKey: ["contar"] });
    },
  });

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400">
        <ArrowLeft className="size-4" /> Regresar
      </Link>
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="truncate font-display text-2xl font-bold">Banco de preguntas</h2>
        <button
          onClick={() => setEditing("new")}
          className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
        >
          + Nueva
        </button>
      </div>

      <div className="sticky top-0 z-20 -mx-4 bg-zinc-950/95 px-4 pb-2 pt-1 backdrop-blur">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar pregunta…"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          <Chip active={categoria === ""} onClick={() => setCategoria("")}>
            Todas {conteo ? `(${conteo.total})` : ""}
          </Chip>
          {CATEGORIAS.map((c) => {
            const n = conteo?.porCategoria?.[c.id] ?? 0;
            return (
              <Chip key={c.id} active={categoria === c.id} onClick={() => setCategoria(c.id)} color={c.color}>
                {c.emoji} {c.nombre} {conteo ? `(${n})` : ""}
              </Chip>
            );
          })}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Chip active={nivel === ""} onClick={() => setNivel("")}>Cualquier nivel</Chip>
          {NIVELES.map((n) => (
            <Chip key={n.id} active={nivel === n.id} onClick={() => setNivel(n.id)}>{n.nombre}</Chip>
          ))}
        </div>
      </div>

      <p className="mb-3 mt-3 text-[11px] uppercase tracking-widest text-zinc-400">
        {isLoading ? "Cargando…" : `${total} preguntas · página ${paginaActual} de ${paginas}`}
      </p>

      <ul className="space-y-2">
        {visibles.map((p) => {
          const expandida = abierta === p.id;
          return (
            <li key={p.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <button
                onClick={() => setAbierta(expandida ? null : p.id)}
                aria-expanded={expandida}
                className="flex w-full items-start gap-3 p-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <CategoryBadge id={p.categoria} />
                    <span className="text-[10px] uppercase text-zinc-400">{p.nivel.replace("_", " ")}</span>
                  </div>
                  <p className={`text-sm font-medium leading-snug text-zinc-100 ${expandida ? "" : "line-clamp-2"}`}>
                    {p.pregunta}
                  </p>
                </div>
                <ChevronDown
                  className={`mt-1 size-4 shrink-0 text-zinc-400 transition-transform ${expandida ? "rotate-180" : ""}`}
                />
              </button>

              {expandida && (
                <div className="border-t border-zinc-800 p-3">
                  <p className="text-xs text-zinc-300">
                    <span className="font-bold">R:</span> {p.respuesta}
                  </p>
                  {p.explicacion && <p className="mt-1.5 text-xs text-zinc-400">{p.explicacion}</p>}
                  <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <span className="truncate text-[10px] uppercase tracking-wider text-zinc-400">
                      {p.origen === "ia" ? "IA" : p.origen === "manual" ? "Manual" : p.origen === "importado" ? "Importada" : "Semilla"} · {p.fecha_actualizacion}
                    </span>
                    <div className="flex shrink-0 gap-2">
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
                </div>
              )}
            </li>
          );
        })}
        {data && total === 0 && (
          <li className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-400">
            No hay preguntas con estos filtros.
          </li>
        )}
      </ul>

      {paginas > 1 && (
        <nav aria-label="Paginación" className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={() => { setPagina(paginaActual - 1); setAbierta(null); }}
            disabled={paginaActual <= 1}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 disabled:opacity-40"
          >
            <ChevronLeft className="size-4" /> Anterior
          </button>
          <span className="text-xs text-zinc-400">{paginaActual} / {paginas}</span>
          <button
            onClick={() => { setPagina(paginaActual + 1); setAbierta(null); }}
            disabled={paginaActual >= paginas}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 disabled:opacity-40"
          >
            Siguiente <ChevronRight className="size-4" />
          </button>
        </nav>
      )}

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
