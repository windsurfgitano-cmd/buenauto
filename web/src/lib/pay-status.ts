export type PayStatus = "success" | "pending" | "error" | null;

export function redirectTypeFromPayParam(raw: string | string[] | undefined): PayStatus {
  const val = Array.isArray(raw) ? raw[0] : raw;
  if (!val) return null;
  if (val === "ok" || val === "approved") return "success";
  if (val === "pending") return "pending";
  if (val === "fail" || val === "error" || val === "rejected") return "error";
  return null;
}
