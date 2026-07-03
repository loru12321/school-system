alter table public.snapshot_versions
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists version integer not null default 0;

update public.snapshot_versions
set updated_at = created_at
where updated_at is null;

update public.snapshot_versions sv
set is_stable = false
where sv.is_stable = true
  and sv.id <> (
    select keep.id
    from public.snapshot_versions keep
    where keep.project_key = sv.project_key
      and keep.cohort_id = sv.cohort_id
      and keep.is_stable = true
    order by keep.created_at desc, keep.id desc
    limit 1
  );

create unique index if not exists uq_snapshot_versions_single_stable
on public.snapshot_versions(project_key, cohort_id)
where is_stable = true;

create index if not exists idx_snapshot_versions_stable
on public.snapshot_versions(project_key, cohort_id, is_stable, version);

drop trigger if exists trg_snapshot_versions_updated_at on public.snapshot_versions;

create trigger trg_snapshot_versions_updated_at
before update on public.snapshot_versions
for each row execute function public.set_updated_at();
