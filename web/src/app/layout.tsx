import type { Metadata } from "next";
import { Bodoni_Moda, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bodoni = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

function resolveSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw) {
    try {
      return new URL(raw);
    } catch {
      return new URL("http://localhost:3001");
    }
  }
  return new URL("http://localhost:3001");
}

export const metadata: Metadata = {
  title: "BuenAuto",
  description: "Marketplace simple para comprar y vender autos en Chile.",
  metadataBase: resolveSiteUrl(),
  openGraph: {
    title: "BuenAuto",
    description: "Marketplace simple para comprar y vender autos en Chile.",
    type: "website",
    locale: "es_CL",
    siteName: "BuenAuto",
    images: ["/car-placeholder.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuenAuto",
    description: "Marketplace simple para comprar y vender autos en Chile.",
    images: ["/car-placeholder.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bodoni.variable} min-h-screen antialiased`}
      >
        <div className="min-h-screen">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
