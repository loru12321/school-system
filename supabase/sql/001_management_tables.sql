create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.config_alias_rules (
  id uuid primary key default gen_random_uuid(),
  rule_type text not null,
  standard_name text not null,
  alias_name text not null,
  scope text default 'global',
  project_key text,
  cohort_id text,
  school_name text,
  grade_range text,
  priority int not null default 100,
  is_active boolean not null default true,
  remark text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_config_alias_rules_scope
on public.config_alias_rules (
  rule_type,
  alias_name,
  coalesce(project_key, ''),
  coalesce(cohort_id, '')
);

create index if not exists idx_config_alias_rules_type
on public.config_alias_rules(rule_type, is_active);

create trigger trg_config_alias_rules_updated_at
before update on public.config_alias_rules
for each row execute function public.set_updated_at();

create table if not exists public.import_mapping_rules (
  id uuid primary key default gen_random_uuid(),
  mapping_type text not null,
  source_value text not null,
  target_value text not null,
  confidence numeric(5,2) default 100,
  project_key text,
  cohort_id text,
  exam_id text,
  source_file text,
  is_confirmed boolean not null default false,
  is_active boolean not null default true,
  operator text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_import_mapping_rules_scope
on public.import_mapping_rules(mapping_type, project_key, cohort_id, exam_id);

create trigger trg_import_mapping_rules_updated_at
before update on public.import_mapping_rules
for each row execute function public.set_updated_at();

create table if not exists public.import_logs (
  id uuid primary key default gen_random_uuid(),
  data_type text not null,
  project_key text,
  cohort_id text,
  exam_id text,
  source_file text,
  row_count int default 0,
  success_count int default 0,
  error_count int default 0,
  warning_count int default 0,
  status text not null default 'done',
  detail_json jsonb not null default '{}'::jsonb,
  operator text,
  created_at timestamptz not null default now()
);

create index if not exists idx_import_logs_scope
on public.import_logs(project_key, cohort_id, exam_id, data_type);

create table if not exists public.warning_records (
  id uuid primary key default gen_random_uuid(),
  warning_type text not null,
  warning_code text not null,
  warning_level text not null default 'medium',
  project_key text,
  cohort_id text,
  snapshot_key text,
  exam_id text,
  school_name text,
  grade_name text,
  class_name text,
  subject_name text,
  teacher_name text,
  student_name text,
  source_module text,
  metric_name text,
  metric_value numeric(10,2),
  threshold_value numeric(10,2),
  description text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_warning_records_scope
on public.warning_records(project_key, cohort_id, exam_id);

create index if not exists idx_warning_records_status
on public.warning_records(status, warning_level);

create trigger trg_warning_records_updated_at
before update on public.warning_records
for each row execute function public.set_updated_at();

create table if not exists public.rectify_tasks (
  id uuid primary key default gen_random_uuid(),
  source_warning_id uuid references public.warning_records(id) on delete set null,
  task_type text not null,
  title text not null,
  project_key text,
  cohort_id text,
  exam_id text,
  school_name text,
  grade_name text,
  class_name text,
  subject_name text,
  teacher_name text,
  student_name text,
  problem_desc text,
  action_plan text,
  owner_name text,
  assist_users jsonb not null default '[]'::jsonb,
  due_date date,
  priority text not null default 'medium',
  status text not null default 'todo',
  progress int not null default 0,
  review_result text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rectify_tasks_scope
on public.rectify_tasks(project_key, cohort_id, exam_id);

create index if not exists idx_rectify_tasks_status
on public.rectify_tasks(status, priority, due_date);

create trigger trg_rectify_tasks_updated_at
before update on public.rectify_tasks
for each row execute function public.set_updated_at();

create table if not exists public.rectify_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.rectify_tasks(id) on delete cascade,
  action_type text not null,
  action_detail text,
  progress int,
  operator text,
  created_at timestamptz not null default now()
);

create index if not exists idx_rectify_logs_task
on public.rectify_logs(task_id, created_at desc);

create table if not exists public.snapshot_versions (
  id uuid primary key default gen_random_uuid(),
  version_name text not null,
  project_key text not null,
  cohort_id text not null,
  snapshot_key text,
  exam_scope text,
  score_hash text,
  teacher_hash text,
  target_hash text,
  alias_hash text,
  config_hash text,
  summary_json jsonb not null default '{}'::jsonb,
  is_stable boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_snapshot_versions_scope
on public.snapshot_versions(project_key, cohort_id, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  module_name text not null,
  action_name text not null,
  target_type text,
  target_id text,
  project_key text,
  cohort_id text,
  operator text,
  detail_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_scope
on public.audit_logs(project_key, cohort_id, module_name, created_at desc);
