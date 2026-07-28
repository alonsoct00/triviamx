// Protección SSRF: rechaza destinos internos/privados antes de que el servidor haga fetch.

const HOSTS_BLOQUEADOS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata",
  "metadata.google.internal",
  "instance-data",
]);

const PUERTOS_PERMITIDOS = new Set(["", "80", "443", "8080"]);

function esIPv4Privada(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if ([a, Number(m[2]), Number(m[3]), Number(m[4])].some((n) => n > 255)) return true;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local / metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reservado
  return false;
}

function esIPv6Privada(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (!h.includes(":")) return false;
  if (h === "::1" || h === "::") return true;
  if (/^f[cd]/.test(h)) return true; // unique local
  if (h.startsWith("fe80")) return true; // link-local
  if (h.startsWith("::ffff:")) return esIPv4Privada(h.slice(7));
  return false;
}

/** Lanza si la URL apunta a una dirección interna, loopback, link-local o puerto no web. */
export function assertHostPublico(url: URL): void {
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) throw new Error("URL inválida");
  if (HOSTS_BLOQUEADOS.has(host)) throw new Error("Destino no permitido.");
  if (host.endsWith(".local") || host.endsWith(".internal") || !host.includes("."))
    throw new Error("Destino no permitido.");
  if (esIPv4Privada(host) || esIPv6Privada(host)) throw new Error("Destino no permitido.");
  if (!PUERTOS_PERMITIDOS.has(url.port)) throw new Error("Puerto no permitido.");
}

/** fetch con redirecciones manuales; cada salto se valida contra assertHostPublico. */
export async function fetchSeguro(url: URL, init: RequestInit, maxSaltos = 3): Promise<Response> {
  let actual = url;
  for (let i = 0; i <= maxSaltos; i++) {
    assertHostPublico(actual);
    const res = await fetch(actual.toString(), { ...init, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return res;
      const siguiente = new URL(loc, actual);
      if (!/^https?:$/.test(siguiente.protocol)) throw new Error("Redirección no permitida.");
      actual = siguiente;
      continue;
    }
    return res;
  }
  throw new Error("Demasiadas redirecciones.");
}
