// Server-only helper for Lovable AI Gateway (OpenAI-compatible).
export const LOVABLE_AI_BASE = "https://ai.gateway.lovable.dev/v1";

export function getLovableApiKey(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Falta LOVABLE_API_KEY. Activa Lovable AI.");
  return key;
}

export async function lovableChat(body: Record<string, unknown>): Promise<Response> {
  const key = getLovableApiKey();
  return fetch(`${LOVABLE_AI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify(body),
  });
}
