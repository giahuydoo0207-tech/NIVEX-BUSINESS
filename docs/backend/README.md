# Nova Backend Foundation

This document is the first backend milestone for the Nova Business and Nova Mobile clients.

The current clients are demo applications. They already define the shared product surface in
`types/contracts.ts`, but persist data in browser/device-local stores. This backend foundation
keeps the shared contract explicit while leaving Solana settlement, custody, KYB and payout
operations behind a later production boundary.

## Scope for the first five-day milestone

- PostgreSQL schema for identity, organizations, profiles, jobs, applications, posts, messages,
  invoices, payment requests, theme preferences and audit events.
- Versioned REST contract under `/api/v1`.
- Explicit state machines for jobs, applications and invoices.
- Local Docker setup and a repeatable SQL migration baseline.
- No real funds movement, private-key custody or on-chain signing.

## Client review findings

### Business web

- Next.js 16 / React 19 application.
- Current screens: auth/register, dashboard, jobs, job creation/detail, applications,
  contractors, community, messages, invoices, invoice creation and payment preview.
- Data is currently read from demo fixtures and `localStorage` keys such as
  `nivex.demo.job.*`, `nivex.demo.invoice.*`, `nivex.demo.applications` and
  `nivex.demo.community_posts`.
- Login and registration validate UI input but do not create a server session.
- There is no `app/api` directory yet.

### Nova Mobile

- Flutter app for the freelancer role.
- Current data sources are demo controllers, local storage and mock repositories.
- The mobile domain already includes profile, community, jobs, applications, messaging, wallet,
  receive, invoice, transaction and cashout concepts.
- Theme preferences and the USDC minor-unit conventions are already modeled on the client side.

## Non-goals

- Mainnet Solana or real USDC transfer.
- Bank payout, custody, KYC/AML or treasury automation.
- Microservices, Kafka, Kubernetes or production observability in this milestone.

## Local start

```bash
docker compose up -d db
```

Apply `db/migrations/001_init.sql` with the migration runner selected by the backend implementation.
