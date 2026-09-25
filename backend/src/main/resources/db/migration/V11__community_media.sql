create table community_media (
  id uuid primary key,
  owner_id varchar(120) not null references community_profiles(id),
  content_type varchar(80) not null,
  content bytea not null,
  created_at timestamptz not null default now()
);

create index community_media_owner_idx on community_media (owner_id, created_at desc);
