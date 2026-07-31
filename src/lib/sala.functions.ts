import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { construirOpciones } from "./opciones";


const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generarCodigo(len = 6) {
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// ------- Host actions (authenticated) -------

export const crearSala = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: {
      categorias?: string[];
      niveles?: string[];
      cantidad: number;
      tiempo_segundos: number;
    }) => i,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Elegir preguntas con fallback progresivo
    const cats = (data.categorias ?? []).filter(Boolean);
    const nivs = (data.niveles ?? []).filter(Boolean);
    const fetchPool = async (useCats: boolean, useNivs: boolean) => {
      let q = supabaseAdmin.from("preguntas").select("id, categoria, nivel");
      if (useCats && cats.length) q = q.in("categoria", cats);
      if (useNivs && nivs.length) q = q.in("nivel", nivs);
      const { data: rows, error } = await q.limit(2000);
      if (error) throw new Error(error.message);
      return rows ?? [];
    };
    const shuffle = <T,>(arr: T[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const pool: { id: string }[] = [];
    const vistos = new Set<string>();
    const addFrom = async (useCats: boolean, useNivs: boolean) => {
      if (pool.length >= data.cantidad) return;
      const rows = shuffle(await fetchPool(useCats, useNivs));
      for (const r of rows) {
        if (vistos.has(r.id)) continue;
        vistos.add(r.id);
        pool.push(r);
        if (pool.length >= data.cantidad) break;
      }
    };
    await addFrom(true, true);
    if (pool.length < data.cantidad && nivs.length) await addFrom(true, false);
    if (pool.length < data.cantidad) await addFrom(false, false);
    if (!pool.length) throw new Error("No hay preguntas disponibles.");

    const preguntaIds = pool.slice(0, data.cantidad).map((r) => r.id);


    // código único
    let codigo = generarCodigo();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: exists } = await supabaseAdmin.from("salas").select("id").eq("codigo", codigo).maybeSingle();
      if (!exists) break;
      codigo = generarCodigo();
    }

    const { data: sala, error } = await supabaseAdmin
      .from("salas")
      .insert({
        codigo,
        host_id: context.userId,
        estado: "esperando",
        categoria: cats[0] ?? null,
        nivel: nivs[0] ?? null,
        cantidad: preguntaIds.length,
        tiempo_segundos: data.tiempo_segundos,
        pregunta_ids: preguntaIds,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return sala;
  });

async function asertarHost(sb: unknown, codigo: string, userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAdmin = sb as any;
  const { data: sala } = await supabaseAdmin
    .from("salas")
    .select("*")
    .eq("codigo", codigo.toUpperCase())
    .maybeSingle();
  if (!sala) throw new Error("Sala no encontrada.");
  if (sala.host_id !== userId) throw new Error("Solo el anfitrión puede controlar esta sala.");
  return sala;
}

export const iniciarSala = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { codigo: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sala = await asertarHost(supabaseAdmin, data.codigo, context.userId);
    const { error } = await supabaseAdmin
      .from("salas")
      .update({
        estado: "en_juego",
        orden_actual: 0,
        pregunta_started_at: new Date().toISOString(),
      })
      .eq("id", sala.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revelarSala = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { codigo: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sala = await asertarHost(supabaseAdmin, data.codigo, context.userId);
    await supabaseAdmin.from("salas").update({ estado: "revelada" }).eq("id", sala.id);
    return { ok: true };
  });

export const siguienteSala = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { codigo: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sala = await asertarHost(supabaseAdmin, data.codigo, context.userId);
    const siguiente = sala.orden_actual + 1;
    if (siguiente >= sala.pregunta_ids.length) {
      await supabaseAdmin
        .from("salas")
        .update({ estado: "finalizada" })
        .eq("id", sala.id);
      return { ok: true, finalizada: true };
    }
    await supabaseAdmin
      .from("salas")
      .update({
        estado: "en_juego",
        orden_actual: siguiente,
        pregunta_started_at: new Date().toISOString(),
      })
      .eq("id", sala.id);
    return { ok: true, finalizada: false };
  });

export const cerrarSala = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { codigo: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sala = await asertarHost(supabaseAdmin, data.codigo, context.userId);
    await supabaseAdmin.from("salas").update({ estado: "finalizada" }).eq("id", sala.id);
    return { ok: true };
  });

// ------- Public actions (no auth) -------

export const buscarSala = createServerFn({ method: "GET" })
  .inputValidator((i: { codigo: string }) => i)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sala } = await supabaseAdmin
      .from("salas")
      .select("id, codigo, estado, cantidad, tiempo_segundos")
      .eq("codigo", data.codigo.toUpperCase())
      .maybeSingle();
    if (!sala) return null;
    return sala;
  });

export const unirseSala = createServerFn({ method: "POST" })
  .inputValidator((i: { codigo: string; nickname: string }) => i)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nickname = data.nickname.trim().slice(0, 20);
    if (!nickname) throw new Error("Escribe un nombre.");
    const { data: sala } = await supabaseAdmin
      .from("salas")
      .select("id, estado")
      .eq("codigo", data.codigo.toUpperCase())
      .maybeSingle();
    if (!sala) throw new Error("Sala no encontrada.");
    if (sala.estado === "finalizada") throw new Error("Esta sala ya terminó.");
    const { data: jugador, error } = await supabaseAdmin
      .from("sala_jugadores")
      .insert({ sala_id: sala.id, nickname })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { jugador_id: jugador.id, sala_id: sala.id, token: jugador.token as string };
  });

// Estado público — omite la respuesta correcta salvo cuando ya se reveló
export const estadoSala = createServerFn({ method: "GET" })
  .inputValidator((i: { codigo: string; jugador_id?: string }) => i)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sala } = await supabaseAdmin
      .from("salas")
      .select("*")
      .eq("codigo", data.codigo.toUpperCase())
      .maybeSingle();
    if (!sala) return null;

    const { data: jugadores } = await supabaseAdmin
      .from("sala_jugadores")
      .select("id, nickname, puntos, correctas, incorrectas")
      .eq("sala_id", sala.id)
      .order("puntos", { ascending: false });

    let pregunta: {
      id: string;
      pregunta: string;
      tipo: string;
      categoria: string;
      nivel: string;
      opciones: string[];
      respuesta: string | null;
      explicacion: string | null;
    } | null = null;
    let yaRespondio = false;

    if (
      (sala.estado === "en_juego" || sala.estado === "revelada") &&
      sala.orden_actual < sala.pregunta_ids.length
    ) {
      const preguntaId = sala.pregunta_ids[sala.orden_actual];
      const { data: p } = await supabaseAdmin
        .from("preguntas")
        .select("id, pregunta, tipo, categoria, nivel, opciones, respuesta, explicacion")
        .eq("id", preguntaId)
        .maybeSingle();
      if (p) {
        let opciones = Array.isArray(p.opciones) ? (p.opciones as string[]).map(String) : [];
        if (opciones.length < 2) {
          // Toda pregunta se presenta como opción múltiple: se generan distractores
          // tomando respuestas de otras preguntas (misma categoría primero).
          const { data: mismos } = await supabaseAdmin
            .from("preguntas")
            .select("respuesta")
            .eq("categoria", p.categoria)
            .neq("id", p.id)
            .limit(300);
          let candidatos = (mismos ?? []).map((r) => String(r.respuesta));
          if (candidatos.length < 3) {
            const { data: otros } = await supabaseAdmin
              .from("preguntas")
              .select("respuesta")
              .neq("id", p.id)
              .limit(300);
            candidatos = candidatos.concat((otros ?? []).map((r) => String(r.respuesta)));
          }
          opciones = construirOpciones(p.respuesta, candidatos, `${sala.id}:${p.id}`);
        }
        pregunta = {
          id: p.id,
          pregunta: p.pregunta,
          tipo: opciones.length > 1 ? "opcion_multiple" : p.tipo,
          categoria: p.categoria,
          nivel: p.nivel,
          opciones,
          respuesta: sala.estado === "revelada" ? p.respuesta : null,
          explicacion: sala.estado === "revelada" ? p.explicacion : null,
        };
      }

      if (data.jugador_id) {
        const { data: r } = await supabaseAdmin
          .from("sala_respuestas")
          .select("id, correcta, puntos")
          .eq("jugador_id", data.jugador_id)
          .eq("orden", sala.orden_actual)
          .maybeSingle();
        if (r) yaRespondio = true;
      }
    }

    return {
      sala: {
        id: sala.id,
        codigo: sala.codigo,
        estado: sala.estado,
        orden_actual: sala.orden_actual,
        cantidad: sala.cantidad,
        tiempo_segundos: sala.tiempo_segundos,
        pregunta_started_at: sala.pregunta_started_at,
      },
      jugadores: jugadores ?? [],
      pregunta,
      yaRespondio,
    };
  });

export const enviarRespuestaSala = createServerFn({ method: "POST" })
  .inputValidator((i: { codigo: string; jugador_id: string; token: string; respuesta: string }) => i)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sala } = await supabaseAdmin
      .from("salas")
      .select("*")
      .eq("codigo", data.codigo.toUpperCase())
      .maybeSingle();
    if (!sala) throw new Error("Sala no encontrada.");
    if (sala.estado !== "en_juego") throw new Error("La pregunta ya no acepta respuestas.");

    // El jugador debe pertenecer a esta sala y presentar su token privado
    const { data: jugadorAuth } = await supabaseAdmin
      .from("sala_jugadores")
      .select("id, puntos, correctas, incorrectas")
      .eq("id", data.jugador_id)
      .eq("sala_id", sala.id)
      .eq("token", data.token)
      .maybeSingle();
    if (!jugadorAuth) throw new Error("Jugador no válido para esta sala.");
    const preguntaId = sala.pregunta_ids[sala.orden_actual];
    const { data: p } = await supabaseAdmin
      .from("preguntas")
      .select("id, respuesta")
      .eq("id", preguntaId)
      .maybeSingle();
    if (!p) throw new Error("Pregunta no disponible.");

    const startedAt = sala.pregunta_started_at ? new Date(sala.pregunta_started_at).getTime() : Date.now();
    const elapsed = Math.max(0, (Date.now() - startedAt) / 1000);
    const tiempo = sala.tiempo_segundos;
    const timedOut = elapsed > tiempo + 1.5;

    const correcta = !timedOut && normalizar(data.respuesta) === normalizar(p.respuesta);
    const puntos = correcta ? Math.max(100, Math.round(1000 * (1 - 0.5 * Math.min(1, elapsed / tiempo)))) : 0;

    const { error: insErr } = await supabaseAdmin.from("sala_respuestas").insert({
      sala_id: sala.id,
      jugador_id: data.jugador_id,
      orden: sala.orden_actual,
      respuesta: data.respuesta,
      correcta,
      puntos,
      segundos: Number(elapsed.toFixed(2)),
    });
    if (insErr) {
      // duplicado — ya había respondido esta ronda
      if (/duplicate|unique/i.test(insErr.message)) throw new Error("Ya respondiste esta pregunta.");
      throw new Error(insErr.message);
    }

    const jugador = jugadorAuth;
    if (jugador) {
      await supabaseAdmin
        .from("sala_jugadores")
        .update({
          puntos: (jugador.puntos ?? 0) + puntos,
          correctas: (jugador.correctas ?? 0) + (correcta ? 1 : 0),
          incorrectas: (jugador.incorrectas ?? 0) + (!correcta ? 1 : 0),
        })
        .eq("id", data.jugador_id);
    }

    return { correcta, puntos };
  });

export const listSalasHost = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("salas")
      .select("codigo, estado, cantidad, created_at")
      .eq("host_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });
