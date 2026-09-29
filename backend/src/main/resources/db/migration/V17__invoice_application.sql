-- New invoices record the accepted application they pay for. Existing rows
-- (created before recipients were validated) keep a null application.
alter table invoices add column application_id uuid references job_applications(id);
create index invoices_application_idx on invoices (application_id);
