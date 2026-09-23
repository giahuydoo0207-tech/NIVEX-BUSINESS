create table payment_ledger_entries (
  payment_request_id uuid not null references payment_requests(id),
  commitment varchar(12) not null check (commitment in ('confirmed', 'finalized')),
  signature varchar(88) not null,
  chain varchar(32) not null default 'solana:devnet',
  recipient varchar(44) not null,
  mint varchar(44) not null,
  amount_minor numeric(20,0) not null check (amount_minor > 0),
  reference text not null,
  recorded_at timestamptz not null default now(),
  primary key (payment_request_id, commitment),
  unique (chain, signature, commitment)
);

-- Preserve verified Phase 6 payments without inventing chain metadata.
insert into payment_ledger_entries
  (payment_request_id, commitment, signature, recipient, mint, amount_minor, reference, recorded_at)
select id, case when status='PAID_ON_CHAIN' then 'finalized' else 'confirmed' end,
  transaction_signature, recipient_address, token_mint, amount_minor, reference,
  coalesce(finalized_at, confirmed_at, updated_at)
from payment_requests
where status in ('PAID_ON_CHAIN', 'PAYMENT_DETECTED') and transaction_signature is not null;

create table mobile_sessions (
  token_hash char(64) primary key,
  organization_id uuid not null references organizations(id),
  contractor_id varchar(120) not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index invoices_mobile_scope_idx on invoices
  (organization_id, contractor_id, created_at desc, id);
