import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { noAuth, supabaseForUser } from "../supabase";

export default defineTool({
  name: "crear_pregunta",
  title: "Crear pregunta",
  description: "Agrega una pregunta al banco de trivia. Requiere que el usuario conectado sea administrador.",
  inputSchema: {
    pregunta: z.string().describe("Texto de la pregunta."),
    respuesta: z.string().describe("Respuesta correcta."),
    categoria: z.string().describe("ID de categoría, p. ej. historia_mexico o cine."),
    nivel: z.string().describe("Nivel: facil, medio o dificil."),
    tipo: z.string().optional().describe("abierta (por defecto), opcion_multiple o verdadero_falso."),
    opciones: z.array(z.string()).optional().describe("Opciones para preguntas de opción múltiple."),
    explicacion: z.string().optional().describe("Explicación breve de la respuesta."),
    fuente: z.string().optional().describe("Fuente o referencia."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return noAuth();
    const { data, error } = await supabaseForUser(ctx)
      .from("preguntas")
      .insert({
        pregunta: input.pregunta,
        respuesta: input.respuesta,
        categoria: input.categoria,
        nivel: input.nivel,
        tipo: input.tipo ?? "abierta",
        opciones: input.opciones ?? [],
        explicacion: input.explicacion ?? null,
        fuente: input.fuente ?? "MCP",
        origen: "manual",
      })
      .select("id,pregunta,categoria,nivel,tipo")
      .single();
    if (error)
      return {
        content: [
          {
            type: "text",
            text: `No se pudo crear la pregunta (¿tu cuenta es administrador?): ${error.message}`,
          },
        ],
        isError: true,
      };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { pregunta: data } };
  },
});
