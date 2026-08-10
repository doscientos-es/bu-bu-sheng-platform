"use client";

import { useMemo, useState } from "react";
import { DeliveryNotesSection } from "@/features/delivery-notes/DeliveryNotesSection";
import { LoyaltySection } from "@/features/loyalty/LoyaltySection";
import { OverviewSection } from "@/features/overview/OverviewSection";
import { ALL_STORES_ID } from "@/lib/demo";
import type { Section } from "@/lib/types";
import { useDashboardContext } from "./DashboardContext";

type DashboardRouteContentProps = {
  section: Section;
};

export function DashboardRouteContent({ section }: DashboardRouteContentProps) {
  const [query, setQuery] = useState("");
  const {
    createCustomer,
    createDeliveryNote,
    data,
    defaultStoreId,
    notes,
    preparePromotion,
    selectedStoreLabel,
    storeId,
  } = useDashboardContext();
  const filteredNotes = useMemo(
    () =>
      notes.filter(
        (note) =>
          (storeId === ALL_STORES_ID || note.store === selectedStoreLabel) &&
          `${note.supplier} ${note.store}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [notes, query, selectedStoreLabel, storeId],
  );

  if (section === "Resumen") return <OverviewSection customers={data.customers} notes={notes} />;

  if (section === "Albaranes") {
    return (
      <DeliveryNotesSection
        store={selectedStoreLabel}
        notes={filteredNotes}
        query={query}
        onQueryChange={setQuery}
        onScannedNote={(file) => {
          const targetStoreId = storeId === ALL_STORES_ID ? defaultStoreId : storeId;
          if (!targetStoreId) return Promise.reject(new Error("No hay cafeterías disponibles."));
          return createDeliveryNote(targetStoreId, file);
        }}
      />
    );
  }

  return (
    <LoyaltySection
      customers={data.customers}
      stores={data.stores}
      onCreateCustomer={createCustomer}
      onPreparePromotion={preparePromotion}
    />
  );
}
