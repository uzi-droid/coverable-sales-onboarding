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
  notes text not null,
  next_follow_up date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.crm_activities enable row level security;

create policy "reps can read all rep profiles"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
