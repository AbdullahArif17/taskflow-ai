create table if not exists profiles (
  id uuid references auth.users primary key,
  email text,
  plan text default 'free' check (plan in ('free', 'pro')),
  tasks_used_this_month int default 0,
  usage_period date default (date_trunc('month', timezone('utc', now())))::date,
  stripe_customer_id text,
  created_at timestamp default now()
);

alter table profiles
  add column if not exists usage_period date
  default (date_trunc('month', timezone('utc', now())))::date;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  created_at timestamp default now()
);

create table if not exists task_steps (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks on delete cascade not null,
  step_order int not null,
  description text not null,
  status text default 'pending' check (status in ('pending', 'done')),
  created_at timestamp default now()
);

create table if not exists agent_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  task_id uuid references tasks on delete cascade,
  message text not null,
  created_at timestamp default now()
);

create index if not exists tasks_user_created_idx
  on tasks (user_id, created_at desc);
create index if not exists task_steps_task_order_idx
  on task_steps (task_id, step_order);
create index if not exists agent_activity_user_created_idx
  on agent_activity (user_id, created_at desc);
create unique index if not exists profiles_stripe_customer_idx
  on profiles (stripe_customer_id)
  where stripe_customer_id is not null;

alter table profiles enable row level security;
alter table tasks enable row level security;
alter table task_steps enable row level security;
alter table agent_activity enable row level security;

drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "tasks_select_own" on tasks;
drop policy if exists "tasks_insert_own" on tasks;
drop policy if exists "tasks_update_own" on tasks;
drop policy if exists "task_steps_select_own" on task_steps;
drop policy if exists "task_steps_insert_own" on task_steps;
drop policy if exists "agent_activity_select_own" on agent_activity;
drop policy if exists "agent_activity_insert_own" on agent_activity;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);

create policy "tasks_select_own" on tasks for select using (auth.uid() = user_id);
create policy "tasks_update_own" on tasks for update using (auth.uid() = user_id);

create policy "task_steps_select_own" on task_steps
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = task_steps.task_id and tasks.user_id = auth.uid()
    )
  );

create policy "agent_activity_select_own" on agent_activity
  for select using (auth.uid() = user_id);

create or replace function consume_task_quota(target_user_id uuid, free_limit int default 5)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  current_plan text;
  current_usage int;
  current_period date;
  month_start date := (date_trunc('month', timezone('utc', now())))::date;
begin
  select plan, tasks_used_this_month, usage_period
  into current_plan, current_usage, current_period
  from profiles
  where id = target_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if current_period is distinct from month_start then
    current_usage := 0;
  end if;

  if current_plan <> 'pro' and current_usage >= free_limit then
    raise exception 'FREE_PLAN_LIMIT_REACHED';
  end if;

  current_usage := current_usage + 1;
  update profiles
  set tasks_used_this_month = current_usage,
      usage_period = month_start
  where id = target_user_id;

  return current_usage;
end;
$$;

revoke all on function consume_task_quota(uuid, int) from public;
grant execute on function consume_task_quota(uuid, int) to service_role;

create or replace function create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert or update of email on auth.users
  for each row execute function create_profile_for_new_user();

do $$
begin
  alter publication supabase_realtime add table tasks;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table task_steps;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table agent_activity;
exception
  when duplicate_object then null;
end $$;
