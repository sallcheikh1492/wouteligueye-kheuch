create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category public.skill_category not null,
  level public.skill_level,
  years_experience numeric(4, 1),
  created_at timestamptz not null default now()
);

create index skills_user_id_idx on public.skills(user_id);
create unique index skills_user_name_unique_idx on public.skills(user_id, lower(name));

alter table public.skills enable row level security;

create policy "skills_select_own"
  on public.skills for select
  using (user_id = auth.uid());

create policy "skills_insert_own"
  on public.skills for insert
  with check (user_id = auth.uid());

create policy "skills_update_own"
  on public.skills for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "skills_delete_own"
  on public.skills for delete
  using (user_id = auth.uid());
