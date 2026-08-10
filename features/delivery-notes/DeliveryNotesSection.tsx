"use client";

import { MetricCard } from "@/components/ui/MetricCard";
import { ALL_STORES_ID, ALL_STORES_LABEL } from "@/lib/demo";
import type {
  DeliveryNote,
  DeliveryNoteDraft,
  DeliveryNoteSaveResult,
  Store as StoreOption,
} from "@/lib/types";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, Search, Store, Upload } from "lucide-react";
import { useState } from "react";
import { DeliveryNotesTable } from "./DeliveryNotesTable";
import { UploadNoteModal } from "./UploadNoteModal";

type DeliveryNotesSectionProps = {
  store: string;
  storeId: string;
  stores: StoreOption[];
  notes: DeliveryNote[];
  query: string;
  onQueryChange: (query: string) => void;
  onStoreChange: (storeId: string) => void;
  onScannedNote: (file: File, draft: DeliveryNoteDraft) => Promise<DeliveryNoteSaveResult>;
};

export function DeliveryNotesSection({
  store,
  storeId,
  stores,
  notes,
  query,
  onQueryChange,
  onStoreChange,
  onScannedNote,
}: DeliveryNotesSectionProps) {
  const [showUpload, setShowUpload] = useState(false);
  const reviewCount = notes.filter((note) => note.tone === "warning").length;

  return (
    <>
      <div className="section-heading page-heading">
        <div>
          <p className="eyebrow">COMPRAS CENTRALIZADAS</p>
          <h1>Albaranes</h1>
          <p className="subtitle">Sube un albarán y detecta cambios de precio al momento.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setShowUpload(true)}>
          <Upload size={17} />
          Subir albarán
        </button>
      </div>

      <div className="metrics compact">
        <MetricCard
          label="Albaranes por revisar"
          value={String(reviewCount)}
          detail="Tienen una subida de precio"
          accent="orange"
        />
        <MetricCard
          label="Precios con subida"
          value={String(reviewCount)}
          detail="Frente al último albarán"
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
              placeholder="Buscar por proveedor o cafetería"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </div>
          <StoreFilter
            currentStore={store}
            storeId={storeId}
            stores={stores}
            onStoreChange={onStoreChange}
          />
        </div>
        <DeliveryNotesTable notes={notes} />
      </div>

      {showUpload && (
        <UploadNoteModal
          onClose={() => setShowUpload(false)}
          onConfirm={(file, draft) => onScannedNote(file, draft)}
        />
      )}
    </>
  );
}

function StoreFilter({
  currentStore,
  storeId,
  stores,
  onStoreChange,
}: {
  currentStore: string;
  storeId: string;
  stores: StoreOption[];
  onStoreChange: (storeId: string) => void;
}) {
  const options = [{ id: ALL_STORES_ID, name: ALL_STORES_LABEL }, ...stores];

  return (
    <Popover.Root>
      <Popover.Trigger className="filter-button" aria-label="Filtrar albaranes por cafetería">
        <Store size={15} />
        {currentStore}
        <ChevronDown size={15} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" side="bottom" sideOffset={8}>
          <Popover.Popup className="store-filter-popover">
            <p>Filtrar por cafetería</p>
            <fieldset aria-label="Cafeterías disponibles">
              {options.map((option) => (
                <Popover.Close
                  className="store-filter-option"
                  key={option.id}
                  type="button"
                  onClick={() => onStoreChange(option.id)}
                >
                  <span>{option.name}</span>
                  {option.id === storeId && <Check size={15} aria-label="Seleccionada" />}
                </Popover.Close>
              ))}
            </fieldset>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
