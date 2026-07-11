import "server-only";

import { query, toIso } from "@/lib/server/db";

export type NewLead = {
  userId: string | null;
  listingId: string;
  ownerId: string | null;
  downPayment: number;
  termMonths: number;
  monthlyEstimate: number;
  appliedPoints: number;
  benefit: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

export async function createLead(lead: NewLead): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO turbo_leads (
       user_id, listing_id, owner_id, down_payment, term_months, monthly_estimate,
       applied_points, benefit, contact_name, contact_phone, contact_email
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      lead.userId,
      lead.listingId,
      lead.ownerId,
      lead.downPayment,
      lead.termMonths,
      lead.monthlyEstimate,
      lead.appliedPoints,
      lead.benefit,
      lead.contactName,
      lead.contactPhone,
      lead.contactEmail,
    ],
  );
  return Number(rows[0]?.id ?? 0);
}

export type LeadView = {
  id: number;
  listingId: string;
  carLabel: string;
  monthlyEstimate: number;
  downPayment: number;
  termMonths: number;
  benefit: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  status: string;
  createdAt: string;
};

type LeadRow = {
  id: string;
  listing_id: string;
  car_label: string | null;
  monthly_estimate: number;
  down_payment: number;
  term_months: number;
  benefit: string | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  status: string;
  created_at: unknown;
};

function rowToLead(r: LeadRow): LeadView {
  return {
    id: Number(r.id),
    listingId: r.listing_id,
    carLabel: r.car_label ?? "Auto",
    monthlyEstimate: Number(r.monthly_estimate),
    downPayment: Number(r.down_payment),
    termMonths: Number(r.term_months),
    benefit: r.benefit,
    contactName: r.contact_name,
    contactPhone: r.contact_phone,
    contactEmail: r.contact_email,
    status: r.status,
    createdAt: toIso(r.created_at),
  };
}

const LEAD_SELECT = `
  SELECT l.id, l.listing_id, l.monthly_estimate, l.down_payment, l.term_months,
         l.benefit, l.contact_name, l.contact_phone, l.contact_email, l.status, l.created_at,
         (c.brand || ' ' || c.model || ' ' || c.year) AS car_label
  FROM turbo_leads l
  LEFT JOIN listings c ON c.id = l.listing_id
`;

export async function getLeadsForOwner(ownerId: string): Promise<LeadView[]> {
  const rows = await query<LeadRow>(
    `${LEAD_SELECT} WHERE l.owner_id = $1 ORDER BY l.created_at DESC`,
    [ownerId],
  );
  return rows.map(rowToLead);
}

export async function getLeadsForUser(userId: string): Promise<LeadView[]> {
  const rows = await query<LeadRow>(
    `${LEAD_SELECT} WHERE l.user_id = $1 ORDER BY l.created_at DESC`,
    [userId],
  );
  return rows.map(rowToLead);
}
