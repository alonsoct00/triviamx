import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { noAuth, supabaseForUser } from "../supabase";

export default defineTool({
  name: "buscar_preguntas",
  title: "Buscar preguntas",
  description: "Busca preguntas del banco de trivia por texto, categoría, nivel o tipo.",
  inputSchema: {
    texto: z.string().optional().describe("Texto a buscar dentro de la pregunta."),
    categoria: z.string().optional().describe("ID de categoría, p. ej. historia_mexico, cine, deportes."),
    nivel: z.string().optional().describe("Nivel de dificultad: facil, medio o dificil."),
    tipo: z.string().optional().describe("Tipo de pregunta: abierta, opcion_multiple, verdadero_falso."),
    limite: z.number().int().optional().describe("Máximo de resultados (por defecto 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ texto, categoria, nivel, tipo, limite }, ctx) => {
    if (!ctx.isAuthenticated()) return noAuth();
    const limit = Math.min(Math.max(limite ?? 20, 1), 100);
    let q = supabaseForUser(ctx)
      .from("preguntas")
      .select("id,pregunta,respuesta,categoria,nivel,tipo,opciones,explicacion,fuente")
      .order("created_at", { ascending: false });
    if (categoria) q = q.eq("categoria", categoria);
    if (nivel) q = q.eq("nivel", nivel);
    if (tipo) q = q.eq("tipo", tipo);
    if (texto?.trim()) q = q.ilike("pregunta", `%${texto.trim()}%`);
    const { data, error } = await q.limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { total: data?.length ?? 0, preguntas: data ?? [] },
    };
  },
});
