create table business_profiles (
  organization_id uuid primary key references organizations(id) on delete cascade,
  display_name varchar(160) not null,
  category varchar(240) not null default '',
  bio varchar(2000) not null default '',
  follower_count integer not null default 0 check (follower_count >= 0),
  updated_at timestamptz not null default now()
);

insert into business_profiles (organization_id, display_name, category, bio, follower_count)
select id, trading_name, 'Fintech · Web3 · Remote-first',
  'Hạ tầng thanh toán và giải pháp việc làm số thế hệ mới cho freelancer và doanh nghiệp toàn cầu.', 128
from organizations
on conflict (organization_id) do nothing;

create table business_profile_assets (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  asset_type varchar(12) not null check (asset_type in ('AVATAR', 'COVER')),
  file_name varchar(255) not null,
  content_type varchar(32) not null check (content_type in ('image/png', 'image/jpeg', 'image/webp')),
  byte_size integer not null check (byte_size between 1 and 8388608),
  content bytea not null,
  updated_at timestamptz not null default now(),
  unique (organization_id, asset_type)
);
