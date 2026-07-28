import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { noAuth, supabaseForUser } from "../supabase";
import { CATEGORIAS } from "@/lib/categorias";

export default defineTool({
  name: "resumen_banco",
  title: "Resumen del banco",
  description: "Devuelve el total de preguntas y su distribución por categoría y nivel.",
  inputSchema: {
    categoria: z.string().optional().describe("Filtra el resumen a una sola categoría."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ categoria }, ctx) => {
    if (!ctx.isAuthenticated()) return noAuth();
    let q = supabaseForUser(ctx).from("preguntas").select("categoria,nivel").limit(5000);
    if (categoria) q = q.eq("categoria", categoria);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const nombre = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.nombre]));
    const porCategoria: Record<string, number> = {};
    const porNivel: Record<string, number> = {};
    for (const row of data ?? []) {
      const key = nombre[row.categoria] ?? row.categoria;
      porCategoria[key] = (porCategoria[key] ?? 0) + 1;
      porNivel[row.nivel] = (porNivel[row.nivel] ?? 0) + 1;
    }
    const resumen = { total: data?.length ?? 0, porCategoria, porNivel };
    return { content: [{ type: "text", text: JSON.stringify(resumen) }], structuredContent: resumen };
  },
});
