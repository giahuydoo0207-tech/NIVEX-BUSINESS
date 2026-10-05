-- Replyn proposals. A business drafts and sends a proposal from a Nova conversation; only the talent
-- of that conversation accepts or rejects it in Nova. Accepting allocates the Replyn workspace id,
-- so a workspace never exists for a proposal that was not accepted.
-- DRAFT -> PENDING -> ACCEPTED | REJECTED | CANCELLED | EXPIRED. Discarding a draft deletes it.
-- Money is simulated: nothing here moves or holds funds.
create table replyn_proposals (
  id uuid primary key,
  thread_id uuid not null references message_threads(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  contractor_id varchar(120) not null references talent_profiles(contractor_id),
  status varchar(16) not null default 'DRAFT'
    check (status in ('DRAFT', 'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED')),
  project_name varchar(160) not null default '',
  scope varchar(4000) not null default '',
  deliverables jsonb not null default '[]'::jsonb check (jsonb_typeof(deliverables) = 'array'),
  revision_limit smallint check (revision_limit between 0 and 20),
  currency varchar(8) not null default 'USDC' check (currency in ('USDC')),
  total_amount numeric(14, 2) check (total_amount > 0),
  start_date date,
  deadline date,
  review_period_days smallint check (review_period_days between 1 and 30),
  milestones jsonb not null default '[]'::jsonb check (jsonb_typeof(milestones) = 'array'),
  notes varchar(2000) not null default '',
  -- The proposal this one replaces after a rejection, cancellation or expiry (revision history).
  supersedes_id uuid references replyn_proposals(id),
  workspace_id uuid unique,
  rejection_reason varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  expires_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  check (status = 'DRAFT' or (sent_at is not null and expires_at is not null)),
  check ((status = 'ACCEPTED') = (workspace_id is not null and accepted_at is not null)),
  check ((status = 'REJECTED') = (rejected_at is not null)),
  check ((status = 'CANCELLED') = (cancelled_at is not null))
);

-- At most one draft or pending proposal per conversation, also under concurrent requests.
create unique index replyn_proposals_open_idx on replyn_proposals (thread_id) where status in ('DRAFT', 'PENDING');
create index replyn_proposals_thread_idx on replyn_proposals (thread_id, created_at);
create index replyn_proposals_contractor_idx on replyn_proposals (contractor_id, status);
create index replyn_proposals_organization_idx on replyn_proposals (organization_id, status);

-- Per-conversation preferences of the business side; the talent's copy of the thread is unaffected.
alter table message_threads
  add column business_muted_at timestamptz,
  add column business_hidden_at timestamptz;
