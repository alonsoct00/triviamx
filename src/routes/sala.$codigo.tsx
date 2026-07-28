import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buscarSala, unirseSala } from "@/lib/sala.functions";
import { Users } from "lucide-react";

export const Route = createFileRoute("/sala/$codigo")({
  component: JoinSala,
  head: () => ({
    meta: [
      { title: "Unirte a la sala" },
      { name: "description", content: "Únete a una partida de trivia en grupo — sin registro." },
    ],
  }),
});

function JoinSala() {
  const { codigo } = Route.useParams();
  const nav = useNavigate();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existe, setExiste] = useState<boolean | null>(null);

  useEffect(() => {
    buscarSala({ data: { codigo } }).then((s) => setExiste(!!s));
  }, [codigo]);

  async function unirse(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { jugador_id, token } = await unirseSala({ data: { codigo, nickname } });
      sessionStorage.setItem(`sala:${codigo}:jugador`, jugador_id);
      sessionStorage.setItem(`sala:${codigo}:token`, token);
      sessionStorage.setItem(`sala:${codigo}:nick`, nickname);
      nav({ to: "/sala/$codigo/jugar", params: { codigo } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo unir.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10">
        <div className="mb-8 flex size-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
          <Users className="size-8" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sala</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-widest">{codigo.toUpperCase()}</h1>

        {existe === false ? (
          <p className="mt-8 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-center text-sm text-red-300">
            Esta sala no existe o el código está mal escrito.
          </p>
        ) : (
          <form onSubmit={unirse} className="mt-8 w-full">
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Tu nombre
            </label>
            <input
              autoFocus
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ej. Ana"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-lg outline-none focus:border-cyan-500"
            />
            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !nickname.trim() || existe === null}
              className="mt-4 w-full rounded-xl bg-white px-4 py-3 font-display font-bold uppercase text-black disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
            <p className="mt-4 text-center text-[11px] text-zinc-500">
              No necesitas cuenta. El anfitrión ve tu nombre en el marcador.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
