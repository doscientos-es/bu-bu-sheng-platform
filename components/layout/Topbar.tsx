import { Bell, Menu, Store } from "lucide-react";
import { ALL_STORES_ID, ALL_STORES_LABEL } from "@/lib/demo";
import type { Section, Store as StoreOption } from "@/lib/types";

type TopbarProps = {
  section: Section;
  stores: StoreOption[];
  storeId: string;
  onStoreChange: (storeId: string) => void;
};

export function Topbar({ section, stores, storeId, onStoreChange }: TopbarProps) {
  return (
    <header className="topbar">
      <button type="button" className="mobile-menu" aria-label="Abrir menú">
        <Menu size={20} />
      </button>
      <div className="crumb">
        <span>Red de cafeterías</span>
        <span>/</span>
        <strong>{section}</strong>
      </div>
      <div className="top-actions">
        <div className="store-select">
          <Store size={16} />
          <select
            value={storeId}
            onChange={(event) => onStoreChange(event.target.value)}
            aria-label="Seleccionar cafetería"
          >
            <option value={ALL_STORES_ID}>{ALL_STORES_LABEL}</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="icon-button" aria-label="Notificaciones">
          <Bell size={18} />
          <i />
        </button>
      </div>
    </header>
  );
}
