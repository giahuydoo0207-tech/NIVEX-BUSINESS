create table talent_profiles (
  contractor_id varchar(120) primary key,
  display_name varchar(160) not null,
  headline varchar(240) not null,
  email varchar(254),
  location varchar(160) not null default '',
  skills jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into talent_profiles (contractor_id, display_name, headline, email, location, skills)
values ('contractor-minh-anh', 'Minh Anh', 'Flutter Developer | Fintech Mobile Applications', 'minh.anh@example.com', 'Đà Nẵng, Việt Nam', '["Flutter","Dart","Solana"]'::jsonb)
on conflict (contractor_id) do nothing;

create table job_applications (
  id uuid primary key,
  job_id uuid not null references jobs(id),
  organization_id uuid not null references organizations(id),
  contractor_id varchar(120) not null references talent_profiles(contractor_id),
  cover_note varchar(4000) not null,
  profile_snapshot jsonb not null,
  status varchar(24) not null default 'submitted' check (status in ('submitted','viewed','shortlisted','interview','accepted','rejected','withdrawn')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  unique (job_id, contractor_id)
);
create index job_applications_org_status_idx on job_applications (organization_id, status, submitted_at desc);
create index job_applications_contractor_idx on job_applications (contractor_id, submitted_at desc);

create table application_status_events (
  id uuid primary key,
  application_id uuid not null references job_applications(id) on delete cascade,
  previous_status varchar(24),
  next_status varchar(24) not null,
  actor_type varchar(16) not null check (actor_type in ('BUSINESS','TALENT','SYSTEM')),
  note varchar(1000),
  created_at timestamptz not null default now()
);
create index application_status_events_app_idx on application_status_events (application_id, created_at);
