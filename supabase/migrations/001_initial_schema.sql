-- Projects
create table projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title      text not null,
  color      text not null,
  created_at timestamptz default now() not null
);

-- Tasks
create table tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade not null default auth.uid(),
  project_id        uuid references projects(id) on delete set null,

  title             text not null,
  notes             text default '' not null,

  urgency           text check (urgency in ('high', 'low')) default 'low' not null,
  importance        text check (importance in ('high', 'low')) default 'low' not null,
  status            text check (status in ('todo', 'in_progress', 'done')) default 'todo' not null,

  scheduled_date    date,
  scheduled_time    time,
  duration          integer,

  recurrence        text check (recurrence in ('none', 'daily', 'weekly', 'weekdays', 'custom')) default 'none' not null,
  custom_days       integer[] default '{}' not null,
  pomodoro_sessions integer default 0 not null,
  tags              text[] default '{}',

  created_at        timestamptz default now() not null,
  completed_at      timestamptz
);

-- Indexes
create index tasks_user_id_idx        on tasks(user_id);
create index tasks_project_id_idx     on tasks(project_id);
create index tasks_scheduled_date_idx on tasks(scheduled_date);

-- Row Level Security
alter table projects enable row level security;
create policy "own projects" on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table tasks enable row level security;
create policy "own tasks" on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
