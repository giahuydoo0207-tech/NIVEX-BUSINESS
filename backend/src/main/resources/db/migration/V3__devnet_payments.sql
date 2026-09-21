alter table payment_requests add column token_mint varchar(44);
alter table payment_requests add column amount_minor numeric(20,0);
alter table payment_requests add column reference text unique;
alter table payment_requests add column transaction_signature varchar(88) unique;
alter table payment_requests add column confirmed_at timestamptz;
alter table payment_requests add column finalized_at timestamptz;
alter table payment_requests add constraint payment_amount_u64
  check (amount_minor > 0 and amount_minor <= 18446744073709551615);
-- Older mock payment requests remain unpayable until explicitly prepared.
