import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import type { Database } from "@/integrations/supabase/types";

/** Cliente Supabase que actúa como el usuario autenticado por OAuth (RLS aplica). */
export function supabaseForUser(ctx: ToolContext) {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function noAuth() {
  return {
    content: [{ type: "text" as const, text: "No autenticado. Conecta tu cuenta de Trivia Master MX." }],
    isError: true,
  };
}
