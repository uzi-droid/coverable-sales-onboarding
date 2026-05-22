alter table public.crm_activities
  add column if not exists sale_amount numeric(12, 2) not null default 0,
  add column if not exists contract_term text,
  add column if not exists close_date date;
