import { ChevronDown, FileText, LayoutDashboard, Settings2, Users } from "lucide-react";
import type { ComponentType } from "react";
import { SECTIONS, type Section } from "@/lib/types";

const SECTION_ICONS: Record<Section, ComponentType<{ size?: number }>> = {
  Resumen: LayoutDashboard,
  Albaranes: FileText,
  Fidelización: Users,
};

type SidebarProps = {
  section: Section;
  onNavigate: (section: Section) => void;
};

export function Sidebar({ section, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">D</div>
        <div>
          <strong>Doscientos</strong>
          <span>Cafeterías</span>
        </div>
      </div>
      <div className="workspace-label">ESPACIO DE TRABAJO</div>
      <nav>
        {SECTIONS.map((item) => {
          const Icon = SECTION_ICONS[item];
          return (
            <button
              key={item}
              type="button"
              className={section === item ? "nav-item active" : "nav-item"}
              onClick={() => onNavigate(item)}
            >
              <Icon size={18} />
              {item}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <button type="button" className="nav-item">
          <Settings2 size={18} />
          Configuración
        </button>
        <div className="user-card">
          <div className="avatar">V</div>
          <div>
            <strong>Vicky LZ</strong>
            <span>Administración</span>
          </div>
          <ChevronDown size={15} />
        </div>
      </div>
    </aside>
  );
}
