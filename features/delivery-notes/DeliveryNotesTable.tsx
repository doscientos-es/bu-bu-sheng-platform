import { FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DeliveryNote } from "@/lib/types";

type DeliveryNotesTableProps = {
  notes: DeliveryNote[];
};

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
                <StatusBadge tone={note.tone} label={note.status} />
              </td>
              <td className="align-right price">{note.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
