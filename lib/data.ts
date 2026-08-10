import type { Customer, DeliveryNote } from "@/lib/types";

export const ALL_STORES = "Todas las cafeterías";

export const stores = [
  ALL_STORES,
  "Cafetería Centro",
  "Cafetería Norte",
  "Cafetería Retiro",
] as const;

export const initialNotes: DeliveryNote[] = [
  {
    id: 1,
    supplier: "Coca-Cola Europacific Partners",
    store: "Cafetería Centro",
    date: "08 ago 2026",
    status: "Subida detectada",
    total: "113,97 €",
    tone: "warning",
    lines: 4,
  },
  {
    id: 2,
    supplier: "Proveedor de bollería",
    store: "Cafetería Norte",
    date: "07 ago 2026",
    status: "Validado",
    total: "248,30 €",
    tone: "success",
    lines: 12,
  },
  {
    id: 3,
    supplier: "Distribuciones Madrid",
    store: "Cafetería Retiro",
    date: "06 ago 2026",
    status: "Revisión necesaria",
    total: "96,40 €",
    tone: "neutral",
    lines: 8,
  },
  {
    id: 4,
    supplier: "Coca-Cola Europacific Partners",
    store: "Cafetería Norte",
    date: "05 ago 2026",
    status: "Validado",
    total: "102,14 €",
    tone: "success",
    lines: 5,
  },
];

export const customers: Customer[] = [
  {
    name: "María González",
    email: "maria.gonzalez@email.com",
    birthday: "Hoy",
    promo: "Café + bollería",
    status: "Pendiente",
  },
  {
    name: "Javier Martín",
    email: "javier.martin@email.com",
    birthday: "12 ago",
    promo: "10% de descuento",
    status: "Preparado",
  },
  {
    name: "Lucía Sánchez",
    email: "lucia.sanchez@email.com",
    birthday: "18 ago",
    promo: "Café gratis",
    status: "Pendiente",
  },
];

export const scannedNote: Omit<DeliveryNote, "id"> = {
  supplier: "Coca-Cola Europacific Partners",
  store: "Cafetería Centro",
  date: "Hoy",
  status: "Subida detectada",
  total: "113,97 €",
  tone: "warning",
  lines: 4,
};
