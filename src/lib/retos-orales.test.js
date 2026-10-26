import { describe, expect, test } from "bun:test";
import { RETOS_ORALES, ejemplosConLetra, siguienteReto } from "./retos-orales";

describe("retos orales solicitados", () => {
  const reglas = [
    ["bebidas", undefined, ["Vodka", "Cerveza", "Tequila"]],
    ["raperos", undefined, ["Cartel de Santa", "Dr. Dre", "Tupac"]],
    ["juegos-b", "B", ["Basta", "Bingo"]],
    ["animales-h", "H", ["Hiena", "Halcón", "Hormiga"]],
    ["terror", undefined, ["Chucky"]],
    ["marcas-t", "T", ["Timberland", "Toyota", "Tommy", "Tonayán"]],
    ["frutas-s", "S", ["Sandía"]],
  ];
  for (const [id, letra, ejemplos] of reglas) {
    test(id, () => {
      const reto = RETOS_ORALES.find((item) => item.id === id);
      expect(reto?.letra).toBe(letra);
      expect(reto?.ejemplos).toEqual(expect.arrayContaining([...ejemplos]));
    });
  }
  test("filtra los ejemplos por la letra elegida", () => {
    expect(ejemplosConLetra(RETOS_ORALES[0], "T")).toEqual(["Tequila"]);
  });
  test("el siguiente reto no repite el actual", () => {
    expect(siguienteReto("bebidas", () => 0).id).toBe("raperos");
  });
});