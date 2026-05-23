-- Only these two existing users may hold admin access.
update public.profiles
set role = 'rep';

update public.profiles
set role = 'admin'
where lower(email) in (
  'uzi@coverable.ai',
  'joshuareinfeld17@gmail.com'
);

-- Re-running this script is safe and prevents reps from changing role via the client API.
drop policy if exists "users can update their own profile" on public.profiles;

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
