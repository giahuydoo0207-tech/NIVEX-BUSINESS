-- Public Nova ID plus an optional secret Nova Key per organization.
-- Only the SHA-256 of the key is stored; the plaintext is shown once when issued.
create table organization_nova_credentials (
  organization_id uuid primary key references organizations(id) on delete cascade,
  public_nova_id varchar(16) not null unique
    check (public_nova_id ~ '^NVB-[2-9A-HJKMNP-Z]{8}$'),
  key_hash char(64) check (key_hash ~ '^[0-9a-f]{64}$'),
  key_hint varchar(4),
  key_created_at timestamptz,
  key_last_used_at timestamptz,
  key_revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- An active key always has a hint and creation time, and is never revoked.
  check (key_hash is null or (key_hint is not null and key_created_at is not null and key_revoked_at is null))
);
