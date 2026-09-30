-- Public payout wallets that contractors register themselves. Only the public
-- address is stored: never a private key, seed phrase or keypair file.
-- Replacing or removing a wallet deactivates the row instead of deleting it,
-- so the rows double as the change history.
create table if not exists contractor_payout_wallets (
  id uuid primary key,
  contractor_id varchar(120) not null references talent_profiles(contractor_id),
  wallet_address varchar(44) not null,
  network varchar(32) not null,
  token_symbol varchar(12) not null,
  token_mint varchar(44) not null,
  -- Set once ownership is proven with a signed message; saving an address
  -- does not verify it.
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deactivated_at timestamptz
);

create unique index if not exists contractor_payout_wallets_active_idx
  on contractor_payout_wallets (contractor_id, network, token_mint)
  where deactivated_at is null;
create index if not exists contractor_payout_wallets_history_idx
  on contractor_payout_wallets (contractor_id, created_at desc);

-- The recipient a payment request was prepared for, frozen at preparation
-- time so later wallet changes never rewrite payment history.
alter table payment_requests add column if not exists contractor_wallet_id uuid references contractor_payout_wallets(id);
alter table payment_requests add column if not exists recipient_kind varchar(24);
alter table payment_ledger_entries add column if not exists recipient_kind varchar(24);

-- Every recipient prepared before this migration was the server demo wallet.
update payment_requests set recipient_kind = 'LEGACY_DEMO'
  where recipient_address is not null and recipient_kind is null;
update payment_ledger_entries set recipient_kind = 'LEGACY_DEMO'
  where recipient_kind is null;
