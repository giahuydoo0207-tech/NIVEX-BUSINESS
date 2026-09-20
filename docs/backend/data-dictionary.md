# Nova Data Dictionary

| Entity | Key fields | Rules |
| --- | --- | --- |
| users | `id`, `email`, `role` | Email unique; role is `ADMIN`, `MEMBER` or `TALENT` |
| organizations | `id`, `handle`, `verification_status` | One stable workspace identity; verification is explicit |
| organization_members | `organization_id`, `user_id`, `role` | Composite primary key; all business mutations check membership |
| jobs | `budget_*_minor`, `status`, `application_deadline` | USDC only for v1; publish requires complete fields |
| applications | `job_id`, `applicant_user_id`, `status` | One application per user/job; transitions are validated |
| posts | `author_user_id` or `organization_id`, `content` | Exactly one author owner; media and topics are separate concerns |
| messages | `conversation_id`, `sender_user_id`, `delivery_status` | Sender must belong to conversation |
| invoices | `amount_minor`, `status`, `due_date` | Amount is positive integer string; invoice number unique |
| payment_requests | `invoice_id`, `network`, `status` | Represents intent/observation only until chain integration is approved |
| theme_preferences | `user_id`, `theme_id`, `mode` | Last-write-wins by `synced_at` with server validation |
| audit_events | `actor_user_id`, `entity_type`, `event_type` | Append-only operational history |
