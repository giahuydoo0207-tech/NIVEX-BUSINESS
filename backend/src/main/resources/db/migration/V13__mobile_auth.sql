create table mobile_accounts (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  contractor_id varchar(120) not null unique references talent_profiles(contractor_id),
  email_normalized varchar(254) unique,
  phone_e164 varchar(16) unique,
  password_hash varchar(256),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email_normalized is not null or phone_e164 is not null),
  check (password_hash is null or email_normalized is not null)
);

create table mobile_refresh_tokens (
  token_hash char(64) primary key,
  account_id uuid not null references mobile_accounts(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index mobile_refresh_tokens_account_idx on mobile_refresh_tokens(account_id, expires_at desc);

create table mobile_phone_otp_challenges (
  id uuid primary key,
  phone_e164 varchar(16) not null,
  code_hash varchar(256) not null,
  expires_at timestamptz not null,
  attempt_count smallint not null default 0 check (attempt_count between 0 and 5),
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index mobile_phone_otp_active_idx on mobile_phone_otp_challenges(phone_e164, expires_at desc)
  where consumed_at is null;
