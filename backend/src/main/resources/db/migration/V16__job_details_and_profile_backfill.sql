-- Job fields that Business Web already collects and Mobile displays.
alter table jobs add column if not exists skills jsonb not null default '[]'::jsonb;
alter table jobs add column if not exists engagement varchar(16) not null default 'PROJECT';
alter table jobs add column if not exists payment_type varchar(16) not null default 'FIXED';
alter table jobs add column if not exists duration varchar(80) not null default '';
alter table jobs add column if not exists published_at timestamptz;

-- NOT VALID keeps existing rows untouched while every new write is checked.
alter table jobs add constraint jobs_status_check
  check (status in ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED')) not valid;
alter table jobs add constraint jobs_engagement_check
  check (engagement in ('PROJECT', 'CONTRACT', 'PART_TIME')) not valid;
alter table jobs add constraint jobs_payment_type_check
  check (payment_type in ('FIXED', 'MILESTONE', 'HOURLY')) not valid;

create index if not exists jobs_organization_created_idx on jobs (organization_id, created_at desc);

-- Every talent needs a community identity with the same id: posts, comments, reactions,
-- avatars and chat avatars all join community_profiles.id = talent_profiles.contractor_id.
insert into community_profiles (id, kind, display_name, handle, headline)
select t.contractor_id, 'FREELANCER', t.display_name,
       'member-' || substr(md5(t.contractor_id), 1, 12), t.headline
from talent_profiles t
where not exists (select 1 from community_profiles c where c.id = t.contractor_id)
on conflict do nothing;
