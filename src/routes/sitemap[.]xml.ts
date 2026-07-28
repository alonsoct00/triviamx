import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://triviamx.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Rutas públicas e indexables. Se omiten /reset-password (requiere token
        // de un solo uso) y /sala/$codigo (salas efímeras y privadas).
        const paths = [
          "/",
          "/auth",
          "/partida/nueva",
          "/banco",
          "/ia",
          "/importar",
          "/historial",
          "/estadisticas",
          "/ajustes",
          "/sincronizar",
          "/cuenta",
        ];
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...paths.map((p) => `  <url><loc>${BASE_URL}${p}</loc><changefreq>weekly</changefreq></url>`),
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
