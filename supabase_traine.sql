create table traine_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  note text,
  created_by uuid,
  done boolean default false,
  priority_by text,
  created_at timestamptz default now()
);
