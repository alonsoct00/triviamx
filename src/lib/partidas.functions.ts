import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const crearPartida = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: {
      nombre?: string;
      categoria?: string;
      nivel?: string;
      cantidad: number;
      tiempo_segundos: number;
    }) => i,
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("partidas")
      .insert({
        nombre: data.nombre ?? null,
        categoria: data.categoria ?? null,
        nivel: data.nivel ?? null,
        cantidad: data.cantidad,
        tiempo_segundos: data.tiempo_segundos,
        estado: "en_curso",
        user_id: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const registrarRespuesta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: {
      partida_id: string;
      pregunta_id: string;
      orden: number;
      resultado: "correcta" | "incorrecta" | "sin_responder";
      segundos_usados?: number;
    }) => i,
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { error } = await sb.from("partida_preguntas").insert({
      partida_id: data.partida_id,
      pregunta_id: data.pregunta_id,
      orden: data.orden,
      resultado: data.resultado,
      segundos_usados: data.segundos_usados ?? null,
    });
    if (error) throw new Error(error.message);
    if (data.resultado === "correcta" || data.resultado === "incorrecta") {
      const { data: current } = await sb
        .from("partidas")
        .select("correctas, incorrectas")
        .eq("id", data.partida_id)
        .single();
      const patch =
        data.resultado === "correcta"
          ? { correctas: (current?.correctas ?? 0) + 1, updated_at: new Date().toISOString() }
          : { incorrectas: (current?.incorrectas ?? 0) + 1, updated_at: new Date().toISOString() };
      await sb.from("partidas").update(patch).eq("id", data.partida_id);
    }
    return { ok: true };
  });

export const finalizarPartida = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { partida_id: string; estado?: "finalizada" | "abandonada" }) => i)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("partidas")
      .update({ estado: data.estado ?? "finalizada", updated_at: new Date().toISOString() })
      .eq("id", data.partida_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPartidas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("partidas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data;
  });

export const getPartida = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
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
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    await sb.from("partida_preguntas").delete().eq("partida_id", data.id);
    const { error } = await sb.from("partidas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
