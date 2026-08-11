"use client";

import { MetricCard } from "@/components/ui/MetricCard";
import type { Customer, Store } from "@/lib/types";
import { Plus, Smartphone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CustomersTable } from "./CustomersTable";
import { NewCustomerModal } from "./NewCustomerModal";
import { RegisterVisitCard } from "./RegisterVisitCard";

type LoyaltySectionProps = {
  customers: Customer[];
  defaultStoreId?: string;
  stores: Store[];
  onCreateCustomer: (input: {
    birthday: string;
    consent: boolean;
    email: string;
    name: string;
    storeId: string;
  }) => Promise<void>;
  onRegisterVisit: (customerId: string, storeId: string) => Promise<{ issued: number }>;
};

export function LoyaltySection({
  customers,
  defaultStoreId,
  stores,
  onCreateCustomer,
  onRegisterVisit,
}: LoyaltySectionProps) {
  const [showCustomer, setShowCustomer] = useState(false);
  const totalVisits = customers.reduce((total, customer) => total + customer.visits, 0);
  const customersWithConsent = customers.filter((customer) => customer.hasEmailConsent).length;

  return (
    <section className="customers-page">
      <div className="section-heading page-heading">
        <div>
          <p className="eyebrow">RELACIÓN CON CLIENTES</p>
          <h1>Clientes</h1>
          <p className="subtitle">Consulta clientes y registra una visita en segundos.</p>
        </div>
        <div className="dashboard-intro-actions">
          <Link href="/visitas" className="text-button" target="_blank" rel="noreferrer">
            <Smartphone size={15} />
            Registro en sala
          </Link>
          <button type="button" className="primary-button" onClick={() => setShowCustomer(true)}>
            <Plus size={17} />
            Nuevo cliente
          </button>
        </div>
      </div>

      <div className="metrics compact">
        <MetricCard
          label="Clientes registrados"
          value={String(customers.length)}
          detail={`En ${stores.length} cafeterías`}
          accent="green"
        />
        <MetricCard
          label="Visitas registradas"
          value={String(totalVisits)}
          detail="En toda la red"
          accent="blue"
        />
        <MetricCard
          label="Email autorizado"
          value={String(customersWithConsent)}
          detail="Han aceptado comunicaciones"
          accent="purple"
        />
      </div>

      <div className="panel table-panel">
        <div className="toolbar">
          <div>
            <h2>Lista de clientes</h2>
            <p>Consulta sus visitas y preferencias de comunicación.</p>
          </div>
        </div>
        <CustomersTable customers={customers} />
      </div>

      <RegisterVisitCard
        customers={customers}
        defaultStoreId={defaultStoreId}
        stores={stores}
        onRegister={onRegisterVisit}
      />

      {showCustomer && (
        <NewCustomerModal
          stores={stores}
          onClose={() => setShowCustomer(false)}
          onSave={async (input) => {
            await onCreateCustomer(input);
            setShowCustomer(false);
          }}
        />
      )}
    </section>
  );
}
