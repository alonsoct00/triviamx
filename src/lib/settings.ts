import { useEffect, useState } from "react";

export interface Settings {
  tiempoDefault: number;
  cantidadDefault: number;
  vibracion: boolean;
  sonido: boolean;
  presentador: boolean; // pantalla grande automática
}

const DEFAULTS: Settings = {
  tiempoDefault: 10,
  cantidadDefault: 10,
  vibracion: true,
  sonido: false,
  presentador: false,
};

const KEY = "tmmx.settings.v1";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [state, setState] = useState<Settings>(DEFAULTS);
  useEffect(() => {
    setState(loadSettings());
  }, []);
  const update = (patch: Partial<Settings>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };
  return [state, update];
}

export function beep(volume = 0.15, freq = 880, ms = 150) {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, ms);
  } catch {
    /* ignore */
  }
}
