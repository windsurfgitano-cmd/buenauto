"use client";

import { useEffect } from "react";

import { initAds } from "@/lib/native/ads";

// Punto de montaje de AdMob. Inicializa los anuncios SOLO dentro de la app
// nativa (Capacitor); en el navegador web no hace nada. La lógica vive en
// @/lib/native/ads para poder disparar el intersticial desde el feed.
export function AdMobInit() {
  useEffect(() => {
    void initAds();
  }, []);

  return null;
}
