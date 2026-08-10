"use client";

import { DeliveryNotesSection } from "@/features/delivery-notes/DeliveryNotesSection";
import { LoyaltySection } from "@/features/loyalty/LoyaltySection";
import { LoyaltySettingsSection } from "@/features/loyalty/LoyaltySettingsSection";
import { OverviewSection } from "@/features/overview/OverviewSection";
import { ALL_STORES_ID } from "@/lib/demo";
import type { DeliveryNoteDraft, Section } from "@/lib/types";
import { useMemo, useState } from "react";
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
    registerVisit,
    saveLoyaltyRule,
    selectedStoreLabel,
    setStoreId,
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

  if (section === "Resumen") {
    return (
      <OverviewSection
        customers={data.customers}
        defaultStoreId={storeId === ALL_STORES_ID ? defaultStoreId : storeId}
        notes={notes}
        stores={data.stores}
        onRegisterVisit={registerVisit}
      />
    );
  }

  if (section === "Albaranes") {
    return (
      <DeliveryNotesSection
        store={selectedStoreLabel}
        storeId={storeId}
        stores={data.stores}
        notes={filteredNotes}
        query={query}
        onQueryChange={setQuery}
        onStoreChange={setStoreId}
        onScannedNote={(file: File, draft: DeliveryNoteDraft) => {
          const targetStoreId = storeId === ALL_STORES_ID ? defaultStoreId : storeId;
          if (!targetStoreId) return Promise.reject(new Error("No hay cafeterías disponibles."));
          return createDeliveryNote(targetStoreId, file, draft);
        }}
      />
    );
  }

  if (section === "Configuración") {
    return <LoyaltySettingsSection rules={data.loyaltyRules} onSaveRule={saveLoyaltyRule} />;
  }

  return (
    <LoyaltySection
      customers={data.customers}
      defaultStoreId={defaultStoreId}
      stores={data.stores}
      onCreateCustomer={createCustomer}
      onRegisterVisit={registerVisit}
    />
  );
}
