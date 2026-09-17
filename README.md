# Nova Business (NIVEX Business)

Nova Business is the organization-facing web prototype for Nova, a professional social marketplace where international businesses can publish company updates, post freelance jobs, discover verified freelancer profiles, and manage invoice/payment request concepts.

The repository is still named `NIVEX-BUSINESS` during the transition from the original NIVEX brand to Nova.

[View the live demo](https://nivex-business.vercel.app)

> **Prototype status:** This web app uses demo/local data. Wallet connection, transaction signing, Solana verification, USDC settlement, custody, and real payments are not implemented.

## Product Direction

Nova is evolving from a jobs and payments prototype into a broader professional network for cross-border freelance work.

The product combines:

- A professional social network for freelancers and businesses.
- A freelance marketplace for jobs, portfolios, business posts, and applications.
- A cross-border payment layer for invoices, payment requests, wallet history, and settlement concepts.

Nova Business focuses on the company side of that network: publishing opportunities, evaluating freelancer signals, managing candidates, and reviewing payment-related states without touching real funds.

## Companion Mobile App

The freelancer-facing mobile app lives in [NIVEX Flutter](https://github.com/giahuydoo0207-tech/NIVEX-FLUTTER).

The two prototypes are currently separate UI demos. They should eventually align around shared backend contracts for posts, jobs, applications, profiles, media, messaging, invoices, wallets, and notifications.

## Current Business Features

- Responsive public landing page.
- Business login and organization registration flow.
- Business dashboard with operational summaries and activity states.
- Contractor/freelancer directory with search and readiness signals.
- Job creation and management screens.
- Invoice creation and invoice list workflows.
- Browser-local payment link and checkout preview.
- Simulated wallet/payment states with signing intentionally disabled.
- Business-oriented layouts, tables, dialogs, and fixed-precision USDC parsing tests.

## Business Role

Nova Business represents the **Business / Organization** role.

Businesses can:

- Create and manage organization profile information.
- Publish business posts for updates, events, hiring notes, and announcements.
- Publish jobs for freelance or remote opportunities.
- Attach media/banner content where relevant.
- Use hashtags for discovery.
- Review job applicants.
- Inspect freelancer profiles, portfolios, and reputation details.
- Start messaging flows conceptually.
- Create invoice and payment request mock flows.

## Content Model

Nova uses a shared content model across mobile and web.

| Content type | Created by | Purpose | Primary CTA |
| --- | --- | --- | --- |
| Personal post | Freelancer | Share progress, thoughts, updates, and work moments | View profile |
| Product / portfolio post | Freelancer | Showcase finished work, case studies, prototypes, and products | View product |
| Business post | Business | Share company updates, events, hiring news, and announcements | View company |
| Job post | Business | Publish freelance or remote opportunities | View job |

The business `+` creation flow should support:

- **Business post**
- **Job**

The freelancer mobile `+` creation flow should support:

- **Personal post**
- **Product / portfolio**

Both creation paths should reuse the same conceptual composer pattern while changing fields based on content type.

## Feed And CTA Rules

The Nova community experience should feel closer to Facebook and LinkedIn than a traditional job board.

- The feed can mix personal posts, portfolio posts, business posts, and jobs.
- Business posts should lead to company profile or company context.
- Job posts should lead to job detail and application flow.
- Freelancer product posts should lead to product/portfolio detail.
- Freelancer personal posts should lead to public profile.
- Owner actions and viewer actions must be separated.
- Reputation should be discoverable inside profile/reputation sections, not exposed as a public avatar hierarchy marker.

## Hashtags

Hashtags are for discovery and topic grouping.

Rules:

- Maximum 5 hashtags per post.
- No duplicates after normalization.
- Normalize casing and spacing.
- Hashtags should support feed discovery.
- Skill tags remain separate from hashtags and belong to matching/profile/job logic.

## Invoice And Payment Flow

The current payment experience is a mock product flow.

In scope:

- Invoice list and invoice creation UI.
- Payment request concept screens.
- USDC amount formatting.
- Payment link preview.
- Checkout preview.
- Demo wallet states.

Out of scope before the current milestone:

- Real wallet signing.
- Solana Mainnet.
- USDC settlement.
- Custody.
- Real bank payout.
- KYC/AML production workflow.
- Treasury operations.

## Job Posting Flow

Business job content should eventually map to a backend `jobs` domain with:

- Organization owner.
- Title and description.
- Role type and work mode.
- Budget or pay range.
- Skills.
- Hashtags.
- Attachments or banner media.
- Status such as draft, published, closed, or archived.
- Applications from freelancer users.

For the current UI demo, job state can remain local/mock as long as the screen behavior is clear.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix Dialog
- TanStack Table
- Lucide React
- Node test runner

## Architecture

Important areas:

- `app`
- `components`
- `lib`
- `public`

Current project rules:

- Keep business UI work focused on demo completeness.
- Avoid production DevOps scope before the current milestone.
- Do not add Kubernetes, Kafka, microservices, complex CI/CD, production monitoring, or load-test suites yet.
- Keep Solana/payment behavior clearly marked as simulated until backend, security, and compliance decisions are made.

## Backend Direction

The future backend should support:

- Auth
- Users
- Organizations
- Freelancer profiles
- Business profiles
- Jobs
- Applications
- Posts
- Post media
- Hashtags
- Comments
- Reactions
- Messaging
- Files
- Invoices
- Payment requests
- Wallets
- Deposits
- Ledger
- Withdrawals
- Notifications
- Audit events
- Moderation

Expected backend artifacts for the current milestone:

- ERD
- Data dictionary
- API contract
- State machines
- Flyway migrations if schema work has started
- Minimal `docker-compose.yml` for PostgreSQL if backend work has started
- `.env.example`
- Local setup README

## Project Status

The current priority is a strong demo foundation:

1. Finish mobile UI demo for freelancers.
2. Finish web UI demo for businesses.
3. Align mobile and web user flows.
4. Finalize backend core design.
5. Finalize API contracts.
6. Add local setup and basic tests for implemented pieces.

Production infrastructure is intentionally deferred until after the demo and backend core are stable.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run type checks:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

## Safety Notes

- Do not treat demo invoices, wallet states, payment links, or checkout screens as real financial flows.
- Do not add production payout, custody, or Mainnet behavior without a separate product, security, and compliance review.
- Keep reputation details available through profile/reputation pages rather than public avatar status rings.
- Keep changes scoped and verify with relevant checks.

## Author

Nova is developed as a prototype by [Gia Huy Do](https://github.com/giahuydoo0207-tech).
