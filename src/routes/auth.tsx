import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { LogIn, UserPlus, Loader2, Mail, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("Te enviamos un correo con el enlace para restablecer tu contraseña.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (!result.redirected) navigate({ to: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error con Google");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Moderador</p>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            TRIVIA MASTER <span className="text-blue-500">MX</span>
          </h1>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          {mode !== "forgot" ? (
            <div className="mb-4 flex rounded-xl bg-zinc-950 p-1">
              <button
                onClick={() => { setMode("signin"); setError(null); setInfo(null); }}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold ${mode === "signin" ? "bg-blue-600 text-white" : "text-zinc-400"}`}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold ${mode === "signup" ? "bg-blue-600 text-white" : "text-zinc-400"}`}
              >
                Crear cuenta
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setMode("signin"); setError(null); setInfo(null); }}
              className="mb-3 flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="size-3" /> Volver
            </button>
          )}

          <form onSubmit={handleEmail} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                placeholder="tu@correo.mx"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  placeholder="mínimo 8 caracteres"
                />
              </div>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
            {info && <p className="text-xs text-emerald-400">{info}</p>}
            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "signin" ? (
                <LogIn className="size-4" />
              ) : mode === "signup" ? (
                <UserPlus className="size-4" />
              ) : (
                <Mail className="size-4" />
              )}
              {mode === "signin" ? "Entrar" : mode === "signup" ? "Registrarme" : "Enviar enlace"}
            </button>
          </form>

          {mode === "signin" && (
            <button
              onClick={() => { setMode("forgot"); setError(null); setInfo(null); }}
              className="mt-3 w-full text-center text-[11px] font-semibold text-blue-400 hover:text-blue-300"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {mode !== "forgot" && (
            <>
              <div className="my-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
                <div className="h-px flex-1 bg-zinc-800" />
                o
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-white py-2.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                <svg className="size-4" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continuar con Google
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-500">
          El primer usuario registrado será administrador.
        </p>
      </div>
    </div>
  );
}
