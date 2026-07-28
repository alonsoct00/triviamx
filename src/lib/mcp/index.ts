import { auth, defineMcp } from "@lovable.dev/mcp-js";
import buscarPreguntas from "./tools/buscar-preguntas";
import crearPregunta from "./tools/crear-pregunta";
import listarPartidas from "./tools/listar-partidas";
import resumenBanco from "./tools/resumen-banco";

// El issuer debe ser el host directo de Supabase (no el proxy .lovable.cloud).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "trivia-master-mx",
  title: "Trivia Master MX",
  version: "0.1.0",
  instructions:
    "Herramientas del banco de trivia de Trivia Master MX (español de México). Usa buscar_preguntas para consultar el banco, resumen_banco para ver la distribución por categoría y nivel, listar_partidas para el historial del moderador conectado y crear_pregunta para agregar preguntas (solo administradores).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [buscarPreguntas, resumenBanco, listarPartidas, crearPregunta],
});
