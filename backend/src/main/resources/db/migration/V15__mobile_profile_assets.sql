alter table community_profiles add column if not exists bio text not null default '';
alter table community_profiles add column if not exists avatar_content_type varchar(120);
alter table community_profiles add column if not exists avatar_content bytea;

