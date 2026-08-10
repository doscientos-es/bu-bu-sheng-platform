create extension if not exists pgcrypto;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','admin','staff')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  canonical_name text not null,
  unit text,
  created_at timestamptz not null default now()
);

create table if not exists supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  supplier_label text not null,
  package_size text,
  created_at timestamptz not null default now(),
  unique (supplier_id, supplier_label)
);

create table if not exists delivery_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  store_id uuid not null references stores(id) on delete restrict,
  supplier_id uuid references suppliers(id) on delete set null,
  document_number text,
  document_date date,
  image_path text,
  extraction jsonb not null default '{}'::jsonb,
  extraction_confidence numeric(5,4),
  status text not null default 'pending' check (status in ('pending','review','validated')),
  created_at timestamptz not null default now()
);

create table if not exists delivery_note_items (
  id uuid primary key default gen_random_uuid(),
  delivery_note_id uuid not null references delivery_notes(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  raw_description text not null,
  quantity numeric,
  unit_price numeric(12,4),
  tax_rate numeric(5,2),
  previous_unit_price numeric(12,4),
  comparison_status text not null default 'unmatched' check (comparison_status in ('lower','same','higher','unmatched','review')),
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  store_id uuid references stores(id) on delete set null,
  full_name text not null,
  email text not null,
  birthday date,
  created_at timestamptz not null default now()
);

create table if not exists customer_consents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  channel text not null check (channel in ('email','sms','whatsapp')),
  granted boolean not null default false,
  granted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists customer_promotions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  promotion_id uuid not null references promotions(id) on delete restrict,
  scheduled_for date,
  status text not null default 'pending' check (status in ('pending','prepared','sent','redeemed')),
  created_at timestamptz not null default now()
);

create table if not exists message_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  channel text not null default 'email',
  event_type text not null,
  provider_message_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

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

create index if not exists stores_org_idx on stores(organization_id);
create index if not exists delivery_notes_org_date_idx on delivery_notes(organization_id, document_date desc);
create index if not exists customers_org_birthday_idx on customers(organization_id, birthday);
create index if not exists customer_visits_customer_occurred_idx on customer_visits(customer_id, occurred_at desc);
create index if not exists loyalty_rewards_customer_idx on loyalty_rewards(customer_id, created_at desc);

alter table organizations enable row level security;
alter table stores enable row level security;
alter table memberships enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table supplier_products enable row level security;
alter table delivery_notes enable row level security;
alter table delivery_note_items enable row level security;
alter table customers enable row level security;
alter table customer_consents enable row level security;
alter table promotions enable row level security;
alter table customer_promotions enable row level security;
alter table message_events enable row level security;
alter table loyalty_rules enable row level security;
alter table customer_visits enable row level security;
alter table loyalty_rewards enable row level security;

create or replace function public.is_member_of(target_org uuid)
returns boolean language sql stable security invoker
as $$ select exists (select 1 from public.memberships m where m.organization_id = target_org and m.user_id = (select auth.uid())); $$;

create policy "members can read organizations" on organizations for select to authenticated using (public.is_member_of(id));
create policy "members can read stores" on stores for select to authenticated using (public.is_member_of(organization_id));
create policy "members can read memberships" on memberships for select to authenticated using (public.is_member_of(organization_id));
create policy "members can read suppliers" on suppliers for select to authenticated using (public.is_member_of(organization_id));
create policy "members can read products" on products for select to authenticated using (public.is_member_of(organization_id));
create policy "members can read supplier products" on supplier_products for select to authenticated using (exists (select 1 from suppliers s where s.id = supplier_products.supplier_id and public.is_member_of(s.organization_id)));
create policy "members can manage delivery notes" on delivery_notes for all to authenticated using (public.is_member_of(organization_id)) with check (public.is_member_of(organization_id));
create policy "members can manage delivery note items" on delivery_note_items for all to authenticated using (exists (select 1 from delivery_notes d where d.id = delivery_note_items.delivery_note_id and public.is_member_of(d.organization_id))) with check (exists (select 1 from delivery_notes d where d.id = delivery_note_items.delivery_note_id and public.is_member_of(d.organization_id)));
create policy "members can manage customers" on customers for all to authenticated using (public.is_member_of(organization_id)) with check (public.is_member_of(organization_id));
create policy "members can manage consents" on customer_consents for all to authenticated using (exists (select 1 from customers c where c.id = customer_consents.customer_id and public.is_member_of(c.organization_id))) with check (exists (select 1 from customers c where c.id = customer_consents.customer_id and public.is_member_of(c.organization_id)));
create policy "members can manage promotions" on promotions for all to authenticated using (public.is_member_of(organization_id)) with check (public.is_member_of(organization_id));
create policy "members can manage customer promotions" on customer_promotions for all to authenticated using (exists (select 1 from customers c where c.id = customer_promotions.customer_id and public.is_member_of(c.organization_id))) with check (exists (select 1 from customers c where c.id = customer_promotions.customer_id and public.is_member_of(c.organization_id)));
create policy "members can manage message events" on message_events for all to authenticated using (exists (select 1 from customers c where c.id = message_events.customer_id and public.is_member_of(c.organization_id))) with check (exists (select 1 from customers c where c.id = message_events.customer_id and public.is_member_of(c.organization_id)));
create policy "members can manage loyalty rules" on loyalty_rules for all to authenticated using (public.is_member_of(organization_id)) with check (public.is_member_of(organization_id));
create policy "members can manage customer visits" on customer_visits for all to authenticated using (public.is_member_of(organization_id)) with check (public.is_member_of(organization_id));
create policy "members can manage loyalty rewards" on loyalty_rewards for all to authenticated using (public.is_member_of(organization_id)) with check (public.is_member_of(organization_id));
