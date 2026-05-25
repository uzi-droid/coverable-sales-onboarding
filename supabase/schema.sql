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
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.crm_activities enable row level security;
alter table public.course_answers enable row level security;
alter table public.script_call_metrics enable row level security;

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
