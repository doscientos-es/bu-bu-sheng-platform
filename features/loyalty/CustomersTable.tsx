import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Customer } from "@/lib/types";

type CustomersTableProps = {
  customers: Customer[];
};

function formatLastVisit(lastVisit: string | null) {
  if (!lastVisit) return "Aún sin visitas";
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" })
    .format(new Date(lastVisit))
    .replace(".", "");
}

export function CustomersTable({ customers }: CustomersTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Fecha de cumpleaños</th>
            <th>Visitas</th>
            <th>Última visita</th>
            <th>Comunicaciones</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <div className="customer-cell">
                  <div className="avatar small">{customer.name.charAt(0)}</div>
                  <div>
                    <strong>{customer.name}</strong>
                    <small>{customer.email}</small>
                  </div>
                </div>
              </td>
              <td>{customer.birthday}</td>
              <td>{customer.visits}</td>
              <td>{formatLastVisit(customer.lastVisit)}</td>
              <td>
                <StatusBadge
                  tone={customer.hasEmailConsent ? "success" : "neutral"}
                  label={customer.hasEmailConsent ? "Email permitido" : "Sin consentimiento"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
