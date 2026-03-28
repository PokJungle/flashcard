create table traine_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  note text,
  emoji text,
  created_by uuid,
  done boolean default false,
  priority_by text,
  created_at timestamptz default now()
);

alter table traine_tasks enable row level security;
create policy "allow all" on traine_tasks using (true) with check (true);
