import { DEMO_ORGANIZATION_ID } from "@/lib/demo";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { DeliveryNoteDraft, PriceComparison } from "@/lib/types";
import { z } from "zod";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;
type ProductRow = { canonical_name: string; id: string };
type SupplierProductRow = { product_id: string; supplier_label: string };

const decimalSchema = z.number().finite().nonnegative().nullable();

export const deliveryNoteDraftSchema = z.object({
  supplier: z.string().trim().min(1, "Indica el proveedor."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Indica una fecha válida."),
  documentNumber: z.string().trim(),
  total: decimalSchema,
  confidence: z.number().finite().min(0).max(1).nullable().optional(),
  lines: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Cada línea necesita una descripción."),
        quantity: decimalSchema,
        unitPrice: decimalSchema,
      }),
    )
    .min(1, "Añade al menos una línea de producto."),
});

export function normalizeProductName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function comparePrice(
  current: number | null,
  previous: number | undefined,
): PriceComparison["status"] {
  if (current === null) return "review";
  if (previous === undefined) return "unmatched";
  if (Math.abs(current - previous) < 0.0001) return "same";
  return current > previous ? "higher" : "lower";
}

export function dateOrToday(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 10);
}

export async function resolveSupplierId(supabase: SupabaseAdmin, supplierName: string) {
  const existing = await supabase
    .from("suppliers")
    .select("id")
    .eq("organization_id", DEMO_ORGANIZATION_ID)
    .ilike("name", supplierName)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id as string;

  const created = await supabase
    .from("suppliers")
    .insert({ organization_id: DEMO_ORGANIZATION_ID, name: supplierName })
    .select("id")
    .single();
  if (created.error) throw created.error;
  return created.data.id as string;
}

export async function resolveProducts(
  supabase: SupabaseAdmin,
  supplierId: string,
  lines: DeliveryNoteDraft["lines"],
) {
  const [productsResult, supplierProductsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, canonical_name")
      .eq("organization_id", DEMO_ORGANIZATION_ID),
    supabase
      .from("supplier_products")
      .select("product_id, supplier_label")
      .eq("supplier_id", supplierId),
  ]);
  if (productsResult.error) throw productsResult.error;
  if (supplierProductsResult.error) throw supplierProductsResult.error;

  const productByName = new Map(
    ((productsResult.data ?? []) as ProductRow[]).map((product) => [
      normalizeProductName(product.canonical_name),
      product.id,
    ]),
  );
  const supplierProductByName = new Map(
    ((supplierProductsResult.data ?? []) as SupplierProductRow[]).map((product) => [
      normalizeProductName(product.supplier_label),
      product.product_id,
    ]),
  );
  const productIds = new Map<string, string>();

  for (const line of lines) {
    const normalizedName = normalizeProductName(line.description);
    if (productIds.has(normalizedName)) continue;

    let productId = supplierProductByName.get(normalizedName) ?? productByName.get(normalizedName);
    if (!productId) {
      const productResult = await supabase
        .from("products")
        .insert({ canonical_name: line.description.trim(), organization_id: DEMO_ORGANIZATION_ID })
        .select("id")
        .single();
      if (productResult.error) throw productResult.error;
      productId = productResult.data.id;
    }
    if (!productId) throw new Error("No se ha podido identificar el producto.");

    if (!supplierProductByName.has(normalizedName)) {
      const mappingResult = await supabase.from("supplier_products").insert({
        product_id: productId,
        supplier_id: supplierId,
        supplier_label: line.description.trim(),
      });
      if (mappingResult.error) throw mappingResult.error;
    }
    productIds.set(normalizedName, productId);
  }

  return productIds;
}

export async function findPreviousPrices(
  supabase: SupabaseAdmin,
  supplierId: string,
  productIds: string[],
  excludeNoteId?: string,
) {
  if (!productIds.length) return new Map<string, number>();
  let query = supabase
    .from("delivery_notes")
    .select("id, document_date, created_at, delivery_note_items(product_id, unit_price)")
    .eq("organization_id", DEMO_ORGANIZATION_ID)
    .eq("supplier_id", supplierId);
  if (excludeNoteId) query = query.neq("id", excludeNoteId);
  const historyResult = await query
    .order("document_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (historyResult.error) throw historyResult.error;

  const previousPrices = new Map<string, number>();
  for (const note of historyResult.data ?? []) {
    for (const item of note.delivery_note_items ?? []) {
      if (
        item.product_id &&
        productIds.includes(item.product_id) &&
        item.unit_price !== null &&
        !previousPrices.has(item.product_id)
      ) {
        previousPrices.set(item.product_id, Number(item.unit_price));
      }
    }
  }
  return previousPrices;
}

export function buildComparison(
  lines: DeliveryNoteDraft["lines"],
  productIdsByName: Map<string, string>,
  previousPrices: Map<string, number>,
): PriceComparison[] {
  return lines.map((line) => {
    const productId = productIdsByName.get(normalizeProductName(line.description));
    const previousUnitPrice = productId ? previousPrices.get(productId) : undefined;
    return {
      description: line.description,
      previousUnitPrice: previousUnitPrice ?? null,
      status: comparePrice(line.unitPrice, previousUnitPrice),
      unitPrice: line.unitPrice,
    };
  });
}
