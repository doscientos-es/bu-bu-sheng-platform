"use client";

import { ChevronDown, Mail, Plus } from "lucide-react";
import { useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import type { Customer, Store } from "@/lib/types";
import { BirthdayEmailModal } from "./BirthdayEmailModal";
import { BirthdaysTable } from "./BirthdaysTable";
import { NewCustomerModal } from "./NewCustomerModal";

type LoyaltySectionProps = {
  customers: Customer[];
  stores: Store[];
  onCreateCustomer: (input: {
    birthday: string;
    consent: boolean;
    email: string;
    name: string;
    storeId: string;
  }) => Promise<void>;
  onPreparePromotion: (promotionAssignmentId: string) => Promise<void>;
};

export function LoyaltySection({
  customers,
  stores,
  onCreateCustomer,
  onPreparePromotion,
}: LoyaltySectionProps) {
  const [showCustomer, setShowCustomer] = useState(false);
  const [emailCustomer, setEmailCustomer] = useState<Customer | null>(null);
  const preparedPromotions = customers.filter((customer) => customer.status === "Preparado").length;
  const upcomingBirthdays = customers.filter((customer) => customer.birthday === "Hoy").length;

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">RELACIÓN CON CLIENTES</p>
          <h1>Fidelización</h1>
          <p className="subtitle">Convierte cada visita en una relación más cercana.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setShowCustomer(true)}>
          <Plus size={17} />
          Nuevo cliente
        </button>
      </div>

      <div className="metrics compact">
        <MetricCard
          label="Clientes registrados"
          value={String(customers.length)}
          detail={`En ${stores.length} cafeterías`}
          accent="green"
        />
        <MetricCard
          label="Cumpleaños próximos"
          value={String(upcomingBirthdays)}
          detail="En los próximos 7 días"
          accent="blue"
        />
        <MetricCard
          label="Promociones preparadas"
          value={String(preparedPromotions)}
          detail="Este mes"
          accent="purple"
        />
      </div>

      <div className="panel table-panel">
        <div className="toolbar">
          <div>
            <h2>Próximos cumpleaños</h2>
            <p>Prepara una promoción y envíala por email.</p>
          </div>
          <button type="button" className="filter-button">
            <Mail size={15} />
            Email <ChevronDown size={15} />
          </button>
        </div>
        <BirthdaysTable customers={customers} onPrepareEmail={setEmailCustomer} />
      </div>

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

      {emailCustomer && (
        <BirthdayEmailModal
          customer={emailCustomer}
          onClose={() => setEmailCustomer(null)}
          onMarkAsPrepared={async () => {
            if (!emailCustomer.promotionAssignmentId) return;
            await onPreparePromotion(emailCustomer.promotionAssignmentId);
            setEmailCustomer(null);
          }}
        />
      )}
    </>
  );
}
