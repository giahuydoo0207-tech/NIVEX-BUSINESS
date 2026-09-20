# Nova Backend Flows

## Shared session and workspace flow

```mermaid
flowchart LR
  A[Client login/register] --> B[POST /api/v1/auth/session]
  B --> C{Credentials valid?}
  C -- no --> D[401 + field error]
  C -- yes --> E[Create session cookie]
  E --> F[GET /api/v1/me]
  F --> G[Load organizations and memberships]
  G --> H[Client hydrates web/mobile state]
```

## Job-to-application flow

```mermaid
flowchart LR
  A[Business creates draft job] --> B[POST /api/v1/jobs]
  B --> C[DRAFT]
  C --> D[Publish command]
  D --> E{Required fields valid?}
  E -- no --> C
  E -- yes --> F[PUBLISHED]
  F --> G[Mobile discovers job]
  G --> H[Talent submits application]
  H --> I[SUBMITTED]
  I --> J[Business reviews]
  J --> K[VIEWED / SHORTLISTED / INTERVIEW]
  K --> L[ACCEPTED or REJECTED]
```

## Invoice-to-payment-preview flow

```mermaid
flowchart LR
  A[Business chooses contractor] --> B[POST /api/v1/invoices]
  B --> C[DRAFT]
  C --> D[Issue invoice]
  D --> E[ISSUED]
  E --> F[Create payment request intent]
  F --> G[AWAITING_PAYMENT]
  G --> H{Chain integration enabled?}
  H -- no --> I[Simulation / manual review]
  H -- yes later --> J[Observe transaction]
  J --> K[PAYMENT_DETECTED]
  K --> L[PAID_ON_CHAIN]
  L --> M[Settlement boundary]
```

## Community and messaging flow

```mermaid
flowchart LR
  A[Compose post] --> B[POST /api/v1/posts]
  B --> C[Feed read model]
  C --> D[Reaction/comment/follow commands]
  D --> E[Audit event]
  F[Open candidate/job context] --> G[Conversation]
  G --> H[POST /api/v1/conversations/:id/messages]
  H --> I[Message delivery state]
```

The first backend slice should implement session, organizations, jobs and invoices with strict
authorization. Community and messaging can follow once the identity boundary is real.
