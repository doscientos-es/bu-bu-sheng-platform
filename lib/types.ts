export const SECTIONS = ["Resumen", "Albaranes", "Fidelización"] as const;

export type Section = (typeof SECTIONS)[number];

export type StatusTone = "success" | "warning" | "neutral";

export type MetricAccent = "orange" | "green" | "purple" | "blue";

export type Store = {
  id: string;
  name: string;
};

export type DeliveryNote = {
  id: string;
  supplier: string;
  store: string;
  date: string;
  status: string;
  total: string;
  tone: StatusTone;
  lines: number;
};

export type CustomerStatus = "Pendiente" | "Preparado";

export type Customer = {
  id: string;
  name: string;
  email: string;
  birthday: string;
  promo: string;
  promotionAssignmentId: string | null;
  status: CustomerStatus;
};

export type DashboardData = {
  stores: Store[];
  notes: DeliveryNote[];
  customers: Customer[];
};
