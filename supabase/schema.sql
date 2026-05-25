create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'rep' check (role in ('rep', 'admin')),
  start_date date default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id text not null,
  percent_complete integer not null default 0 check (percent_complete between 0 and 100),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  firm_name text not null,
  contact_name text not null,
  contact_role text not null default 'Attorney',
  channel text not null,
  outcome text not null,
  objection text,
  sale_amount numeric(12, 2) not null default 0,
  contract_term text,
  close_date date,
  notes text not null,
  next_follow_up date,
  created_at timestamptz not null default now()
);

create table if not exists public.course_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id text not null,
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create table if not exists public.script_call_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  button_clicks integer not null default 0 check (button_clicks >= 0),
  response_path jsonb not null default '[]'::jsonb,
  practice_area text not null default 'immigration',
  created_at timestamptz not null default now()
);

create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  lead_attorney_full_name text,
  first_name text,
  last_name text,
  firm_name text,
  practice_area text,
  website text,
  firm_phone text,
  attorney_email text,
  linkedin_url text,
  title text,
  address text,
  city text,
  state text,
  zip text,
  source_url text,
  confidence_score integer,
  notes text,
  data_sources text,
  outreach_tier text,
  email_domain text,
  free_email boolean,
  lane_target text,
  email_is_valid boolean,
  has_attorney boolean generated always as (nullif(btrim(lead_attorney_full_name), '') is not null) stored,
  assigned_to uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz,
  called_by uuid references public.profiles(id) on delete set null,
  called_at timestamptz,
  call_count integer not null default 0 check (call_count >= 0),
  created_at timestamptz not null default now()
);

alter table public.firms
  add column if not exists has_attorney boolean generated always as (nullif(btrim(lead_attorney_full_name), '') is not null) stored,
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists assigned_at timestamptz;

create index if not exists firms_practice_area_idx on public.firms (practice_area);
create index if not exists firms_has_attorney_idx on public.firms (has_attorney);
create index if not exists firms_assigned_to_idx on public.firms (assigned_to);
create index if not exists firms_called_at_idx on public.firms (called_at);
create index if not exists firms_called_by_idx on public.firms (called_by);

alter table public.profiles enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.crm_activities enable row level security;
alter table public.course_answers enable row level security;
alter table public.script_call_metrics enable row level security;
alter table public.firms enable row level security;

create policy "reps can read all rep profiles"
  on public.profiles for select
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can read all onboarding progress"
  on public.onboarding_progress for select
  using (true);

create policy "users can manage their own onboarding progress"
  on public.onboarding_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can read all CRM activity for competition"
  on public.crm_activities for select
  using (true);

create policy "users can manage their own CRM activity"
  on public.crm_activities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can manage their own course answers"
  on public.course_answers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can read script call metrics"
  on public.script_call_metrics for select
  using (true);

create policy "users can insert their own script call metrics"
  on public.script_call_metrics for insert
  with check (auth.uid() = user_id);

create policy "authenticated users can read firms"
  on public.firms for select
  to authenticated
  using (true);

create or replace function public.claim_firm(p_firm_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.firms
  set
    assigned_to = auth.uid(),
    assigned_at = now()
  where id = p_firm_id
    and assigned_to is null
  returning assigned_to into v_owner;

  if v_owner is null then
    select assigned_to into v_owner
    from public.firms
    where id = p_firm_id;
  end if;

  return v_owner;
end;
$$;

revoke all on function public.claim_firm(uuid) from public;
grant execute on function public.claim_firm(uuid) to authenticated;

create or replace function public.mark_firm_called(p_firm_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.firms
  set
    assigned_to = coalesce(assigned_to, auth.uid()),
    assigned_at = case when assigned_to is null then now() else assigned_at end,
    called_by = auth.uid(),
    called_at = now(),
    call_count = call_count + 1
  where id = p_firm_id;
end;
$$;

revoke all on function public.mark_firm_called(uuid) from public;
grant execute on function public.mark_firm_called(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create or replace function public.enforce_admin_allowlist()
returns trigger
language plpgsql
as $$
begin
  if new.role = 'admin'
    and lower(new.email) not in ('uzi@coverable.ai', 'joshuareinfeld17@gmail.com') then
    raise exception 'Only approved admin accounts may have the admin role';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_admin_allowlist_on_profiles on public.profiles;
create trigger enforce_admin_allowlist_on_profiles
  before insert or update of email, role on public.profiles
  for each row execute function public.enforce_admin_allowlist();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
