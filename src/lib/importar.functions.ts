import { createServerFn } from "@tanstack/react-start";

const CATEGORIAS_VALIDAS = new Set([
  "cultura_general","historia","historia_mexico","geografia","biologia","quimica","fisica",
  "medicina","matematicas","astronomia","tecnologia","literatura","cine","musica","arte",
  "deportes","mitologia","gastronomia","cultura_mexicana","filosofia",
]);
const NIVELES_VALIDOS = new Set(["muy_facil","facil","media","dificil","experto"]);
const TIPOS_VALIDOS = new Set(["opcion_multiple","verdadero_falso","abierta","completar"]);

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export const importarDesdeURL = createServerFn({ method: "POST" })
  .inputValidator((i: { url: string; categoriaSugerida?: string; nivelSugerido?: string; max?: number }) => i)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Lovable AI no está configurado.");
    let url: URL;
    try { url = new URL(data.url); } catch { throw new Error("URL inválida"); }
    if (!/^https?:$/.test(url.protocol)) throw new Error("Solo http(s)");

    const res = await fetch(url.toString(), {
      headers: {
        "user-agent": "Mozilla/5.0 (TriviaMasterMX) Chrome/125 Safari/537.36",
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "es-MX,es;q=0.9",
      },
    });
    if (!res.ok) throw new Error(`No se pudo descargar (${res.status})`);
    const html = await res.text();
    const text = stripHtml(html).slice(0, 18000);
    if (text.length < 200) throw new Error("La página no tiene contenido legible.");

    const max = Math.min(Math.max(data.max ?? 25, 1), 40);
    const catHint = data.categoriaSugerida && CATEGORIAS_VALIDAS.has(data.categoriaSugerida)
      ? data.categoriaSugerida : "cultura_general";
    const nivHint = data.nivelSugerido && NIVELES_VALIDOS.has(data.nivelSugerido)
      ? data.nivelSugerido : "media";

    const system = `Extraes preguntas de trivia desde texto web en español.
Devuelve SOLO JSON con la forma:
{"preguntas":[{"pregunta":"...","respuesta":"...","explicacion":"","opciones":[],"tipo":"abierta|opcion_multiple|verdadero_falso","categoria":"<una de: ${Array.from(CATEGORIAS_VALIDAS).join(", ")}>","nivel":"<una de: ${Array.from(NIVELES_VALIDOS).join(", ")}>","tags":[]}]}
Reglas:
- Solo pares pregunta+respuesta claros y verificables encontrados en el texto.
- Si es opción múltiple incluye 4 opciones incluida la correcta idéntica a "respuesta".
- Máximo ${max} preguntas.
- Español natural de México, sin markdown, sin texto extra.
- Si no encuentras preguntas devuelve {"preguntas":[]}.
- Si no puedes clasificar categoría o nivel usa "${catHint}" y "${nivHint}".`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `URL: ${url.toString()}\n\nTEXTO:\n${text}` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      if (aiRes.status === 429) throw new Error("Límite de IA alcanzado. Intenta en un momento.");
      if (aiRes.status === 402) throw new Error("Se agotaron los créditos de IA.");
      throw new Error(`Error de IA (${aiRes.status}): ${t.slice(0, 200)}`);
    }
    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { preguntas?: Array<Record<string, unknown>> } = {};
    try { parsed = typeof content === "string" ? JSON.parse(content) : content; } catch {
      throw new Error("La IA devolvió un formato inesperado.");
    }
    const arr = Array.isArray(parsed.preguntas) ? parsed.preguntas : [];
    if (!arr.length) return { generadas: 0, preguntas: [] };

    const rows = arr.map((p) => {
      const categoria = String(p.categoria ?? catHint);
      const nivel = String(p.nivel ?? nivHint);
      const tipo = String(p.tipo ?? "abierta");
      return {
        pregunta: String(p.pregunta ?? "").trim(),
        respuesta: String(p.respuesta ?? "").trim(),
        explicacion: p.explicacion ? String(p.explicacion) : null,
        categoria: CATEGORIAS_VALIDAS.has(categoria) ? categoria : catHint,
        nivel: NIVELES_VALIDOS.has(nivel) ? nivel : nivHint,
        tipo: TIPOS_VALIDOS.has(tipo) ? tipo : "abierta",
        opciones: Array.isArray(p.opciones) ? p.opciones : [],
        fuente: url.hostname,
        tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
        origen: "importado",
        nivel_confianza: 70,
      };
    }).filter((r) => r.pregunta.length > 4 && r.respuesta.length > 0);

    if (!rows.length) return { generadas: 0, preguntas: [] };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Dedup contra existentes por texto
    const { data: existentes } = await supabaseAdmin.from("preguntas").select("pregunta").limit(2000);
    const set = new Set((existentes ?? []).map((r) => r.pregunta.toLowerCase().trim()));
    const nuevos = rows.filter((r) => !set.has(r.pregunta.toLowerCase().trim()));
    if (!nuevos.length) return { generadas: 0, preguntas: [], nota: "Todas ya existían en el banco." };

    const { data: inserted, error } = await supabaseAdmin.from("preguntas").insert(nuevos).select();
    if (error) throw new Error(error.message);
    return { generadas: inserted?.length ?? 0, preguntas: inserted };
  });
