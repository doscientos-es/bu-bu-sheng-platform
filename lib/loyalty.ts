import { randomUUID } from "node:crypto";
import { DEMO_ORGANIZATION_ID } from "@/lib/demo";
import { sendLoyaltyEmail } from "@/lib/loyalty-email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { LoyaltyRule, LoyaltyRuleType } from "@/lib/types";

type RuleRow = {
  id: string;
  type: LoyaltyRuleType;
  active: boolean;
  threshold: number | null;
  reward_name: string;
  reward_description: string;
  validity_days: number;
};

type CustomerRow = {
  id: string;
  full_name: string;
  email: string;
  birthday: string | null;
  created_at: string;
  customer_consents: Array<{ granted: boolean }>;
};

type VisitRow = {
  customer_id: string;
  occurred_at: string;
};

export type LoyaltyRunResult = {
  issued: number;
  prepared: number;
  sent: number;
};

function ruleFromRow(row: RuleRow): LoyaltyRule {
  return {
    id: row.id,
    type: row.type,
    active: row.active,
    threshold: row.threshold,
    rewardName: row.reward_name,
    rewardDescription: row.reward_description,
    validityDays: row.validity_days,
  };
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function hasEmailConsent(customer: CustomerRow) {
  return customer.customer_consents.some((consent) => consent.granted);
}

function isBirthdayToday(birthday: string | null, today: Date) {
  if (!birthday) return false;
  const [, month, day] = birthday.split("-");
  const currentMonth = String(today.getUTCMonth() + 1).padStart(2, "0");
  const currentDay = String(today.getUTCDate()).padStart(2, "0");
  return month === currentMonth && day === currentDay;
}

function rewardCode(type: LoyaltyRuleType) {
  const prefix = type === "birthday" ? "CUMPLE" : type === "inactivity" ? "VUELVE" : "VISITA";
  return `${prefix}-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

async function issueReward(input: {
  customer: CustomerRow;
  rule: RuleRow;
  periodKey: string;
  result: LoyaltyRunResult;
}) {
  if (!hasEmailConsent(input.customer)) return false;

  const supabase = getSupabaseAdmin();
  const expiresAt = dateKey(addDays(new Date(), input.rule.validity_days));
  const reward = await supabase
    .from("loyalty_rewards")
    .upsert(
      {
        organization_id: DEMO_ORGANIZATION_ID,
        customer_id: input.customer.id,
        rule_id: input.rule.id,
        period_key: input.periodKey,
        code: rewardCode(input.rule.type),
        expires_at: expiresAt,
      },
      { onConflict: "customer_id,rule_id,period_key", ignoreDuplicates: true },
    )
    .select("id, code")
    .maybeSingle();
  if (reward.error) throw reward.error;
  if (!reward.data) return false;

  const delivery = await sendLoyaltyEmail({
    customerName: input.customer.full_name,
    email: input.customer.email,
    rewardCode: reward.data.code,
    rewardDescription: input.rule.reward_description,
    rewardName: input.rule.reward_name,
    expiresAt,
  });

  const [statusUpdate, eventInsert] = await Promise.all([
    supabase.from("loyalty_rewards").update({ status: delivery.status }).eq("id", reward.data.id),
    supabase.from("message_events").insert({
      customer_id: input.customer.id,
      channel: "email",
      event_type: `loyalty.${input.rule.type}.${delivery.status}`,
      provider_message_id: delivery.providerMessageId,
      payload: { rewardCode: reward.data.code, ruleId: input.rule.id },
    }),
  ]);
  if (statusUpdate.error) throw statusUpdate.error;
  if (eventInsert.error) throw eventInsert.error;

  input.result.issued += 1;
  input.result[delivery.status] += 1;
  return true;
}

async function getDailyAutomationData() {
  const supabase = getSupabaseAdmin();
  const [rulesResult, customersResult, visitsResult] = await Promise.all([
    supabase
      .from("loyalty_rules")
      .select("id, type, active, threshold, reward_name, reward_description, validity_days")
      .eq("organization_id", DEMO_ORGANIZATION_ID),
    supabase
      .from("customers")
      .select("id, full_name, email, birthday, created_at, customer_consents(granted)")
      .eq("organization_id", DEMO_ORGANIZATION_ID),
    supabase
      .from("customer_visits")
      .select("customer_id, occurred_at")
      .eq("organization_id", DEMO_ORGANIZATION_ID),
  ]);
  if (rulesResult.error) throw rulesResult.error;
  if (customersResult.error) throw customersResult.error;
  if (visitsResult.error) throw visitsResult.error;

  return {
    rules: (rulesResult.data ?? []) as RuleRow[],
    customers: (customersResult.data ?? []) as CustomerRow[],
    visits: (visitsResult.data ?? []) as VisitRow[],
  };
}

export async function processDailyLoyaltyAutomations(): Promise<LoyaltyRunResult> {
  const { rules, customers, visits } = await getDailyAutomationData();
  const result: LoyaltyRunResult = { issued: 0, prepared: 0, sent: 0 };
  const today = new Date();
  const lastVisitByCustomer = new Map<string, string>();

  for (const visit of visits) {
    const current = lastVisitByCustomer.get(visit.customer_id);
    if (!current || visit.occurred_at > current)
      lastVisitByCustomer.set(visit.customer_id, visit.occurred_at);
  }

  for (const customer of customers) {
    for (const rule of rules) {
      if (!rule.active) continue;

      if (rule.type === "birthday" && isBirthdayToday(customer.birthday, today)) {
        await issueReward({
          customer,
          rule,
          periodKey: `birthday-${today.getUTCFullYear()}`,
          result,
        });
      }

      if (rule.type === "inactivity" && rule.threshold) {
        const lastVisit = lastVisitByCustomer.get(customer.id);
        if (!lastVisit) continue;
        const inactiveSince = Math.floor(
          (today.getTime() - new Date(lastVisit).getTime()) / 86_400_000,
        );
        if (inactiveSince >= rule.threshold) {
          await issueReward({
            customer,
            rule,
            periodKey: `inactive-${dateKey(new Date(lastVisit))}`,
            result,
          });
        }
      }
    }
  }

  return result;
}

export async function registerCustomerVisit(input: { customerId: string; storeId: string }) {
  const supabase = getSupabaseAdmin();
  const customerResult = await supabase
    .from("customers")
    .select("id, full_name, email, birthday, created_at, customer_consents(granted)")
    .eq("id", input.customerId)
    .eq("organization_id", DEMO_ORGANIZATION_ID)
    .maybeSingle();
  if (customerResult.error) throw customerResult.error;
  if (!customerResult.data) throw new Error("Cliente no válido.");

  const storeResult = await supabase
    .from("stores")
    .select("id")
    .eq("id", input.storeId)
    .eq("organization_id", DEMO_ORGANIZATION_ID)
    .maybeSingle();
  if (storeResult.error) throw storeResult.error;
  if (!storeResult.data) throw new Error("Cafetería no válida.");

  const insert = await supabase.from("customer_visits").insert({
    organization_id: DEMO_ORGANIZATION_ID,
    customer_id: input.customerId,
    store_id: input.storeId,
  });
  if (insert.error) throw insert.error;

  const [visitsResult, rulesResult] = await Promise.all([
    supabase
      .from("customer_visits")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", input.customerId),
    supabase
      .from("loyalty_rules")
      .select("id, type, active, threshold, reward_name, reward_description, validity_days")
      .eq("organization_id", DEMO_ORGANIZATION_ID)
      .eq("type", "visit_milestone")
      .eq("active", true),
  ]);
  if (visitsResult.error) throw visitsResult.error;
  if (rulesResult.error) throw rulesResult.error;

  const result: LoyaltyRunResult = { issued: 0, prepared: 0, sent: 0 };
  const visits = visitsResult.count ?? 0;
  const customer = customerResult.data as CustomerRow;
  for (const rule of (rulesResult.data ?? []) as RuleRow[]) {
    if (rule.threshold && visits > 0 && visits % rule.threshold === 0) {
      await issueReward({ customer, rule, periodKey: `visit-${visits}`, result });
    }
  }

  return { result, visits };
}

export { ruleFromRow };
