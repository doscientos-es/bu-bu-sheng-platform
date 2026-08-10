import { ChevronDown, FileText, LayoutDashboard, Search, Settings2, Users } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { SECTIONS, type Section } from "@/lib/types";

const SECTION_ICONS: Record<Section, ComponentType<{ size?: number }>> = {
  Resumen: LayoutDashboard,
  Albaranes: FileText,
  Fidelización: Users,
};

const SECTION_HREFS: Record<Section, string> = {
  Resumen: "/",
  Albaranes: "/albaranes",
  Fidelización: "/fidelizacion",
};

type SidebarProps = {
  section: Section;
};

export function Sidebar({ section }: SidebarProps) {
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
      <Link href="/albaranes" className="sidebar-search" aria-label="Buscar albaranes">
        <Search size={14} />
        <span>Buscar albaranes</span>
      </Link>
      <nav>
        {SECTIONS.map((item) => {
          const Icon = SECTION_ICONS[item];
          return (
            <Link
              key={item}
              href={SECTION_HREFS[item]}
              className={section === item ? "nav-item active" : "nav-item"}
              aria-current={section === item ? "page" : undefined}
            >
              <Icon size={18} />
              {item}
            </Link>
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
