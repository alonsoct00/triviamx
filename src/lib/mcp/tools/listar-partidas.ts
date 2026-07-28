import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { noAuth, supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_partidas",
  title: "Listar partidas",
  description: "Lista el historial de partidas del moderador conectado, con aciertos, errores y tiempo.",
  inputSchema: {
    limite: z.number().int().optional().describe("Máximo de partidas a devolver (por defecto 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limite }, ctx) => {
    if (!ctx.isAuthenticated()) return noAuth();
    const limit = Math.min(Math.max(limite ?? 20, 1), 100);
    const { data, error } = await supabaseForUser(ctx)
      .from("partidas")
      .select("id,nombre,categoria,nivel,cantidad,correctas,incorrectas,tiempo_segundos,estado,created_at")
      .eq("user_id", ctx.getUserId()!)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { total: data?.length ?? 0, partidas: data ?? [] },
    };
  },
});
