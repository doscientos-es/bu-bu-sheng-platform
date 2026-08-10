"use client";

import { useState } from "react";
import { DeliveryNotesSection } from "@/features/delivery-notes/DeliveryNotesSection";
import { useDeliveryNotes } from "@/features/delivery-notes/useDeliveryNotes";
import { LoyaltySection } from "@/features/loyalty/LoyaltySection";
import { OverviewSection } from "@/features/overview/OverviewSection";
import { stores } from "@/lib/data";
import type { Section } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardShell() {
  const [section, setSection] = useState<Section>("Resumen");
  const [store, setStore] = useState<string>(stores[0]);
  const { notes, filteredNotes, query, setQuery, addScannedNote } = useDeliveryNotes();

  return (
    <main className="app-shell">
      <Sidebar section={section} onNavigate={setSection} />
      <section className="content">
        <Topbar section={section} store={store} onStoreChange={setStore} />
        <div className="page-content">
          {section === "Resumen" && <OverviewSection notes={notes} onNavigate={setSection} />}

          {section === "Albaranes" && (
            <DeliveryNotesSection
              store={store}
              notes={filteredNotes}
              query={query}
              onQueryChange={setQuery}
              onScannedNote={addScannedNote}
            />
          )}

          {section === "Fidelización" && <LoyaltySection />}
        </div>
      </section>
    </main>
  );
}
