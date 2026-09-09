# NIVEX Business

Business web portal for cross-border contractor invoices and USDC payments on Solana.

## Current prototype

- Business login and three-step organization registration.
- Organization dashboard and contractor verification summaries.
- Arbitrary USDC invoice amounts stored as serialized six-decimal minor units.
- Public payment checkout preview on Solana Devnet.
- Responsive Business Portal without mobile-app framing or phone-specific navigation.

## Redesigned experience

- Public landing page at `/`, with product walkthrough, custom payment-network artwork, real dashboard preview, FAQ, and login/register links.
- Electric Blue `#146EF5`, a dark landing page and a light business workspace. Geist is self-hosted.
- Dashboard date ranges, previous-period comparison, responsive tile chart and accessible detail dialogs.
- Invoice list at `/business/invoices`: status filters, search, sorting, pagination, and CSV export.
- Contractor search and readiness filters; creating an invoice from a contractor preserves the recipient selection.
- Local invoices remain available in this browser. Sample activity is explicitly labeled and uses fixed demo dates through September 10, 2026.
- Reduced-motion support, mobile navigation and layouts checked at 320, 390, 768 and 1440 pixels.

The generated network illustration is `public/images/payment-network.webp`. It was created with the built-in image generator using the prompt: an isometric payment infrastructure of porcelain blocks, metal platforms and electric-blue connecting tracks on a dark background, with space above for a headline. The dashboard preview is a browser screenshot of this implementation, not a UI mockup.

Wallet Standard signing and server-side Solana settlement verification are the next integration milestone. The current checkout does not broadcast transactions or handle real money.

```bash
npm install
npm test
npm run dev
```
