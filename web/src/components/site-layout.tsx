import Link from "next/link";

import { MobileMenu } from "@/components/mobile-menu";

interface HeaderProps {
  user?: { id: string; email: string; name?: string } | null;
}

export function SiteHeader({ user }: HeaderProps) {
  return (
    <header className="bg-[#0f172a] text-white sticky top-0 z-50 shadow-lg backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/inicio" className="flex items-center">
            <span className="text-2xl font-bold tracking-wider text-[#c9a962] hover:text-[#d4af37] transition">
              BUENAUTO
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-bold text-[#ff2a1f] hover:text-[#e10600] transition rounded-lg hover:bg-[#e10600]/10"
            >
              🔥 Descubre
            </Link>
            <Link
              href="/autos"
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-[#c9a962] transition rounded-lg hover:bg-white/5"
            >
              Buscar Autos
            </Link>
            <Link 
              href="/publicar" 
              className="px-4 py-2 text-sm font-medium text-[#c9a962] hover:text-[#d4af37] transition rounded-lg hover:bg-[#c9a962]/10"
            >
              Publicar
            </Link>
            
            {user ? (
              <>
                <Link 
                  href="/mis-avisos" 
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-[#c9a962] transition rounded-lg hover:bg-white/5"
                >
                  Mis Avisos
                </Link>
                <Link 
                  href="/cuenta" 
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-[#c9a962] transition rounded-lg hover:bg-white/5"
                >
                  Cuenta
                </Link>
              </>
            ) : (
              <Link 
                href="/ingresar" 
                className="ml-4 px-5 py-2 bg-[#c9a962] text-[#0f172a] font-semibold rounded-lg hover:bg-[#d4af37] transition shadow-lg"
              >
                Ingresar
              </Link>
            )}
          </nav>

          <MobileMenu user={user} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#0a0f1a] text-white border-t border-[#1e3a5f]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-bold text-[#c9a962] mb-4">BUENAUTO</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              El marketplace de autos más confiable de Chile. Compra y vende vehículos de forma segura y rápida.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Navegar</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/autos" className="text-gray-400 hover:text-[#c9a962] transition inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-px bg-[#c9a962] mr-0 group-hover:mr-2 transition-all"></span>
                  Buscar Autos
                </Link>
              </li>
              <li>
                <Link href="/publicar" className="text-gray-400 hover:text-[#c9a962] transition inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-px bg-[#c9a962] mr-0 group-hover:mr-2 transition-all"></span>
                  Publicar Aviso
                </Link>
              </li>
              <li>
                <Link href="/planes" className="text-gray-400 hover:text-[#c9a962] transition inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-px bg-[#c9a962] mr-0 group-hover:mr-2 transition-all"></span>
                  Planes y Precios
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Cuenta</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/ingresar" className="text-gray-400 hover:text-[#c9a962] transition inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-px bg-[#c9a962] mr-0 group-hover:mr-2 transition-all"></span>
                  Ingresar
                </Link>
              </li>
              <li>
                <Link href="/registro" className="text-gray-400 hover:text-[#c9a962] transition inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-px bg-[#c9a962] mr-0 group-hover:mr-2 transition-all"></span>
                  Registrarse
                </Link>
              </li>
              <li>
                <Link href="/favoritos" className="text-gray-400 hover:text-[#c9a962] transition inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-px bg-[#c9a962] mr-0 group-hover:mr-2 transition-all"></span>
                  Favoritos
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contacto</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-[#c9a962]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contacto@buenauto.cl
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-[#c9a962]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +56 2 2123 4567
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[#1e3a5f]/30 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} BuenAuto. Todos los derechos reservados.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Link href="/terminos" className="text-gray-500 hover:text-[#c9a962] text-sm transition">
              Términos
            </Link>
            <Link href="/privacidad" className="text-gray-500 hover:text-[#c9a962] text-sm transition">
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
