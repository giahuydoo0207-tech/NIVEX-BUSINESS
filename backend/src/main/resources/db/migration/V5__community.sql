create table community_profiles (
  id varchar(120) primary key,
  kind varchar(24) not null check (kind in ('FREELANCER', 'BUSINESS')),
  display_name varchar(160) not null,
  handle varchar(100) not null unique,
  headline varchar(240) not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into community_profiles (id, kind, display_name, handle, headline)
values ('nova-labs', 'BUSINESS', 'Nova Labs', 'nova-labs', 'Fintech · Web3 · Remote-first')
on conflict (id) do nothing;

insert into community_profiles (id, kind, display_name, handle, headline)
values ('minh-anh', 'FREELANCER', 'Minh Anh', 'minhanh.nova', 'Flutter Developer | Fintech Mobile Applications')
on conflict (id) do nothing;

create table community_posts (
  id uuid primary key,
  author_id varchar(120) not null references community_profiles(id),
  content text not null check (char_length(trim(content)) between 1 and 5000),
  privacy varchar(24) not null default 'PUBLIC' check (privacy in ('PUBLIC', 'FOLLOWERS', 'ONLY_ME')),
  is_pinned boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index community_posts_feed_idx on community_posts (created_at desc) where deleted_at is null;
create index community_posts_author_idx on community_posts (author_id, created_at desc) where deleted_at is null;

create table community_post_topics (
  post_id uuid not null references community_posts(id) on delete cascade,
  topic varchar(80) not null check (char_length(trim(topic)) between 1 and 80),
  primary key (post_id, topic)
);

create table community_post_images (
  id uuid primary key,
  post_id uuid not null references community_posts(id) on delete cascade,
  image_url text not null,
  sort_order smallint not null check (sort_order between 0 and 9),
  unique (post_id, sort_order)
);

create table community_post_reactions (
  post_id uuid not null references community_posts(id) on delete cascade,
  actor_id varchar(120) not null references community_profiles(id),
  reaction_type varchar(24) not null check (reaction_type in ('LIKE', 'LOVE', 'TRUST', 'BUILD', 'INSIGHTFUL', 'DEAL', 'LAUNCH')),
  created_at timestamptz not null default now(),
  primary key (post_id, actor_id)
);

create table community_comments (
  id uuid primary key,
  post_id uuid not null references community_posts(id) on delete cascade,
  parent_comment_id uuid references community_comments(id) on delete cascade,
  author_id varchar(120) not null references community_profiles(id),
  content text not null check (char_length(trim(content)) between 1 and 2000),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index community_comments_post_idx on community_comments (post_id, created_at) where deleted_at is null;

create table community_comment_likes (
  comment_id uuid not null references community_comments(id) on delete cascade,
  actor_id varchar(120) not null references community_profiles(id),
  created_at timestamptz not null default now(),
  primary key (comment_id, actor_id)
);

create table community_saved_posts (
  actor_id varchar(120) not null references community_profiles(id),
  post_id uuid not null references community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (actor_id, post_id)
);

create table community_hidden_posts (
  actor_id varchar(120) not null references community_profiles(id),
  post_id uuid not null references community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (actor_id, post_id)
);

create table community_follows (
  actor_id varchar(120) not null references community_profiles(id),
  followed_profile_id varchar(120) not null references community_profiles(id),
  created_at timestamptz not null default now(),
  primary key (actor_id, followed_profile_id),
  check (actor_id <> followed_profile_id)
);

create table community_blocks (
  actor_id varchar(120) not null references community_profiles(id),
  blocked_profile_id varchar(120) not null references community_profiles(id),
  created_at timestamptz not null default now(),
  primary key (actor_id, blocked_profile_id),
  check (actor_id <> blocked_profile_id)
);

create table community_reports (
  id uuid primary key,
  reporter_id varchar(120) not null references community_profiles(id),
  post_id uuid references community_posts(id) on delete set null,
  reported_profile_id varchar(120) references community_profiles(id) on delete set null,
  reason varchar(80) not null check (char_length(trim(reason)) between 3 and 80),
  details text,
  created_at timestamptz not null default now(),
  check (post_id is not null or reported_profile_id is not null)
);
create index community_reports_target_idx on community_reports (post_id, reported_profile_id, created_at desc);
