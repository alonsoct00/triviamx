import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useIsAdmin } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, KeyRound, Loader2, Shield, LogOut, Trash2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cuenta")({
  component: CuentaPage,
});

function CuentaPage() {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function updateEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(null);
    if (!newEmail || newEmail === user?.email) {
      setEmailMsg({ type: "err", text: "Escribe un correo distinto al actual." });
      return;
    }
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: window.location.origin },
      );
      if (error) throw error;
      setEmailMsg({
        type: "ok",
        text: "Enviamos un correo de confirmación a la nueva dirección. El cambio se aplica cuando lo confirmes.",
      });
      setNewEmail("");
    } catch (err) {
      setEmailMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setEmailLoading(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd.length < 8) return setPwdMsg({ type: "err", text: "Mínimo 8 caracteres." });
    if (newPwd !== confirmPwd) return setPwdMsg({ type: "err", text: "Las contraseñas no coinciden." });
    if (!user?.email) return setPwdMsg({ type: "err", text: "Sin correo asociado." });
    setPwdLoading(true);
    try {
      // Reautenticar con la contraseña actual
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPwd,
      });
      if (signErr) throw new Error("Contraseña actual incorrecta.");
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setPwdMsg({ type: "ok", text: "Contraseña actualizada." });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      setPwdMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setPwdLoading(false);
    }
  }

  async function sendResetEmail() {
    if (!user?.email) return;
    setPwdMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setPwdMsg({ type: "ok", text: "Te enviamos un enlace para restablecer la contraseña." });
    } catch (err) {
      setPwdMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    }
  }

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cuenta</p>
        <h2 className="font-display text-xl font-bold">Administrar cuenta</h2>
      </div>

      {/* Info actual */}
      <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Correo actual</p>
        <p className="mt-1 truncate text-sm text-white">{user?.email ?? "—"}</p>
        {isAdmin && (
          <span className="mt-2 inline-flex items-center gap-1 rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
            <Shield className="size-3" /> ADMIN
          </span>
        )}
      </div>

      {/* Cambiar email */}
      <form onSubmit={updateEmail} className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Mail className="size-4 text-blue-400" />
          <h3 className="text-sm font-bold">Cambiar correo</h3>
        </div>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="nuevo@correo.mx"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        />
        {emailMsg && (
          <p className={`mt-2 text-xs ${emailMsg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
            {emailMsg.text}
          </p>
        )}
        <button
          disabled={emailLoading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {emailLoading && <Loader2 className="size-4 animate-spin" />}
          Actualizar correo
        </button>
      </form>

      {/* Cambiar contraseña */}
      <form onSubmit={updatePassword} className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="size-4 text-blue-400" />
          <h3 className="text-sm font-bold">Cambiar contraseña</h3>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Contraseña actual</label>
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nueva contraseña</label>
            <input
              type="password"
              minLength={8}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Confirmar</label>
            <input
              type="password"
              minLength={8}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>
        {pwdMsg && (
          <p className={`mt-2 text-xs ${pwdMsg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
            {pwdMsg.text}
          </p>
        )}
        <button
          disabled={pwdLoading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pwdLoading && <Loader2 className="size-4 animate-spin" />}
          Actualizar contraseña
        </button>
        <button
          type="button"
          onClick={sendResetEmail}
          className="mt-2 w-full text-center text-[11px] font-semibold text-blue-400 hover:text-blue-300"
        >
          ¿No recuerdas la actual? Enviar enlace por correo
        </button>
      </form>

      {/* Acciones */}
      <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 text-sm font-semibold text-zinc-300 hover:text-red-400 hover:border-red-500/40"
        >
          <LogOut className="size-4" /> Cerrar sesión
        </button>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-amber-400" />
          <div>
            <p className="text-xs font-bold text-amber-400">Eliminar cuenta</p>
            <p className="mt-1 text-[11px] text-zinc-400">
              Para eliminar permanentemente tu cuenta y todo tu historial, contacta al administrador. La eliminación
              autoservicio aún no está disponible.
            </p>
            <button
              disabled
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-400/60"
            >
              <Trash2 className="size-3" /> Solicitar eliminación
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
