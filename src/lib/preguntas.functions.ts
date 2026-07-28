import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["preguntas"]["Row"];

export const listPreguntas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: { categoria?: string; nivel?: string; tipo?: string; q?: string; limit?: number } | undefined) => i ?? {},
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("preguntas").select("*").order("created_at", { ascending: false });
    if (data.categoria) q = q.eq("categoria", data.categoria);
    if (data.nivel) q = q.eq("nivel", data.nivel);
    if (data.tipo) q = q.eq("tipo", data.tipo);
    if (data.q && data.q.trim()) q = q.ilike("pregunta", `%${data.q.trim()}%`);
    const { data: rows, error } = await q.limit(data.limit ?? 200);
    if (error) throw new Error(error.message);
    return rows as Row[];
  });

export const getRandomPreguntas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: {
      categoria?: string;
      nivel?: string;
      categorias?: string[];
      niveles?: string[];
      cantidad?: number;
      excluir?: string[];
    }) => i,
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const cats = (data.categorias?.length ? data.categorias : data.categoria ? [data.categoria] : []).filter(Boolean);
    const nivs = (data.niveles?.length ? data.niveles : data.nivel ? [data.nivel] : []).filter(Boolean);

    const fetchPool = async (useCats: boolean, useNivs: boolean) => {
      let q = sb.from("preguntas").select("*");
      if (useCats && cats.length) q = q.in("categoria", cats);
      if (useNivs && nivs.length) q = q.in("nivel", nivs);
      const { data: rows, error } = await q.limit(1000);
      if (error) throw new Error(error.message);
      return rows ?? [];
    };

    const cantidad = data.cantidad ?? 10;
    const excl = new Set(data.excluir ?? []);

    // Se completa el cupo relajando filtros progresivamente (nivel → categoría)
    const seen = new Set<string>(excl);
    const pool: Awaited<ReturnType<typeof fetchPool>> = [];
    const shuffle = <T,>(arr: T[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    const addFrom = async (useCats: boolean, useNivs: boolean) => {
      if (pool.length >= cantidad) return;
      const rows = shuffle(await fetchPool(useCats, useNivs));
      for (const r of rows) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        pool.push(r);
        if (pool.length >= cantidad) break;
      }
    };
    await addFrom(true, true);
    if (pool.length < cantidad && nivs.length) await addFrom(true, false);
    if (pool.length < cantidad) await addFrom(false, false);

    return pool.slice(0, cantidad) as Row[];

  });


export const contarPreguntas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { count, error } = await sb.from("preguntas").select("*", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    const { data: porCat } = await sb.from("preguntas").select("categoria");
    const map: Record<string, number> = {};
    (porCat ?? []).forEach((r) => {
      map[r.categoria] = (map[r.categoria] ?? 0) + 1;
    });
    return { total: count ?? 0, porCategoria: map };
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(sb: any, userId: string) {
  const { data } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Solo administradores pueden modificar el banco de preguntas.");
}

export const eliminarPregunta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("preguntas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const guardarPregunta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase;
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
