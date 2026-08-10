"use client";

import { ChevronDown, Search, Store, Upload } from "lucide-react";
import { useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { ALL_STORES_LABEL } from "@/lib/demo";
import type { DeliveryNote } from "@/lib/types";
import { DeliveryNotesTable } from "./DeliveryNotesTable";
import { UploadNoteModal } from "./UploadNoteModal";

type DeliveryNotesSectionProps = {
  store: string;
  notes: DeliveryNote[];
  query: string;
  onQueryChange: (query: string) => void;
  onScannedNote: (file: File) => Promise<void>;
};

export function DeliveryNotesSection({
  store,
  notes,
  query,
  onQueryChange,
  onScannedNote,
}: DeliveryNotesSectionProps) {
  const [showUpload, setShowUpload] = useState(false);
  const reviewCount = notes.filter((note) => note.tone === "warning").length;

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">COMPRAS CENTRALIZADAS</p>
          <h1>Albaranes</h1>
          <p className="subtitle">Digitaliza, organiza y detecta cambios de precio.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setShowUpload(true)}>
          <Upload size={17} />
          Subir albarán
        </button>
      </div>

      <div className="metrics compact">
        <MetricCard
          label="Pendientes de revisar"
          value={String(reviewCount)}
          detail="En todas las tiendas"
          accent="orange"
        />
        <MetricCard
          label="Subidas detectadas"
          value={String(reviewCount)}
          detail="Desde la última compra"
          accent="purple"
        />
        <MetricCard
          label="Documentos del mes"
          value={String(notes.length)}
          detail="Según el filtro actual"
          accent="blue"
        />
      </div>

      <div className="panel table-panel">
        <div className="toolbar">
          <div className="search">
            <Search size={17} />
            <input
              placeholder="Buscar proveedor o tienda"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </div>
          <button type="button" className="filter-button">
            <Store size={15} />
            {store === ALL_STORES_LABEL ? "Todas las tiendas" : store}
            <ChevronDown size={15} />
          </button>
        </div>
        <DeliveryNotesTable notes={notes} />
      </div>

      {showUpload && (
        <UploadNoteModal
          onClose={() => setShowUpload(false)}
          onConfirm={async (file) => {
            await onScannedNote(file);
            setShowUpload(false);
          }}
        />
      )}
    </>
  );
}
