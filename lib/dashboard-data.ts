import { DEMO_ORGANIZATION_ID } from "@/lib/demo";
import { ruleFromRow } from "@/lib/loyalty";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  Customer,
  DashboardData,
  DeliveryNote,
  LoyaltyReward,
  LoyaltyRuleType,
  StatusTone,
  Store,
} from "@/lib/types";

type NoteRow = {
  id: string;
  document_date: string | null;
  status: "pending" | "review" | "validated";
  stores: Array<{ name: string }>;
  suppliers: Array<{ name: string }>;
  delivery_note_items: Array<{
    comparison_status: "higher" | "lower" | "same" | "unmatched" | "review";
    quantity: number | string | null;
    raw_description: string;
    tax_rate: number | string | null;
    unit_price: number | string | null;
    previous_unit_price: number | string | null;
  }>;
};

type CustomerRow = {
  id: string;
  birthday: string | null;
  email: string;
  full_name: string;
  customer_consents: Array<{ granted: boolean }>;
  customer_visits: Array<{ occurred_at: string }>;
};

type LoyaltyRuleRow = {
  id: string;
  type: LoyaltyRuleType;
  active: boolean;
  threshold: number | null;
  reward_name: string;
  reward_description: string;
  validity_days: number;
};

type LoyaltyRewardRow = {
  id: string;
  customer_id: string;
  code: string;
  status: "prepared" | "sent" | "redeemed" | "expired";
  expires_at: string;
  created_at: string;
  loyalty_rules: Array<{ reward_name: string; type: LoyaltyRuleType }>;
  customers: Array<{ full_name: string }>;
};

const currencyFormatter = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const shortDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";
  return shortDateFormatter.format(new Date(`${date}T12:00:00Z`)).replace(".", "");
}

function formatBirthday(date: string | null) {
  if (!date) return "Sin fecha";
  const birthday = new Date(`${date}T12:00:00Z`);
  const today = new Date();
  const isToday =
    birthday.getUTCMonth() === today.getUTCMonth() && birthday.getUTCDate() === today.getUTCDate();
  return isToday ? "Hoy" : formatDate(date);
}

function mapNote(row: NoteRow): DeliveryNote {
  const hasPriceIncrease = row.delivery_note_items.some(
    (item) => item.comparison_status === "higher",
  );
  const total = row.delivery_note_items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity ?? 0) *
      Number(item.unit_price ?? 0) *
      (1 + Number(item.tax_rate ?? 0) / 100),
    0,
  );
  const tone: StatusTone = hasPriceIncrease
    ? "warning"
    : row.status === "validated"
      ? "success"
      : "neutral";
  const status = hasPriceIncrease
    ? "Subida detectada"
    : row.status === "validated"
      ? "Validado"
      : "Revisión necesaria";
  const priceIncreases = row.delivery_note_items
    .filter((item) => item.comparison_status === "higher")
    .map((item) => ({
      description: item.raw_description,
      previousUnitPrice: item.previous_unit_price === null ? null : Number(item.previous_unit_price),
      status: item.comparison_status,
      unitPrice: item.unit_price === null ? null : Number(item.unit_price),
    }));

  return {
    id: row.id,
    supplier: row.suppliers[0]?.name ?? "Proveedor sin asignar",
    store: row.stores[0]?.name ?? "Cafetería sin asignar",
    date: formatDate(row.document_date),
    status,
    total: currencyFormatter.format(total),
    tone,
    lines: row.delivery_note_items.length,
    priceIncreases,
  };
}

function mapCustomer(row: CustomerRow): Customer {
  const lastVisit = row.customer_visits.reduce<string | null>(
    (latest, visit) => (!latest || visit.occurred_at > latest ? visit.occurred_at : latest),
    null,
  );
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    birthday: formatBirthday(row.birthday),
    hasEmailConsent: row.customer_consents.some((consent) => consent.granted),
    visits: row.customer_visits.length,
    lastVisit,
  };
}

function mapLoyaltyReward(row: LoyaltyRewardRow): LoyaltyReward {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customers[0]?.full_name ?? "Cliente",
    ruleType: row.loyalty_rules[0]?.type ?? "visit_milestone",
    rewardName: row.loyalty_rules[0]?.reward_name ?? "Recompensa",
    code: row.code,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseAdmin();
  const [storesResult, notesResult, customersResult, rulesResult, rewardsResult] =
    await Promise.all([
      supabase
        .from("stores")
        .select("id, name")
        .eq("organization_id", DEMO_ORGANIZATION_ID)
        .order("name"),
      supabase
        .from("delivery_notes")
        .select(
          "id, document_date, status, stores(name), suppliers(name), delivery_note_items(comparison_status, quantity, raw_description, tax_rate, unit_price, previous_unit_price)",
        )
        .eq("organization_id", DEMO_ORGANIZATION_ID)
        .order("document_date", { ascending: false }),
      supabase
        .from("customers")
        .select(
          "id, birthday, email, full_name, customer_consents(granted), customer_visits(occurred_at)",
        )
        .eq("organization_id", DEMO_ORGANIZATION_ID)
        .order("birthday"),
      supabase
        .from("loyalty_rules")
        .select("id, type, active, threshold, reward_name, reward_description, validity_days")
        .eq("organization_id", DEMO_ORGANIZATION_ID)
        .order("created_at"),
      supabase
        .from("loyalty_rewards")
        .select(
          "id, customer_id, code, status, expires_at, created_at, loyalty_rules(reward_name, type), customers(full_name)",
        )
        .eq("organization_id", DEMO_ORGANIZATION_ID)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  throwIfError(storesResult.error);
  throwIfError(notesResult.error);
  throwIfError(customersResult.error);
  throwIfError(rulesResult.error);
  throwIfError(rewardsResult.error);

  return {
    stores: (storesResult.data ?? []) as Store[],
    notes: ((notesResult.data ?? []) as NoteRow[]).map(mapNote),
    customers: ((customersResult.data ?? []) as CustomerRow[]).map(mapCustomer),
    loyaltyRules: ((rulesResult.data ?? []) as LoyaltyRuleRow[]).map(ruleFromRow),
    loyaltyRewards: ((rewardsResult.data ?? []) as LoyaltyRewardRow[]).map(mapLoyaltyReward),
  };
}

export async function getVisitTerminalData(): Promise<{
  customers: Customer[];
  stores: Store[];
}> {
  const supabase = getSupabaseAdmin();
  const [storesResult, customersResult] = await Promise.all([
    supabase
      .from("stores")
      .select("id, name")
      .eq("organization_id", DEMO_ORGANIZATION_ID)
      .order("name"),
    supabase
      .from("customers")
      .select(
        "id, birthday, email, full_name, customer_consents(granted), customer_visits(occurred_at)",
      )
      .eq("organization_id", DEMO_ORGANIZATION_ID)
      .order("full_name"),
  ]);

  throwIfError(storesResult.error);
  throwIfError(customersResult.error);

  return {
    customers: ((customersResult.data ?? []) as CustomerRow[]).map(mapCustomer),
    stores: (storesResult.data ?? []) as Store[],
  };
}

export async function getDeliveryNoteById(id: string) {
  const { notes } = await getDashboardData();
  const note = notes.find((item) => item.id === id);
  if (!note) throw new Error("Delivery note not found");
  return note;
}

export async function getCustomerById(id: string) {
  const { customers } = await getDashboardData();
  const customer = customers.find((item) => item.id === id);
  if (!customer) throw new Error("Customer not found");
  return customer;
}
