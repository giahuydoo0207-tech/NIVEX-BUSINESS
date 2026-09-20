create sequence if not exists invoice_number_seq start with 1;

create table if not exists invoices (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  contractor_id varchar(120) not null,
  invoice_number varchar(64) not null unique,
  description text not null,
  amount_minor numeric(20, 0) not null check (amount_minor > 0),
  currency varchar(12) not null default 'USDC',
  due_date date not null,
  status varchar(32) not null default 'DRAFT',
  idempotency_key varchar(160) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table if not exists payment_requests (
  id uuid primary key,
  invoice_id uuid not null unique references invoices(id) on delete cascade,
  network varchar(64) not null default 'Solana Devnet',
  status varchar(32) not null default 'CREATED',
  recipient_address varchar(128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_organization_created_idx
  on invoices (organization_id, created_at desc);
