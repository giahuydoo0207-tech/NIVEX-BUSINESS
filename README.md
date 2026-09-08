# NIVEX Business

Business web portal for cross-border contractor invoices and USDC payments on Solana.

## Current prototype

- Business login and three-step organization registration.
- Organization dashboard and contractor verification summaries.
- Arbitrary USDC invoice amounts stored as serialized six-decimal minor units.
- Public payment checkout preview on Solana Devnet.
- Responsive Business Portal without mobile-app framing or phone-specific navigation.

Wallet Standard signing and server-side Solana settlement verification are the next integration milestone. The current checkout does not broadcast transactions or handle real money.

```bash
npm install
npm test
npm run dev
```
