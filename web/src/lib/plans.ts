// Plan definitions for BuenAuto monetization

export type PlanId = "free" | "pro" | "dealer";

export type Plan = {
  id: PlanId;
  name: string;
  price: number; // CLP per month, 0 for free
  maxListings: number;
  maxImagesPerListing: number;
  features: string[];
  badge?: string;
  highlighted?: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Gratis",
    price: 0,
    maxListings: 1,
    maxImagesPerListing: 3,
    features: [
      "1 aviso activo",
      "Hasta 3 fotos por aviso",
      "Duración 30 días",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 4990,
    maxListings: 5,
    maxImagesPerListing: 10,
    features: [
      "Hasta 5 avisos activos",
      "Hasta 10 fotos por aviso",
      "Badge Pro visible",
      "Estadísticas de visitas",
      "Soporte prioritario",
    ],
    badge: "Pro",
    highlighted: true,
  },
  dealer: {
    id: "dealer",
    name: "Dealer",
    price: 19990,
    maxListings: 999,
    maxImagesPerListing: 20,
    features: [
      "Avisos ilimitados",
      "Hasta 20 fotos por aviso",
      "Badge Dealer verificado",
      "Perfil de negocio",
      "Prioridad en búsquedas",
      "Estadísticas avanzadas",
      "Soporte dedicado",
    ],
    badge: "Dealer",
  },
};

export type BoostType = "7days" | "30days";

export type Boost = {
  id: BoostType;
  name: string;
  price: number;
  durationDays: number;
  description: string;
};

export const BOOSTS: Record<BoostType, Boost> = {
  "7days": {
    id: "7days",
    name: "Destacado 7 días",
    price: 2990,
    durationDays: 7,
    description: "Tu aviso aparece primero en los resultados de búsqueda",
  },
  "30days": {
    id: "30days",
    name: "Destacado 30 días",
    price: 7990,
    durationDays: 30,
    description: "Máxima visibilidad con badge dorado durante un mes",
  },
};

export type PackId = "pack3" | "pack10";

export type Pack = {
  id: PackId;
  name: string;
  price: number;
  boostCredits: number;
  savings: string;
};

export const PACKS: Record<PackId, Pack> = {
  pack3: {
    id: "pack3",
    name: "Pack 3 Destacados",
    price: 6990,
    boostCredits: 3,
    savings: "Ahorra 20%",
  },
  pack10: {
    id: "pack10",
    name: "Pack 10 Destacados",
    price: 19990,
    boostCredits: 10,
    savings: "Ahorra 35%",
  },
};

export function getPlan(planId: PlanId): Plan {
  return PLANS[planId] ?? PLANS.free;
}

export function formatPlanPrice(price: number): string {
  if (price === 0) return "Gratis";
  return `$${price.toLocaleString("es-CL")}/mes`;
}
