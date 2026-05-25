create table if not exists public.script_call_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  button_clicks integer not null default 0 check (button_clicks >= 0),
  created_at timestamptz not null default now()
);

alter table public.script_call_metrics enable row level security;

drop policy if exists "users can read script call metrics" on public.script_call_metrics;
create policy "users can read script call metrics"
  on public.script_call_metrics for select
  using (true);

drop policy if exists "users can insert their own script call metrics" on public.script_call_metrics;
create policy "users can insert their own script call metrics"
  on public.script_call_metrics for insert
  with check (auth.uid() = user_id);
