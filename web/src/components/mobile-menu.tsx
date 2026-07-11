"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  user?: { id: string; email: string; name?: string } | null;
};

export function MobileMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const linkClass =
    "block px-4 py-3 text-sm font-medium text-gray-300 hover:text-[#c9a962] hover:bg-white/5 transition rounded-lg";

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        className="p-2 text-gray-300 hover:text-[#c9a962] transition"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 z-50 border-t border-[#c9a962]/20 bg-[#0f172a] shadow-2xl">
          <nav className="px-4 py-4 space-y-1">
            <Link
              href="/"
              onClick={close}
              className="block px-4 py-3 text-sm font-bold text-[#ff2a1f] hover:bg-[#e10600]/10 transition rounded-lg"
            >
              🔥 Descubre deslizando
            </Link>
            <Link href="/autos" onClick={close} className={linkClass}>
              Buscar Autos
            </Link>
            <Link
              href="/publicar"
              onClick={close}
              className="block px-4 py-3 text-sm font-medium text-[#c9a962] hover:text-[#d4af37] hover:bg-[#c9a962]/10 transition rounded-lg"
            >
              Publicar
            </Link>

            {user ? (
              <>
                <Link href="/mis-avisos" onClick={close} className={linkClass}>
                  Mis Avisos
                </Link>
                <Link href="/favoritos" onClick={close} className={linkClass}>
                  Favoritos
                </Link>
                <Link href="/cuenta" onClick={close} className={linkClass}>
                  Cuenta
                </Link>
              </>
            ) : (
              <Link
                href="/ingresar"
                onClick={close}
                className="block mt-2 px-4 py-3 bg-[#c9a962] text-[#0f172a] text-sm font-semibold text-center rounded-lg hover:bg-[#d4af37] transition"
              >
                Ingresar
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
