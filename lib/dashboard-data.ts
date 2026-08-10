import { DEMO_ORGANIZATION_ID } from "@/lib/demo";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Customer, DashboardData, DeliveryNote, StatusTone, Store } from "@/lib/types";

type NoteRow = {
  id: string;
  document_date: string | null;
  status: "pending" | "review" | "validated";
  stores: Array<{ name: string }>;
  suppliers: Array<{ name: string }>;
  delivery_note_items: Array<{
    comparison_status: "higher" | "lower" | "same" | "unmatched" | "review";
    quantity: number | string | null;
    tax_rate: number | string | null;
    unit_price: number | string | null;
  }>;
};

type CustomerRow = {
  id: string;
  birthday: string | null;
  email: string;
  full_name: string;
  customer_promotions: Array<{
    id: string;
    status: "pending" | "prepared" | "sent" | "redeemed";
    promotions: Array<{ name: string }>;
  }>;
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

  return {
    id: row.id,
    supplier: row.suppliers[0]?.name ?? "Proveedor sin asignar",
    store: row.stores[0]?.name ?? "Cafetería sin asignar",
    date: formatDate(row.document_date),
    status,
    total: currencyFormatter.format(total),
    tone,
    lines: row.delivery_note_items.length,
  };
}

function mapCustomer(row: CustomerRow): Customer {
  const promotion = row.customer_promotions[0];
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    birthday: formatBirthday(row.birthday),
    promo: promotion?.promotions[0]?.name ?? "Sin promoción",
    promotionAssignmentId: promotion?.id ?? null,
    status: promotion?.status === "prepared" ? "Preparado" : "Pendiente",
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseAdmin();
  const [storesResult, notesResult, customersResult] = await Promise.all([
    supabase
      .from("stores")
      .select("id, name")
      .eq("organization_id", DEMO_ORGANIZATION_ID)
      .order("name"),
    supabase
      .from("delivery_notes")
      .select(
        "id, document_date, status, stores(name), suppliers(name), delivery_note_items(comparison_status, quantity, tax_rate, unit_price)",
      )
      .eq("organization_id", DEMO_ORGANIZATION_ID)
      .order("document_date", { ascending: false }),
    supabase
      .from("customers")
      .select("id, birthday, email, full_name, customer_promotions(id, status, promotions(name))")
      .eq("organization_id", DEMO_ORGANIZATION_ID)
      .order("birthday"),
  ]);

  throwIfError(storesResult.error);
  throwIfError(notesResult.error);
  throwIfError(customersResult.error);

  return {
    stores: (storesResult.data ?? []) as Store[],
    notes: ((notesResult.data ?? []) as NoteRow[]).map(mapNote),
    customers: ((customersResult.data ?? []) as CustomerRow[]).map(mapCustomer),
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
