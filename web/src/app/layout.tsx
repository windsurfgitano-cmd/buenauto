import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { getCurrentUser } from "@/lib/server/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuenAuto - Compra y vende autos en Chile",
  description: "El marketplace de vehículos más confiable de Chile. Encuentra autos nuevos y usados al mejor precio.",
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
      </body>
    </html>
  );
}
