# Nova API Contract v1

All endpoints are JSON and live under `/api/v1`. Dates are ISO-8601 UTC strings. Amounts are
decimal strings in minor units. Mutations require an authenticated session and return the updated
resource plus a stable `version` field.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create user and organization registration |
| POST | `/auth/session` | Start a session |
| DELETE | `/auth/session` | End a session |
| GET | `/me` | Current user, memberships and theme preference |
| GET | `/organizations/:id` | Organization workspace |
| GET | `/jobs` | List jobs visible to current role |
| POST | `/jobs` | Create a draft job |
| GET | `/jobs/:id` | Job detail |
| POST | `/jobs/:id/publish` | Publish a draft |
| POST | `/jobs/:id/applications` | Submit a talent application |
| PATCH | `/applications/:id/status` | Business review transition |
| GET | `/invoices` | List organization invoices or recipient invoices |
| POST | `/invoices` | Create a draft invoice |
| POST | `/invoices/:id/issue` | Issue invoice and create payment request |
| GET | `/payment-requests/:id` | Payment preview/status |
| GET | `/posts` | Feed query |
| POST | `/posts` | Create a post |
| POST | `/posts/:id/reactions` | Set or remove reaction |
| POST | `/posts/:id/comments` | Add comment/reply |
| GET | `/conversations` | List conversations |
| GET | `/conversations/:id/messages` | Read messages |
| POST | `/conversations/:id/messages` | Send message |
| PUT | `/me/theme` | Sync theme preference |

Error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ.",
    "fields": { "dueDate": "Hạn thanh toán phải ở tương lai." }
  }
}
```

Idempotency is required for invoice creation, issue commands and future payment commands. The
server must never accept a private key or seed phrase.
