import { Bell, Menu, Store } from "lucide-react";
import { stores } from "@/lib/data";
import type { Section } from "@/lib/types";

type TopbarProps = {
  section: Section;
  store: string;
  onStoreChange: (store: string) => void;
};

export function Topbar({ section, store, onStoreChange }: TopbarProps) {
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
            value={store}
            onChange={(event) => onStoreChange(event.target.value)}
            aria-label="Seleccionar cafetería"
          >
            {stores.map((item) => (
              <option key={item}>{item}</option>
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
