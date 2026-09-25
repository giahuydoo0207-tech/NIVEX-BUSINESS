create table message_threads (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  contractor_id varchar(120) not null references talent_profiles(contractor_id),
  request_status varchar(16) not null check (request_status in ('PENDING','ACCEPTED','DECLINED','BLOCKED')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (organization_id, contractor_id)
);
create index message_threads_org_idx on message_threads (organization_id, request_status, updated_at desc);
create index message_threads_contractor_idx on message_threads (contractor_id, updated_at desc);

create table thread_messages (
  id uuid primary key,
  thread_id uuid not null references message_threads(id) on delete cascade,
  sender_type varchar(16) not null check (sender_type in ('BUSINESS','TALENT')),
  body varchar(4000) not null check (char_length(trim(body)) between 1 and 4000),
  sent_at timestamptz not null default now(),
  delivered_at timestamptz,
  seen_at timestamptz
);
create index thread_messages_thread_idx on thread_messages (thread_id, sent_at, id);
