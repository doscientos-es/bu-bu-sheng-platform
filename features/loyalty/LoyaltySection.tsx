"use client";

import { ChevronDown, Mail, Plus } from "lucide-react";
import { useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { customers } from "@/lib/data";
import type { Customer } from "@/lib/types";
import { BirthdayEmailModal } from "./BirthdayEmailModal";
import { BirthdaysTable } from "./BirthdaysTable";
import { NewCustomerModal } from "./NewCustomerModal";

export function LoyaltySection() {
  const [showCustomer, setShowCustomer] = useState(false);
  const [emailCustomer, setEmailCustomer] = useState<Customer | null>(null);

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
          value="1.284"
          detail="En las 10 cafeterías"
          accent="green"
        />
        <MetricCard
          label="Cumpleaños próximos"
          value="24"
          detail="En los próximos 7 días"
          accent="blue"
        />
        <MetricCard label="Promociones preparadas" value="86" detail="Este mes" accent="purple" />
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
          onClose={() => setShowCustomer(false)}
          onSave={() => setShowCustomer(false)}
        />
      )}

      {emailCustomer && (
        <BirthdayEmailModal
          customer={emailCustomer}
          onClose={() => setEmailCustomer(null)}
          onMarkAsPrepared={() => setEmailCustomer(null)}
        />
      )}
    </>
  );
}
