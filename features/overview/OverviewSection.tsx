import { ArrowUpRight, Cake, CheckCircle2, ChevronDown, FileText } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DeliveryNote, Section } from "@/lib/types";

type OverviewSectionProps = {
  notes: DeliveryNote[];
  onNavigate: (section: Section) => void;
};

export function OverviewSection({ notes, onNavigate }: OverviewSectionProps) {
  return (
    <>
      <div className="hero-row">
        <div>
          <p className="eyebrow">CONTROL CENTRAL</p>
          <h1>Todo bajo control.</h1>
          <p className="subtitle">
            Una visión clara de tus compras y tus clientes, en un solo lugar.
          </p>
        </div>
        <div className="date-pill">
          08 agosto 2026 <ChevronDown size={15} />
        </div>
      </div>

      <div className="metrics">
        <MetricCard
          label="Albaranes este mes"
          value="428"
          detail="+12% vs. mes anterior"
          accent="orange"
        />
        <MetricCard
          label="Subidas detectadas"
          value="17"
          detail="Requieren revisión"
          accent="purple"
        />
        <MetricCard
          label="Clientes fidelizados"
          value="1.284"
          detail="+86 este mes"
          accent="green"
        />
        <MetricCard
          label="Cumpleaños próximos"
          value="24"
          detail="En los próximos 7 días"
          accent="blue"
        />
      </div>

      <div className="grid-two">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Últimos albaranes</h2>
              <p>Revisa las compras de todas tus cafeterías.</p>
            </div>
            <button type="button" className="text-button" onClick={() => onNavigate("Albaranes")}>
              Ver todos <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="mini-table">
            {notes.slice(0, 3).map((note) => (
              <div className="mini-row" key={note.id}>
                <div className="supplier-icon">
                  <FileText size={16} />
                </div>
                <div className="row-main">
                  <strong>{note.supplier}</strong>
                  <span>
                    {note.store} · {note.date}
                  </span>
                </div>
                <StatusBadge tone={note.tone} label={note.status} />
                <strong className="row-total">{note.total}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel highlight-panel">
          <div className="sparkle-orb">
            <Cake size={22} />
          </div>
          <p className="eyebrow">FIDELIZACIÓN</p>
          <h2>
            24 cumpleaños
            <br />
            esta semana
          </h2>
          <p>Prepara una promoción y mantén el vínculo con tus clientes.</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate("Fidelización")}
          >
            Gestionar clientes <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      <div className="next-step">
        <div className="next-icon">
          <CheckCircle2 size={19} />
        </div>
        <div>
          <strong>Siguiente paso recomendado</strong>
          <p>Revisa las 17 variaciones de precio antes de cerrar la semana.</p>
        </div>
        <button type="button" onClick={() => onNavigate("Albaranes")}>
          Ir a albaranes <ArrowUpRight size={15} />
        </button>
      </div>
    </>
  );
}
