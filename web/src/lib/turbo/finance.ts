// Simulador de financiamiento (amortización francesa). Cliente + servidor.
// Tasa mensual estimada ~1,4% (CAE anual ~18%), típica de crédito automotriz en Chile.

export const RATE_MONTHLY = 0.014;
export const TERMS = [12, 24, 36, 48, 60] as const;
export const MIN_DOWN_RATE = 0.1; // pie mínimo 10%

export function clampDown(price: number, down: number): number {
  const min = Math.round(price * MIN_DOWN_RATE);
  return Math.min(Math.max(down, min), price);
}

export function computeMonthly(
  price: number,
  down: number,
  months: number,
  rate: number = RATE_MONTHLY,
): number {
  const principal = Math.max(price - down, 0);
  if (principal <= 0) return 0;
  if (rate <= 0) return Math.round(principal / months);
  const m = (principal * rate) / (1 - Math.pow(1 + rate, -months));
  return Math.round(m);
}

export function totalCost(monthly: number, months: number, down: number): number {
  return monthly * months + down;
}
