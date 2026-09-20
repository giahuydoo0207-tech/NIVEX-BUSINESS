create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  password_hash text not null,
  role text not null check (role in ('ADMIN', 'MEMBER', 'TALENT')),
  avatar_url text,
  wallet_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trading_name text not null,
  handle text not null unique,
  verified boolean not null default false,
  verification_status text not null default 'DRAFT',
  network text not null default 'Solana Devnet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('OWNER', 'ADMIN', 'MEMBER')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists freelancer_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  headline text not null default '',
  location text not null default '',
  bio text not null default '',
  skills jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists business_profiles (
  organization_id uuid primary key references organizations(id) on delete cascade,
  headline text not null default '',
  bio text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  title text not null,
  category text not null,
  summary text not null,
  skills jsonb not null default '[]'::jsonb,
  hashtags jsonb not null default '[]'::jsonb,
  work_mode text not null default 'REMOTE',
  location_scope text not null,
  engagement text not null,
  payment_type text not null,
  budget_min_minor text not null,
  budget_max_minor text not null,
  currency text not null default 'USDC',
  duration text not null,
  application_deadline date not null,
  status text not null default 'DRAFT',
  notify_matching_talent boolean not null default false,
  applicant_count integer not null default 0,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  applicant_user_id uuid not null references users(id),
  match_score integer,
  cover_note text not null,
  status text not null default 'submitted',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_user_id)
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  contractor_user_id uuid not null references users(id),
  invoice_number text not null unique,
  description text not null,
  amount_minor text not null,
  currency text not null default 'USDC',
  due_date date not null,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_requests (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null unique references invoices(id) on delete cascade,
  network text not null default 'Solana Devnet',
  status text not null default 'CREATED',
  recipient_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists theme_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  theme_id text not null,
  mode text not null check (mode in ('light', 'dark')),
  synced_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists jobs_organization_status_idx on jobs (organization_id, status);
create index if not exists applications_job_status_idx on applications (job_id, status);
create index if not exists invoices_organization_status_idx on invoices (organization_id, status);
create index if not exists audit_events_entity_idx on audit_events (entity_type, entity_id, created_at desc);
