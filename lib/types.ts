export const SECTIONS = ["Resumen", "Albaranes", "Fidelización"] as const;

export type Section = (typeof SECTIONS)[number];

export type StatusTone = "success" | "warning" | "neutral";

export type MetricAccent = "orange" | "green" | "purple" | "blue";

export type DeliveryNote = {
  id: number;
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
  name: string;
  email: string;
  birthday: string;
  promo: string;
  status: CustomerStatus;
};
