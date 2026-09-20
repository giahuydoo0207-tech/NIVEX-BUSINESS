create table if not exists organizations (
  id uuid primary key,
  legal_name varchar(200) not null,
  trading_name varchar(200) not null,
  handle varchar(100) not null unique,
  verified boolean not null default false,
  network varchar(32) not null default 'Solana Devnet',
  created_at timestamptz not null default now()
);

insert into organizations (id, legal_name, trading_name, handle, verified)
values ('00000000-0000-0000-0000-000000000001', 'Nova Labs', 'Nova', 'nova-labs', true)
on conflict (id) do nothing;

create table if not exists jobs (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  title varchar(200) not null,
  category varchar(120) not null,
  summary text not null,
  budget_min_minor bigint not null check (budget_min_minor >= 0),
  budget_max_minor bigint not null check (budget_max_minor >= budget_min_minor),
  currency varchar(12) not null default 'USDC',
  location_scope varchar(120) not null,
  application_deadline date not null,
  status varchar(24) not null default 'DRAFT',
  created_at timestamptz not null default now()
);

create index if not exists jobs_status_created_idx on jobs (status, created_at desc);
