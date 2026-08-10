create table if not exists loyalty_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type text not null check (type in ('visit_milestone','birthday','inactivity')),
  active boolean not null default true,
  threshold integer check (threshold is null or threshold > 0),
  reward_name text not null,
  reward_description text not null default '',
  validity_days integer not null default 30 check (validity_days > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, type)
);

create table if not exists customer_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  store_id uuid references stores(id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  rule_id uuid not null references loyalty_rules(id) on delete restrict,
  period_key text not null,
  code text not null unique,
  status text not null default 'prepared' check (status in ('prepared','sent','redeemed','expired')),
  expires_at date not null,
  created_at timestamptz not null default now(),
  unique (customer_id, rule_id, period_key)
);

insert into loyalty_rules (
  organization_id,
  type,
  threshold,
  reward_name,
  reward_description,
  validity_days
)
select id, 'visit_milestone', 10, 'Café gratis', 'Un café de cortesía para agradecer tus visitas.', 30
from organizations
on conflict (organization_id, type) do nothing;

insert into loyalty_rules (
  organization_id,
  type,
  threshold,
  reward_name,
  reward_description,
  validity_days
)
select id, 'birthday', null, 'Café + bollería', 'Un café y una pieza de bollería sin coste para celebrar tu día.', 7
from organizations
on conflict (organization_id, type) do nothing;

insert into loyalty_rules (
  organization_id,
  type,
  threshold,
  reward_name,
  reward_description,
  validity_days
)
select id, 'inactivity', 45, 'Vuelve a visitarnos', 'Un 10% de descuento para tu próxima visita.', 14
from organizations
on conflict (organization_id, type) do nothing;

create index if not exists customer_visits_customer_occurred_idx on customer_visits(customer_id, occurred_at desc);
create index if not exists loyalty_rewards_customer_idx on loyalty_rewards(customer_id, created_at desc);

alter table loyalty_rules enable row level security;
alter table customer_visits enable row level security;
alter table loyalty_rewards enable row level security;

create policy "members can manage loyalty rules" on loyalty_rules for all to authenticated using (public.is_member_of(organization_id)) with check (public.is_member_of(organization_id));
create policy "members can manage customer visits" on customer_visits for all to authenticated using (public.is_member_of(organization_id)) with check (public.is_member_of(organization_id));
create policy "members can manage loyalty rewards" on loyalty_rewards for all to authenticated using (public.is_member_of(organization_id)) with check (public.is_member_of(organization_id));
