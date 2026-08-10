"use client";

import { useMemo, useState } from "react";
import { useDashboardData } from "@/features/dashboard/useDashboardData";
import { DeliveryNotesSection } from "@/features/delivery-notes/DeliveryNotesSection";
import { LoyaltySection } from "@/features/loyalty/LoyaltySection";
import { OverviewSection } from "@/features/overview/OverviewSection";
import { ALL_STORES_ID, ALL_STORES_LABEL } from "@/lib/demo";
import type { Section } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type DashboardShellProps = {
  section: Section;
};

export function DashboardShell({ section }: DashboardShellProps) {
  const [storeId, setStoreId] = useState(ALL_STORES_ID);
  const [query, setQuery] = useState("");
  const { createCustomer, createDeliveryNote, data, error, isLoading, preparePromotion } =
    useDashboardData();
  const notes = data?.notes ?? [];
  const selectedStoreLabel =
    data?.stores.find((store) => store.id === storeId)?.name ?? ALL_STORES_LABEL;
  const filteredNotes = useMemo(
    () =>
      notes.filter(
        (note) =>
          (storeId === ALL_STORES_ID || note.store === selectedStoreLabel) &&
          `${note.supplier} ${note.store}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [notes, query, selectedStoreLabel, storeId],
  );

  if (isLoading) {
    return (
      <main className="app-shell dashboard-state">
        <div>
          <span className="loading-dot" />
          Cargando tu espacio de trabajo…
        </div>
      </main>
    );
  }
  if (error || !data)
    return (
      <main className="app-shell dashboard-state">
        <div>
          <strong>No hemos podido cargar el panel.</strong>
          <p>{error ?? "Comprueba tu conexión e inténtalo de nuevo."}</p>
        </div>
      </main>
    );

  const defaultStoreId = data.stores[0]?.id;

  return (
    <main className="app-shell">
      <Sidebar section={section} />
      <section className="content">
        <Topbar
          section={section}
          stores={data.stores}
          storeId={storeId}
          onStoreChange={setStoreId}
        />
        <div className="page-content">
          {section === "Resumen" && <OverviewSection customers={data.customers} notes={notes} />}

          {section === "Albaranes" && (
            <DeliveryNotesSection
              store={selectedStoreLabel}
              notes={filteredNotes}
              query={query}
              onQueryChange={setQuery}
              onScannedNote={(file) => {
                const targetStoreId = storeId === ALL_STORES_ID ? defaultStoreId : storeId;
                if (!targetStoreId)
                  return Promise.reject(new Error("No hay cafeterías disponibles."));
                return createDeliveryNote(targetStoreId, file);
              }}
            />
          )}

          {section === "Fidelización" && (
            <LoyaltySection
              customers={data.customers}
              stores={data.stores}
              onCreateCustomer={createCustomer}
              onPreparePromotion={preparePromotion}
            />
          )}
        </div>
      </section>
    </main>
  );
}
