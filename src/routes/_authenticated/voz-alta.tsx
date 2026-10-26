import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AudioLines, ChevronRight, Eye, EyeOff, Pause, Play, RotateCcw, Shuffle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { RETOS_ORALES, ejemplosConLetra, siguienteReto } from "@/lib/retos-orales";

export const Route = createFileRoute("/_authenticated/voz-alta")({
  component: VozAlta,
  head: () => ({ meta: [
    { title: "En voz alta — Trivia MX" },
    { name: "description", content: "Retos orales de temas y letras con cronómetro para las rondas del moderador de Trivia MX." },
    { property: "og:title", content: "En voz alta — Trivia MX" },
    { property: "og:description", content: "Bebidas, raperos, animales, marcas y más: dirige una ronda en voz alta." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

function VozAlta() {
  const [reto, setReto] = useState(RETOS_ORALES[0]);
  const [personalizado, setPersonalizado] = useState(false);
  const [tema, setTema] = useState("");
  const [letra, setLetra] = useState("");
  const [duracion, setDuracion] = useState(60);
  const [restante, setRestante] = useState(60);
  const [fin, setFin] = useState<number | null>(null);
  const [ronda, setRonda] = useState(1);
  const [mostrarEjemplos, setMostrarEjemplos] = useState(false);
  const titulo = personalizado ? tema.trim() : reto.tema;
  const ejemplos = personalizado ? [] : ejemplosConLetra(reto, letra);
  const iniciado = fin !== null || restante < duracion;

  useEffect(() => {
    if (fin === null) return;
    const actualizar = () => {
      const segundos = Math.max(0, Math.ceil((fin - Date.now()) / 1000));
      setRestante(segundos);
      if (segundos === 0) setFin(null);
    };
    actualizar();
    const intervalo = window.setInterval(actualizar, 200);
    return () => window.clearInterval(intervalo);
  }, [fin]);

  function reiniciar() {
    setFin(null);
    setRestante(duracion);
    setMostrarEjemplos(false);
  }

  function cambiarReto(id: string) {
    reiniciar();
    setPersonalizado(id === "personalizado");
    const elegido = RETOS_ORALES.find((item) => item.id === id);
    if (elegido) { setReto(elegido); setLetra(elegido.letra ?? ""); }
    else setLetra("");
  }

  function avanzar(azar: boolean) {
    const indice = RETOS_ORALES.findIndex((item) => item.id === reto.id);
    const siguiente = azar ? siguienteReto(reto.id) : RETOS_ORALES[(indice + 1) % RETOS_ORALES.length];
    cambiarReto(siguiente.id);
    setRonda((valor) => valor + 1);
  }

  return (
    <AppShell>
      <div className="oral-game space-y-6 pb-4">
        <header className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><AudioLines className="size-6 text-primary" /> En voz alta</h2>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">Ronda {ronda}</span>
        </header>

        <section className="space-y-4 border-b border-border pb-5" aria-label="Configurar reto">
          <div>
            <label htmlFor="tema-oral" className="mb-2 block text-xs font-semibold text-muted-foreground">Tema</label>
            <select id="tema-oral" value={personalizado ? "personalizado" : reto.id} disabled={fin !== null} onChange={(e) => cambiarReto(e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-3 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-ring">
              {RETOS_ORALES.map((item) => <option key={item.id} value={item.id}>{item.tema}{item.letra ? ` con letra ${item.letra}` : ""}</option>)}
              <option value="personalizado">Tema personalizado</option>
            </select>
          </div>
          {personalizado && <div>
            <label htmlFor="tema-personalizado" className="mb-2 block text-xs font-semibold text-muted-foreground">Tu tema</label>
            <input id="tema-personalizado" value={tema} maxLength={120} disabled={fin !== null} onChange={(e) => { setTema(e.target.value); reiniciar(); }} placeholder="Personajes de caricaturas" className="w-full rounded-md border border-input bg-card px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="letra-oral" className="mb-2 block text-xs font-semibold text-muted-foreground">Letra inicial</label>
              <select id="letra-oral" value={letra} disabled={fin !== null} onChange={(e) => { setLetra(e.target.value); reiniciar(); }} className="w-full rounded-md border border-input bg-card px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                <option value="">Cualquiera</option>
                {Array.from("ABCDEFGHIJKLMNÑOPQRSTUVWXYZ").map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="tiempo-oral" className="mb-2 block text-xs font-semibold text-muted-foreground">Tiempo de ronda</label>
              <select id="tiempo-oral" value={duracion} disabled={fin !== null} onChange={(e) => { const segundos = Number(e.target.value); setDuracion(segundos); setRestante(segundos); setMostrarEjemplos(false); }} className="w-full rounded-md border border-input bg-card px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                {[30, 60, 90, 120].map((s) => <option key={s} value={s}>{s} segundos</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="py-2 text-center" aria-label="Reto de la ronda">
          <p className="text-xs font-bold uppercase text-primary">{restante === 0 ? "¡Tiempo terminado!" : fin !== null ? "¡Dilo en voz alta!" : iniciado ? "En pausa" : "Reto listo"}</p>
          <h3 className="mt-4 break-words font-display text-3xl font-bold leading-tight">{titulo || "Elige tu tema"}</h3>
          {letra && <p className="mt-3 text-lg text-muted-foreground">Con letra <strong className="text-foreground">{letra}</strong></p>}
          <div role="timer" aria-label="Tiempo restante" className={`my-6 font-display text-7xl font-bold tabular-nums ${restante <= 10 ? "text-destructive" : "text-foreground"}`}>{Math.floor(restante / 60)}:{String(restante % 60).padStart(2, "0")}</div>
          <p className="sr-only" role="status">{restante === 0 ? "Tiempo terminado" : ""}</p>
          <div className="flex items-center gap-2">
            <Button size="lg" className="h-12 flex-1" disabled={!titulo || restante === 0} onClick={() => {
              if (fin !== null) { setRestante(Math.max(0, Math.ceil((fin - Date.now()) / 1000))); setFin(null); }
              else { setMostrarEjemplos(false); setFin(Date.now() + restante * 1000); }
            }}>{fin !== null ? <Pause /> : <Play />}{fin !== null ? "Pausar" : iniciado ? "Continuar" : "Iniciar ronda"}</Button>
            <Button variant="outline" className="size-12 shrink-0" size="icon" title="Reiniciar cronómetro" aria-label="Reiniciar cronómetro" onClick={reiniciar}><RotateCcw /></Button>
          </div>
        </section>

        <section className="border-t border-border pt-4">
          <Button variant="ghost" className="w-full justify-between px-0 text-muted-foreground" onClick={() => setMostrarEjemplos((valor) => !valor)} aria-expanded={mostrarEjemplos}>
            <span className="flex items-center gap-2">{mostrarEjemplos ? <EyeOff /> : <Eye />}{mostrarEjemplos ? "Ocultar ejemplos" : "Ejemplos para el moderador"}</span>
          </Button>
          {mostrarEjemplos && <div className="mt-3 border-l-2 border-primary pl-4">
            {ejemplos.length > 0 ? <ul className="space-y-2 text-sm">{ejemplos.map((ejemplo) => <li key={ejemplo}>{ejemplo}</li>)}</ul> : <p className="text-sm text-muted-foreground">Sin ejemplos para este tema y letra.</p>}
          </div>}
        </section>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-11 px-2" onClick={() => avanzar(true)}><Shuffle /> Reto al azar</Button>
          <Button variant="secondary" className="h-11 px-2" onClick={() => avanzar(false)}>Siguiente reto <ChevronRight /></Button>
        </div>
      </div>
    </AppShell>
  );
}