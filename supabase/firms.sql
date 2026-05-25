create extension if not exists "pgcrypto";

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
  called_by uuid references public.profiles(id) on delete set null,
  called_at timestamptz,
  call_count integer not null default 0 check (call_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists firms_practice_area_idx on public.firms (practice_area);
create index if not exists firms_called_at_idx on public.firms (called_at);
create index if not exists firms_called_by_idx on public.firms (called_by);

alter table public.firms enable row level security;

drop policy if exists "authenticated users can read firms" on public.firms;
create policy "authenticated users can read firms"
  on public.firms for select
  to authenticated
  using (true);

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
    called_by = auth.uid(),
    called_at = now(),
    call_count = call_count + 1
  where id = p_firm_id;
end;
$$;

revoke all on function public.mark_firm_called(uuid) from public;
grant execute on function public.mark_firm_called(uuid) to authenticated;
