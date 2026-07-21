import { createServerFn } from "@tanstack/react-start";

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
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
    const sb = await getAdmin();
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
    const sb = await getAdmin();
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
  .inputValidator((i: { partida_id: string; estado?: "finalizada" | "abandonada" }) => i)
  .handler(async ({ data }) => {
    const sb = await getAdmin();
    const { error } = await sb
      .from("partidas")
      .update({ estado: data.estado ?? "finalizada", updated_at: new Date().toISOString() })
      .eq("id", data.partida_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPartidas = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await getAdmin();
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
    const sb = await getAdmin();
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
    const sb = await getAdmin();
    await sb.from("partida_preguntas").delete().eq("partida_id", data.id);
    const { error } = await sb.from("partidas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
