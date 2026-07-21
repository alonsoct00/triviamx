import { createServerFn } from "@tanstack/react-start";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["preguntas"]["Row"];

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const listPreguntas = createServerFn({ method: "GET" })
  .inputValidator(
    (i: { categoria?: string; nivel?: string; tipo?: string; q?: string; limit?: number } | undefined) => i ?? {},
  )
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    let q = sb.from("preguntas").select("*").order("created_at", { ascending: false });
    if (data.categoria) q = q.eq("categoria", data.categoria);
    if (data.nivel) q = q.eq("nivel", data.nivel);
    if (data.tipo) q = q.eq("tipo", data.tipo);
    if (data.q && data.q.trim()) q = q.ilike("pregunta", `%${data.q.trim()}%`);
    const { data: rows, error } = await q.limit(data.limit ?? 200);
    if (error) throw new Error(error.message);
    return rows as Row[];
  });

export const getRandomPreguntas = createServerFn({ method: "POST" })
  .inputValidator(
    (i: { categoria?: string; nivel?: string; cantidad?: number; excluir?: string[] }) => i,
  )
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    let q = sb.from("preguntas").select("*");
    if (data.categoria) q = q.eq("categoria", data.categoria);
    if (data.nivel) q = q.eq("nivel", data.nivel);
    const { data: rows, error } = await q.limit(500);
    if (error) throw new Error(error.message);
    const excl = new Set(data.excluir ?? []);
    const pool = (rows ?? []).filter((r) => !excl.has(r.id));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, data.cantidad ?? 10) as Row[];
  });

export const contarPreguntas = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await getAdmin();
  const { count, error } = await sb.from("preguntas").select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  const { data: porCat } = await sb.from("preguntas").select("categoria");
  const map: Record<string, number> = {};
  (porCat ?? []).forEach((r) => {
    map[r.categoria] = (map[r.categoria] ?? 0) + 1;
  });
  return { total: count ?? 0, porCategoria: map };
});

export const eliminarPregunta = createServerFn({ method: "POST" })
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { error } = await sb.from("preguntas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const guardarPregunta = createServerFn({ method: "POST" })
  .inputValidator(
    (i: {
      id?: string;
      pregunta: string;
      respuesta: string;
      explicacion?: string;
      categoria: string;
      nivel: string;
      tipo: string;
      opciones?: string[];
      fuente?: string;
      tags?: string[];
    }) => i,
  )
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const payload = {
      pregunta: data.pregunta,
      respuesta: data.respuesta,
      explicacion: data.explicacion ?? null,
      categoria: data.categoria,
      nivel: data.nivel,
      tipo: data.tipo,
      opciones: data.opciones ?? [],
      fuente: data.fuente ?? null,
      tags: data.tags ?? [],
      origen: "manual" as const,
    };
    if (data.id) {
      const { data: row, error } = await sb.from("preguntas").update(payload).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await sb.from("preguntas").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });
