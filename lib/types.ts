export const SECTIONS = ["Resumen", "Albaranes", "Clientes"] as const;

export type Section = (typeof SECTIONS)[number] | "Configuración";

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

export type DeliveryNoteLineDraft = {
  description: string;
  id?: string;
  quantity: number | null;
  unitPrice: number | null;
  confidence?: number | null;
};

export type DeliveryNoteDraft = {
  supplier: string;
  date: string;
  documentNumber: string;
  total: number | null;
  confidence?: number | null;
  lines: DeliveryNoteLineDraft[];
};

export type PriceComparison = {
  description: string;
  previousUnitPrice: number | null;
  status: "higher" | "lower" | "same" | "unmatched" | "review";
  unitPrice: number | null;
};

export type DeliveryNoteSaveResult = {
  comparison: PriceComparison[];
  note: DeliveryNote;
};

export type CustomerStatus = "Pendiente" | "Preparado";

export type LoyaltyRuleType = "visit_milestone" | "birthday" | "inactivity";

export type LoyaltyRule = {
  id: string;
  type: LoyaltyRuleType;
  active: boolean;
  threshold: number | null;
  rewardName: string;
  rewardDescription: string;
  validityDays: number;
};

export type LoyaltyReward = {
  id: string;
  customerId: string;
  customerName: string;
  ruleType: LoyaltyRuleType;
  rewardName: string;
  code: string;
  status: "prepared" | "sent" | "redeemed" | "expired";
  expiresAt: string;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  birthday: string;
  hasEmailConsent: boolean;
  visits: number;
  lastVisit: string | null;
};

export type DashboardData = {
  stores: Store[];
  notes: DeliveryNote[];
  customers: Customer[];
  loyaltyRules: LoyaltyRule[];
  loyaltyRewards: LoyaltyReward[];
};
