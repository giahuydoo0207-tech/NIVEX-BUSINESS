create table notifications (
  id uuid primary key,
  recipient_type varchar(16) not null check (recipient_type in ('BUSINESS','TALENT')),
  organization_id uuid references organizations(id) on delete cascade,
  contractor_id varchar(120) references talent_profiles(contractor_id) on delete cascade,
  type varchar(48) not null,
  title varchar(180) not null,
  body varchar(1000) not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check ((recipient_type='BUSINESS' and organization_id is not null and contractor_id is null) or (recipient_type='TALENT' and contractor_id is not null and organization_id is null))
);
create index notifications_business_idx on notifications (organization_id, read_at, created_at desc);
create index notifications_talent_idx on notifications (contractor_id, read_at, created_at desc);
