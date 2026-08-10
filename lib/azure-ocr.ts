type AzureField = {
  valueString?: string;
  valueDate?: string;
  valueNumber?: number;
  valueCurrency?: { amount?: number; currencyCode?: string };
  confidence?: number;
};

type AzureDocument = {
  fields?: Record<string, AzureField>;
  confidence?: number;
};

type AzureAnalyzeResult = {
  status?: string;
  analyzeResult?: {
    documents?: AzureDocument[];
    pages?: Array<{ lines?: Array<{ content: string }> }>;
    content?: string;
  };
};

import type { DeliveryNoteDraft } from "@/lib/types";

export type ExtractedDeliveryNote = DeliveryNoteDraft & {
  raw: AzureAnalyzeResult;
};

function value(field: AzureField | undefined) {
  return field?.valueString ?? field?.valueDate ?? field?.valueNumber?.toString() ?? "";
}

function numberValue(field: AzureField | undefined) {
  const amount = field?.valueCurrency?.amount ?? field?.valueNumber;
  return typeof amount === "number" ? amount : null;
}

export async function analyzeWithAzure(file: File): Promise<ExtractedDeliveryNote> {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.replace(/\/$/, "");
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
  const model = process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL || "prebuilt-invoice";
  if (!endpoint || !key || endpoint.startsWith("TODO_") || key.startsWith("TODO_")) {
    throw new Error(
      "Faltan AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT y AZURE_DOCUMENT_INTELLIGENCE_KEY en .env.local",
    );
  }

  const analyzeUrl = `${endpoint}/documentintelligence/documentModels/${encodeURIComponent(model)}:analyze?_overload=analyzeDocument&api-version=2024-11-30`;
  const body = Buffer.from(await file.arrayBuffer());
  const initial = await fetch(analyzeUrl, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Ocp-Apim-Subscription-Key": key,
    },
    body,
  });
  if (!initial.ok) throw new Error(`Azure OCR (${initial.status}): ${await initial.text()}`);
  const operationLocation = initial.headers.get("operation-location");
  if (!operationLocation) throw new Error("Azure no devolvió Operation-Location");

  let result: AzureAnalyzeResult | null = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(1500 + attempt * 250, 4000)));
    const response = await fetch(operationLocation, {
      headers: { "Ocp-Apim-Subscription-Key": key },
    });
    if (!response.ok)
      throw new Error(`Azure OCR result (${response.status}): ${await response.text()}`);
    const candidate = (await response.json()) as AzureAnalyzeResult;
    if (candidate.status === "succeeded") {
      result = candidate;
      break;
    }
    if (candidate.status === "failed") throw new Error("Azure no pudo analizar este documento");
  }
  if (!result) throw new Error("Azure tardó demasiado en devolver el resultado");

  const document = result.analyzeResult?.documents?.[0];
  const fields = document?.fields ?? {};
  const lineItems = fields.Items as unknown as
    | { valueArray?: Array<{ valueObject?: Record<string, AzureField> }> }
    | undefined;
  const lines = (lineItems?.valueArray ?? []).map((item) => {
    const itemFields = item.valueObject ?? {};
    return {
      description: value(itemFields.Description) || value(itemFields.ProductCode) || "",
      quantity: numberValue(itemFields.Quantity),
      unitPrice: numberValue(itemFields.UnitPrice),
      confidence: itemFields.Description?.confidence ?? itemFields.UnitPrice?.confidence ?? null,
    };
  });

  return {
    supplier: value(fields.VendorName) || value(fields.SupplierName),
    date: value(fields.InvoiceDate) || value(fields.DeliveryDate),
    documentNumber: value(fields.InvoiceId) || value(fields.DocumentId),
    total: numberValue(fields.InvoiceTotal) ?? numberValue(fields.AmountDue),
    lines,
    confidence: document?.confidence ?? null,
    raw: result,
  };
}
