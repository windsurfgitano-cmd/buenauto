"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type User = {
  id: string;
  email: string;
  name?: string;
};

type Props = {
  user: User;
};

type UpdateResponse =
  | {
      user: {
        id: string;
        email: string;
        name?: string;
      };
    }
  | { error: string };

export function AccountForm({ user }: Props) {
  const router = useRouter();

  const [name, setName] = useState(user.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canSaveName = useMemo(() => {
    return name.trim() !== (user.name ?? "");
  }, [name, user.name]);

  const canSavePassword = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) return false;
    if (newPassword.length < 6) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  }, [currentPassword, newPassword, confirmPassword]);

  async function saveName() {
    if (!canSaveName || savingName) return;

    setSavingName(true);
    setNameMessage(null);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = (await res.json().catch(() => null)) as UpdateResponse | null;

      if (!res.ok) {
        setNameMessage(data && "error" in data ? data.error : "No se pudo guardar");
        return;
      }

      setNameMessage("Guardado");
      router.refresh();
    } catch {
      setNameMessage("No se pudo guardar");
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword() {
    if (!canSavePassword || savingPassword) return;

    setSavingPassword(true);
    setPasswordMessage(null);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = (await res.json().catch(() => null)) as UpdateResponse | null;

      if (!res.ok) {
        setPasswordMessage(
          data && "error" in data ? data.error : "No se pudo cambiar la contraseña",
        );
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Contraseña actualizada");
      router.refresh();
    } catch {
      setPasswordMessage("No se pudo cambiar la contraseña");
    } finally {
      setSavingPassword(false);
    }
  }

  async function onDeleteAccount() {
    if (!deletePassword || deleting) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: deletePassword }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!res.ok) {
        setDeleteError(data?.error ?? "No se pudo eliminar la cuenta");
        return;
      }

      window.location.href = "/";
    } catch {
      setDeleteError("No se pudo eliminar la cuenta");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md focus-within:ring-4 focus-within:ring-zinc-900/10 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:focus-within:ring-white/10 dark:before:via-white/10">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
          Perfil
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              Email
            </span>
            <input
              value={user.email}
              disabled
              className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none disabled:opacity-80 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              Nombre
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Juan"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
            />
          </label>
        </div>

        {nameMessage ? (
          <p
            className={
              nameMessage === "Guardado"
                ? "mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300"
                : "mt-3 text-sm font-medium text-red-600 dark:text-red-400"
            }
          >
            {nameMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={saveName}
          disabled={!canSaveName || savingName}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {savingName ? "Guardando..." : "Guardar perfil"}
        </button>
      </section>

      <section className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md focus-within:ring-4 focus-within:ring-zinc-900/10 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:focus-within:ring-white/10 dark:before:via-white/10">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
          Seguridad
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Cambia tu contraseña cuando lo necesites.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              Contraseña actual
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              Nueva contraseña
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              Confirmar nueva contraseña
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-black dark:text-white"
            />
          </label>
        </div>

        {passwordMessage ? (
          <p
            className={
              passwordMessage === "Contraseña actualizada"
                ? "mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300"
                : "mt-3 text-sm font-medium text-red-600 dark:text-red-400"
            }
          >
            {passwordMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={savePassword}
          disabled={!canSavePassword || savingPassword}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {savingPassword ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </section>

      <section className="relative rounded-2xl border border-red-200/60 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/20">
        <h2 className="text-base font-semibold text-red-900 dark:text-red-200">
          Eliminar cuenta
        </h2>
        <p className="mt-1 text-sm text-red-800/80 dark:text-red-300/80">
          Esto borra tu cuenta y todos tus avisos publicados. No se puede deshacer.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 dark:border-red-800 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-950/40"
          >
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="mt-4 grid gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-red-900 dark:text-red-200">
                Confirma con tu contraseña
              </span>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl border border-red-300 bg-white px-3 text-sm text-zinc-900 outline-none ring-red-900/10 focus:ring-4 dark:border-red-900 dark:bg-black dark:text-white"
              />
            </label>

            {deleteError ? (
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {deleteError}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onDeleteAccount}
                disabled={!deletePassword || deleting}
                className="h-11 w-full rounded-xl bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar definitivamente"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-black dark:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
