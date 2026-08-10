import type { DeliveryNoteDraft } from "@/lib/types";

const MOCK_DELIVERY_NOTE_DRAFT: DeliveryNoteDraft = {
  confidence: 0.94,
  date: "2026-08-10",
  documentNumber: "MOCK-CAFE-001",
  supplier: "KITE GOURMET",
  total: 0,
  lines: [
    { description: "KITE GOURMET GVAN ESPRESSO", quantity: 12, unitPrice: 0 },
    { description: "CAFE DESCAF.PESP. RFA2:5700", quantity: 1, unitPrice: 0 },
    { description: "AZ. BL. REVO MOVELI: 10000 5g", quantity: null, unitPrice: 0 },
    { description: "TEROJO PU ERHI HST 25u", quantity: 1, unitPrice: 0 },
    { description: "PO ERI SILUETA PIRAM. HOL. 150", quantity: 1, unitPrice: 0 },
    { description: "ROOIBOS NASYIRIAPIRAM.BOL.150", quantity: 1, unitPrice: 0 },
    { description: "CANAMO SPICE PIRAMIDES BUL.150", quantity: 1, unitPrice: 0 },
    { description: "DESCUENTO CAFE", quantity: 12, unitPrice: 0 },
  ],
};

export function getMockDeliveryNoteDraft(): DeliveryNoteDraft {
  return {
    ...MOCK_DELIVERY_NOTE_DRAFT,
    lines: MOCK_DELIVERY_NOTE_DRAFT.lines.map((line) => ({ ...line })),
  };
}
