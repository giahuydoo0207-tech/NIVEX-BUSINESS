-- QR login challenges for Replyn. Replyn's server creates one, Nova Mobile approves it with the
-- signed-in Talent's session, and Replyn's server consumes it once. Only SHA-256 hashes of the
-- two secrets are stored; the plaintext QR secret lives in the QR code and the browser secret
-- in Replyn's signed HttpOnly cookie.
create table replyn_pairings (
  id uuid primary key,
  client_id varchar(32) not null check (client_id ~ '^[a-z][a-z0-9-]{0,31}$'),
  qr_secret_hash char(64) not null check (qr_secret_hash ~ '^[0-9a-f]{64}$'),
  browser_secret_hash char(64) not null check (browser_secret_hash ~ '^[0-9a-f]{64}$'),
  status varchar(16) not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'CONSUMED', 'EXPIRED')),
  action varchar(16) not null default 'LOGIN' check (action in ('LOGIN')),
  contractor_id varchar(120) references talent_profiles(contractor_id) on delete cascade,
  display_name varchar(160),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  approved_at timestamptz,
  consumed_at timestamptz,
  check (expires_at > created_at),
  -- Identity is set exactly when the challenge is approved and never without an approval time.
  check ((contractor_id is null) = (approved_at is null) and (display_name is null) = (approved_at is null)),
  check (
    (status = 'PENDING' and approved_at is null and consumed_at is null)
    or (status = 'APPROVED' and approved_at is not null and consumed_at is null)
    or (status = 'CONSUMED' and approved_at is not null and consumed_at is not null)
    or (status = 'EXPIRED' and consumed_at is null)
  )
);

-- Cleanup deletes by expiry; the status index serves "live challenges" lookups and audits.
create index replyn_pairings_expires_idx on replyn_pairings (expires_at);
create index replyn_pairings_status_expires_idx on replyn_pairings (status, expires_at);
