// Construcción determinista de opciones de respuesta (opción múltiple)

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let s = hash(seed) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function shuffleSeeded<T>(arr: T[], seed: string) {
  const rand = rng(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Devuelve 4 opciones (o menos si no hay suficientes distractores) que siempre
 * incluyen la respuesta correcta, mezcladas de forma estable según `seed`.
 */
export function construirOpciones(
  correcta: string,
  candidatos: string[],
  seed: string,
  total = 4,
): string[] {
  const correctaLimpia = correcta.trim();
  const nCorrecta = norm(correctaLimpia);
  const vistos = new Set<string>([nCorrecta]);
  const largo = correctaLimpia.length;

  const utiles = candidatos
    .map((c) => (c ?? "").trim())
    .filter((c) => {
      const n = norm(c);
      if (!n || vistos.has(n)) return false;
      if (c.length > 90) return false;
      vistos.add(n);
      return true;
    })
    // Distractores plausibles: longitud parecida a la respuesta correcta
    .sort((a, b) => Math.abs(a.length - largo) - Math.abs(b.length - largo));

  const cercanos = shuffleSeeded(utiles.slice(0, Math.max(total * 4, 12)), seed + "d");
  const distractores = cercanos.slice(0, total - 1);
  return shuffleSeeded([correctaLimpia, ...distractores], seed);
}
