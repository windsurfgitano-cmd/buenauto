// Configuración de gamificación TURBO. Cliente + servidor.

export const POINTS = {
  view: 2, // ver un auto en el feed
  like: 5, // dar me gusta (favorito)
  share: 15, // compartir
  quote: 100, // cotizar
} as const;

export type PointAction = keyof typeof POINTS | "redeem";

export type Reward = {
  id: string;
  label: string;
  desc: string;
  cost: number;
  rateDelta: number; // ajuste a la tasa mensual (negativo = mejor tasa)
};

export const REWARDS: Reward[] = [
  {
    id: "tasa",
    label: "Tasa preferente",
    desc: "Baja la tasa de tu crédito y tu cuota mensual.",
    cost: 500,
    rateDelta: -0.003,
  },
  {
    id: "prioridad",
    label: "Atención prioritaria",
    desc: "El vendedor te contacta primero, sin fila.",
    cost: 300,
    rateDelta: 0,
  },
];

export function rewardById(id: string | null | undefined): Reward | null {
  if (!id) return null;
  return REWARDS.find((r) => r.id === id) ?? null;
}

export function formatPoints(n: number): string {
  return Math.round(n).toLocaleString("es-CL");
}
