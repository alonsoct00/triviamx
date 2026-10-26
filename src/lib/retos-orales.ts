export type RetoOral = { id: string; tema: string; letra?: string; ejemplos: string[] };

export const RETOS_ORALES: RetoOral[] = [
  { id: "bebidas", tema: "Bebidas alcohólicas", ejemplos: ["Vodka", "Cerveza", "Tequila"] },
  { id: "raperos", tema: "Nombres de raperos", ejemplos: ["Cartel de Santa", "Dr. Dre", "Tupac"] },
  { id: "juegos-b", tema: "Juegos", letra: "B", ejemplos: ["Basta", "Bingo"] },
  { id: "animales-h", tema: "Animales", letra: "H", ejemplos: ["Hiena", "Halcón", "Hormiga"] },
  { id: "terror", tema: "Películas de terror", ejemplos: ["Chucky", "El exorcista", "Scream"] },
  { id: "marcas-t", tema: "Marcas", letra: "T", ejemplos: ["Timberland", "Toyota", "Tommy", "Tonayán"] },
  { id: "frutas-s", tema: "Frutas", letra: "S", ejemplos: ["Sandía"] },
];

export function ejemplosConLetra(reto: RetoOral, letra: string): string[] {
  const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleUpperCase("es-MX").trim();
  const inicial = normalizar(letra);
  return reto.ejemplos.filter((ejemplo) => !inicial || normalizar(ejemplo).startsWith(inicial));
}

export function siguienteReto(actual: string, random = Math.random): RetoOral {
  const disponibles = RETOS_ORALES.filter((reto) => reto.id !== actual);
  return disponibles[Math.min(disponibles.length - 1, Math.max(0, Math.floor(random() * disponibles.length)))];
}