-- Profile cover images, stored like avatars so Web and every device share them.
alter table community_profiles add column cover_content_type varchar(40);
alter table community_profiles add column cover_content bytea;
alter table community_profiles add column cover_url varchar(2048);
