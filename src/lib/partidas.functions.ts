import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function getServerClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const crearPartida = createServerFn({ method: "POST" })
  .inputValidator(
    (i: {
      nombre?: string;
      categoria?: string;
      nivel?: string;
      cantidad: number;
      tiempo_segundos: number;
    }) => i,
  )
  .handler(async ({ data }) => {
    const sb = getServerClient();
    const { data: row, error } = await sb
      .from("partidas")
      .insert({
        nombre: data.nombre ?? null,
        categoria: data.categoria ?? null,
        nivel: data.nivel ?? null,
        cantidad: data.cantidad,
        tiempo_segundos: data.tiempo_segundos,
        estado: "en_curso",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const registrarRespuesta = createServerFn({ method: "POST" })
  .inputValidator(
    (i: {
      partida_id: string;
      pregunta_id: string;
      orden: number;
      resultado: "correcta" | "incorrecta" | "sin_responder";
      segundos_usados?: number;
    }) => i,
  )
  .handler(async ({ data }) => {
    const sb = getServerClient();
    const { error } = await sb.from("partida_preguntas").insert({
      partida_id: data.partida_id,
      pregunta_id: data.pregunta_id,
      orden: data.orden,
      resultado: data.resultado,
      segundos_usados: data.segundos_usados ?? null,
    });
    if (error) throw new Error(error.message);
    // update counters
    if (data.resultado === "correcta" || data.resultado === "incorrecta") {
      const field = data.resultado === "correcta" ? "correctas" : "incorrectas";
      const { data: current } = await sb.from("partidas").select(field).eq("id", data.partida_id).single();
      const val = ((current as Record<string, number> | null)?.[field] ?? 0) + 1;
      await sb.from("partidas").update({ [field]: val, updated_at: new Date().toISOString() }).eq("id", data.partida_id);
    }
    return { ok: true };
  });

export const finalizarPartida = createServerFn({ method: "POST" })
  .inputValidator((i: { partida_id: string; estado?: "finalizada" | "abandonada" }) => i)
  .handler(async ({ data }) => {
    const sb = getServerClient();
    const { error } = await sb
      .from("partidas")
      .update({ estado: data.estado ?? "finalizada", updated_at: new Date().toISOString() })
      .eq("id", data.partida_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPartidas = createServerFn({ method: "GET" }).handler(async () => {
  const sb = getServerClient();
  const { data, error } = await sb
    .from("partidas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data;
});

export const getPartida = createServerFn({ method: "GET" })
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data }) => {
    const sb = getServerClient();
    const { data: partida, error } = await sb.from("partidas").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!partida) return null;
    const { data: rondas } = await sb
      .from("partida_preguntas")
      .select("*, preguntas(*)")
      .eq("partida_id", data.id)
      .order("orden");
    return { partida, rondas: rondas ?? [] };
  });

export const eliminarPartida = createServerFn({ method: "POST" })
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data }) => {
    const sb = getServerClient();
    await sb.from("partida_preguntas").delete().eq("partida_id", data.id);
    const { error } = await sb.from("partidas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
