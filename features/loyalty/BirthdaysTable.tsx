import { ArrowUpRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Customer } from "@/lib/types";

type BirthdaysTableProps = {
  customers: Customer[];
  onPrepareEmail: (customer: Customer) => void;
};

export function BirthdaysTable({ customers, onPrepareEmail }: BirthdaysTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Cumpleaños</th>
            <th>Promoción</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.email}>
              <td>
                <div className="customer-cell">
                  <div className="avatar small">{customer.name.charAt(0)}</div>
                  <div>
                    <strong>{customer.name}</strong>
                    <small>{customer.email}</small>
                  </div>
                </div>
              </td>
              <td>
                <span className={customer.birthday === "Hoy" ? "today-badge" : ""}>
                  {customer.birthday}
                </span>
              </td>
              <td>{customer.promo}</td>
              <td>
                <StatusBadge
                  tone={customer.status === "Preparado" ? "success" : "neutral"}
                  label={customer.status}
                />
              </td>
              <td className="align-right">
                <button
                  type="button"
                  className="row-action"
                  onClick={() => onPrepareEmail(customer)}
                >
                  Preparar email <ArrowUpRight size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
