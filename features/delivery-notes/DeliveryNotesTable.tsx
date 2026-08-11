import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DeliveryNote } from "@/lib/types";
import { Popover } from "@base-ui/react/popover";
import { AlertTriangle, FileText } from "lucide-react";

type DeliveryNotesTableProps = {
  notes: DeliveryNote[];
};

function formatPrice(value: number | null) {
  return value === null
    ? "Sin precio"
    : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
}

export function DeliveryNotesTable({ notes }: DeliveryNotesTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Tienda</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th className="align-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => (
            <tr key={note.id}>
              <td>
                <div className="table-supplier">
                  <div className="supplier-icon">
                    <FileText size={15} />
                  </div>
                  <strong>{note.supplier}</strong>
                </div>
                <small>{note.lines} líneas de producto</small>
              </td>
              <td>{note.store}</td>
              <td>{note.date}</td>
              <td>
                {note.priceIncreases.length > 0 ? (
                  <Popover.Root>
                    <Popover.Trigger
                      className="status-badge-trigger"
                      aria-label={`Ver ${note.priceIncreases.length} subidas de precio de ${note.supplier}`}
                    >
                      <StatusBadge tone={note.tone} label={note.status} />
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Positioner align="start" side="bottom" sideOffset={8}>
                        <Popover.Popup className="price-increase-popover">
                          <div className="price-increase-popover-heading">
                            <AlertTriangle size={15} />
                            <span>
                              {note.priceIncreases.length === 1
                                ? "1 producto ha subido de precio"
                                : `${note.priceIncreases.length} productos han subido de precio`}
                            </span>
                          </div>
                          <ul>
                            {note.priceIncreases.map((line) => (
                              <li key={line.description}>
                                <strong>{line.description}</strong>
                                <span>
                                  {formatPrice(line.previousUnitPrice)} → {formatPrice(line.unitPrice)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </Popover.Popup>
                      </Popover.Positioner>
                    </Popover.Portal>
                  </Popover.Root>
                ) : (
                  <StatusBadge tone={note.tone} label={note.status} />
                )}
              </td>
              <td className="align-right price">{note.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
