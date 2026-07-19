export type CategoriaId =
  | "cultura_general"
  | "historia"
  | "historia_mexico"
  | "geografia"
  | "biologia"
  | "quimica"
  | "fisica"
  | "medicina"
  | "matematicas"
  | "astronomia"
  | "tecnologia"
  | "literatura"
  | "cine"
  | "musica"
  | "arte"
  | "deportes"
  | "mitologia"
  | "gastronomia"
  | "cultura_mexicana"
  | "filosofia";

export interface CategoriaDef {
  id: CategoriaId;
  nombre: string;
  color: string; // hex
  colorVar: string; // css var
  emoji: string;
}

export const CATEGORIAS: CategoriaDef[] = [
  { id: "cultura_general", nombre: "Cultura General", color: "#fbbf24", colorVar: "var(--color-cat-general)", emoji: "🌎" },
  { id: "historia", nombre: "Historia Universal", color: "#a855f7", colorVar: "var(--color-cat-historia)", emoji: "🏛" },
  { id: "historia_mexico", nombre: "Historia de México", color: "#dc2626", colorVar: "var(--color-cat-mexico)", emoji: "🇲🇽" },
  { id: "geografia", nombre: "Geografía", color: "#3b82f6", colorVar: "var(--color-cat-geografia)", emoji: "🗺" },
  { id: "biologia", nombre: "Biología", color: "#22c55e", colorVar: "var(--color-cat-biologia)", emoji: "🧬" },
  { id: "quimica", nombre: "Química", color: "#f97316", colorVar: "var(--color-cat-quimica)", emoji: "⚗️" },
  { id: "fisica", nombre: "Física", color: "#ef4444", colorVar: "var(--color-cat-fisica)", emoji: "⚛️" },
  { id: "medicina", nombre: "Medicina", color: "#16a34a", colorVar: "var(--color-cat-medicina)", emoji: "🩺" },
  { id: "matematicas", nombre: "Matemáticas", color: "#94a3b8", colorVar: "var(--color-cat-mates)", emoji: "➗" },
  { id: "astronomia", nombre: "Astronomía", color: "#06b6d4", colorVar: "var(--color-cat-astronomia)", emoji: "🪐" },
  { id: "tecnologia", nombre: "Tecnología", color: "#2563eb", colorVar: "var(--color-cat-tecnologia)", emoji: "💻" },
  { id: "literatura", nombre: "Literatura", color: "#d97706", colorVar: "var(--color-cat-literatura)", emoji: "📚" },
  { id: "cine", nombre: "Cine", color: "#f43f5e", colorVar: "var(--color-cat-cine)", emoji: "🎬" },
  { id: "musica", nombre: "Música", color: "#8b5cf6", colorVar: "var(--color-cat-musica)", emoji: "🎵" },
  { id: "arte", nombre: "Arte", color: "#ec4899", colorVar: "var(--color-cat-arte)", emoji: "🎨" },
  { id: "deportes", nombre: "Deportes", color: "#84cc16", colorVar: "var(--color-cat-deportes)", emoji: "🏆" },
  { id: "mitologia", nombre: "Mitología", color: "#b45309", colorVar: "var(--color-cat-mitologia)", emoji: "🐉" },
  { id: "gastronomia", nombre: "Gastronomía", color: "#eab308", colorVar: "var(--color-cat-gastronomia)", emoji: "🌮" },
  { id: "cultura_mexicana", nombre: "Cultura Mexicana", color: "#dc2626", colorVar: "var(--color-cat-mexico)", emoji: "💀" },
  { id: "filosofia", nombre: "Filosofía", color: "#64748b", colorVar: "var(--color-cat-filosofia)", emoji: "🧠" },
];

export const CATEGORIAS_MAP: Record<string, CategoriaDef> = Object.fromEntries(
  CATEGORIAS.map((c) => [c.id, c]),
);

export function getCategoria(id: string | null | undefined): CategoriaDef {
  if (id && CATEGORIAS_MAP[id]) return CATEGORIAS_MAP[id];
  return {
    id: "cultura_general",
    nombre: id ?? "Otras",
    color: "#71717a",
    colorVar: "var(--color-cat-default)",
    emoji: "❓",
  };
}

export const NIVELES = [
  { id: "muy_facil", nombre: "Muy fácil" },
  { id: "facil", nombre: "Fácil" },
  { id: "media", nombre: "Media" },
  { id: "dificil", nombre: "Difícil" },
  { id: "experto", nombre: "Experto" },
] as const;

export type NivelId = (typeof NIVELES)[number]["id"];

export const TIEMPOS = [5, 10, 15, 20, 30] as const;
