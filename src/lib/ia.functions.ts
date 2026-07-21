import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CATEGORIAS_VALIDAS = [
  "cultura_general","historia","historia_mexico","geografia","biologia","quimica","fisica",
  "medicina","matematicas","astronomia","tecnologia","literatura","cine","musica","arte",
  "deportes","mitologia","gastronomia","cultura_mexicana","filosofia",
];
const NIVELES_VALIDOS = ["muy_facil","facil","media","dificil","experto"];
const TIPOS_VALIDOS = ["opcion_multiple","verdadero_falso","abierta","completar"];

export const generarPreguntasIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: { categoria: string; nivel: string; cantidad: number; tipo?: string; tema?: string }) => i,
  )
  .handler(async ({ data, context }) => {
    // Solo admins pueden generar (insert bloqueado por RLS de todos modos)
    const { data: rol } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!rol) throw new Error("Solo administradores pueden generar preguntas.");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Lovable AI no está configurado.");

    const cantidad = Math.min(Math.max(data.cantidad, 1), 10);
    const tipo = data.tipo && TIPOS_VALIDOS.includes(data.tipo) ? data.tipo : "opcion_multiple";
    const nivel = NIVELES_VALIDOS.includes(data.nivel) ? data.nivel : "media";
    const categoria = CATEGORIAS_VALIDAS.includes(data.categoria) ? data.categoria : "cultura_general";

    const system = `Eres un generador experto de preguntas de trivia en español mexicano natural.
Genera preguntas ORIGINALES, verificables y con una única respuesta correcta.
Reglas:
- Idioma: español de México, redacción clara, sin ambigüedades.
- Explicación breve (1-3 líneas).
- Si el tipo es "opcion_multiple": incluye exactamente 4 opciones, una correcta que coincida EXACTAMENTE con "respuesta".
- Si el tipo es "verdadero_falso": "opciones" = ["Verdadero","Falso"] y "respuesta" es una de las dos.
- Si el tipo es "abierta" o "completar": "opciones" vacío.
- Incluye "fuente" cuando aplique (Wikipedia, INEGI, NASA, etc.).
- Nunca copies literal de una fuente conocida.
Devuelve SOLO JSON válido con la estructura pedida, sin texto extra ni markdown.`;

    const user = `Genera ${cantidad} preguntas de trivia.
Categoría: ${categoria}
Nivel: ${nivel}
Tipo: ${tipo}
${data.tema ? `Tema específico: ${data.tema}` : ""}

Devuelve JSON con esta forma:
{"preguntas":[{"pregunta":"...","respuesta":"...","explicacion":"...","opciones":["..."],"fuente":"...","tags":["..."]}]}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Límite de solicitudes alcanzado. Intenta en un momento.");
      if (res.status === 402) throw new Error("Se agotaron los créditos de IA de este workspace.");
      throw new Error(`Error de IA (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { preguntas?: Array<Record<string, unknown>> } = {};
    try { parsed = typeof content === "string" ? JSON.parse(content) : content; }
    catch { throw new Error("La IA devolvió un formato inesperado. Intenta de nuevo."); }
    const arr = Array.isArray(parsed.preguntas) ? parsed.preguntas : [];
    if (!arr.length) throw new Error("La IA no devolvió preguntas.");

    const rows = arr.map((p) => ({
      pregunta: String(p.pregunta ?? "").trim(),
      respuesta: String(p.respuesta ?? "").trim(),
      explicacion: p.explicacion ? String(p.explicacion) : null,
      categoria, nivel, tipo,
      opciones: Array.isArray(p.opciones) ? p.opciones : [],
      fuente: p.fuente ? String(p.fuente) : null,
      tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      origen: "ia" as const,
      nivel_confianza: 75,
    })).filter((r) => r.pregunta && r.respuesta);

    if (!rows.length) throw new Error("No se pudieron validar las preguntas generadas.");

    const { data: inserted, error } = await context.supabase.from("preguntas").insert(rows).select();
    if (error) throw new Error(error.message);
    return { generadas: inserted?.length ?? 0, preguntas: inserted };
  });
