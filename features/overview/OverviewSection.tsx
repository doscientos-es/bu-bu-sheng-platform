import {
  ArrowUpRight,
  CalendarDays,
  CircleAlert,
  FileText,
  MoreHorizontal,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Customer, DeliveryNote } from "@/lib/types";

type OverviewSectionProps = {
  customers: Customer[];
  notes: DeliveryNote[];
};

export function OverviewSection({ customers, notes }: OverviewSectionProps) {
  const priceIncreaseCount = notes.filter((note) => note.tone === "warning").length;
  const upcomingBirthdays = customers.filter((customer) => customer.birthday === "Hoy").length;
  const weeklyActivity = [34, 58, 43, 75, 52, 65, 48];
  const weekdays = ["L", "M", "X", "J", "V", "S", "D"];
  const currentDate = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <>
      <div className="dashboard-intro">
        <div>
          <p className="dashboard-path">
            Resumen <span>/</span> Operación
          </p>
          <h1>
            Buenos días, Vicky <span aria-hidden="true">👋</span>
          </h1>
          <p>Una vista rápida de compras, precios y clientes de tu red.</p>
        </div>
        <div className="dashboard-intro-actions">
          <button type="button" className="period-button">
            <CalendarDays size={14} />
            {currentDate}
          </button>
          <button type="button" className="more-button" aria-label="Más opciones">
            <MoreHorizontal size={17} />
          </button>
        </div>
      </div>

      <div className="metrics dashboard-metrics">
        <MetricCard
          label="Albaranes procesados"
          value={String(notes.length)}
          detail="Esta semana"
          accent="blue"
          icon={FileText}
          trend="up"
        />
        <MetricCard
          label="Precios en revisión"
          value={String(priceIncreaseCount)}
          detail="Requieren atención"
          accent="purple"
          icon={CircleAlert}
          trend="down"
        />
        <MetricCard
          label="Clientes activos"
          value={String(customers.length)}
          detail="En todas las cafeterías"
          accent="green"
          icon={UsersRound}
          trend="up"
        />
        <MetricCard
          label="Cumpleaños hoy"
          value={String(upcomingBirthdays)}
          detail="Promoción pendiente"
          accent="orange"
          icon={CalendarDays}
          trend="up"
        />
      </div>

      <div className="overview-workspace">
        <section className="panel activity-chart-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="panel-kicker">ACTIVIDAD DE COMPRAS</p>
              <h2>Albaranes recibidos</h2>
            </div>
            <span className="panel-period">Últimos 7 días</span>
          </div>
          <div className="chart-summary">
            <strong>{notes.length}</strong>
            <span>albaranes procesados</span>
            <small>
              +12% <span>frente a la semana anterior</span>
            </small>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label="Actividad de compras de los últimos siete días"
          >
            {weeklyActivity.map((height, index) => (
              <div className="chart-column" key={weekdays[index]}>
                <div className="chart-bar-track">
                  <div className="chart-bar" style={{ height: `${height}%` }} />
                </div>
                <span>{weekdays[index]}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="panel recent-activity-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="panel-kicker">ACTUALIDAD</p>
              <h2>Actividad reciente</h2>
            </div>
            <Link href="/albaranes" className="text-button">
              Ver todo
            </Link>
          </div>
          <p className="activity-count">
            <strong>{notes.length}</strong> actualizaciones esta semana
          </p>
          <div className="activity-list">
            {notes.slice(0, 4).map((note, index) => (
              <div className="activity-item" key={note.id}>
                <div className={`activity-icon ${note.tone}`}>
                  <FileText size={14} />
                </div>
                <div>
                  <strong>{index === 0 ? "Nuevo albarán" : "Albarán actualizado"}</strong>
                  <p>
                    {note.supplier} · {note.store}
                  </p>
                </div>
                <span>{note.date}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section className="panel overview-table-panel">
        <div className="dashboard-panel-heading overview-table-heading">
          <div>
            <p className="panel-kicker">CONTROL DE COMPRAS</p>
            <h2>Últimos albaranes</h2>
          </div>
          <Link href="/albaranes" className="text-button">
            Ver todos <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="overview-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Cafetería</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className="align-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {notes.slice(0, 4).map((note) => (
                <tr key={note.id}>
                  <td>
                    <div className="table-supplier">
                      <div className="supplier-icon">
                        <FileText size={15} />
                      </div>
                      <strong>{note.supplier}</strong>
                    </div>
                  </td>
                  <td>{note.store}</td>
                  <td>{note.date}</td>
                  <td>
                    <StatusBadge tone={note.tone} label={note.status} />
                  </td>
                  <td className="align-right price">{note.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
