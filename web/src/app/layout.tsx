import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { AdMobInit } from "@/components/native/admob-init";
import { getCurrentUser } from "@/lib/server/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  // Sin metadataBase las og:image quedan relativas y WhatsApp/Facebook
  // no muestran la foto al compartir un aviso.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BuenAuto - Compra y vende autos en Chile",
    template: "%s | BuenAuto",
  },
  description:
    "El marketplace de vehículos más confiable de Chile. Encuentra autos nuevos y usados al mejor precio.",
  openGraph: {
    siteName: "BuenAuto",
    locale: "es_CL",
    type: "website",
    images: ["/hero-bg.jpg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  
  return (
    <html lang="es">
      <body className={`${geistSans.variable} min-h-screen antialiased flex flex-col`}>
        <SiteHeader user={user} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {/* Anuncios AdMob: solo activos dentro de la app Android (Capacitor). */}
        <AdMobInit />
      </body>
    </html>
  );
}
