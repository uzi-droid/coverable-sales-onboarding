create table if not exists public.course_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id text not null,
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

alter table public.course_answers enable row level security;

drop policy if exists "users can manage their own course answers" on public.course_answers;
create policy "users can manage their own course answers"
  on public.course_answers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
