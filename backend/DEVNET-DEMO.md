# Local Devnet checkout

This is an opt-in local demo, not a production payment service. The API has no
authentication or tenant authorization yet. Keep it bound to localhost. The Next
proxy intentionally rejects production requests even when the demo flag is set.

## Start backend (PowerShell)

PostgreSQL must already be running with the configured database and credentials.
Override DATABASE_URL, DATABASE_USER and DATABASE_PASSWORD for your environment.
From D:\NIVEX-BUSINESS\backend:

```powershell
$env:JAVA_HOME='D:\Tools\Java\jdk-21.0.12.1+1'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
$env:SOLANA_DEMO_RECIPIENT='<public recipient address>'
New-Item -ItemType Directory -Force 'D:\NIVEX-MOBILE\.runtime\java-sockets' | Out-Null
& 'D:\Tools\Maven\apache-maven-3.9.10\bin\mvn.cmd' -q package
& "$env:JAVA_HOME\bin\java.exe" '-Djdk.net.unixdomain.tmpdir=D:\NIVEX-MOBILE\.runtime\java-sockets' -jar target/nova-backend-0.1.0.jar
```

The socket directory flag avoids a Windows temporary-directory issue. It is not
required on Linux. Flyway applies V3 automatically; never edit applied migrations.

## Start web (separate PowerShell)

```powershell
Set-Location D:\NIVEX-BUSINESS
$env:DEVNET_DEMO_ENABLED='true'
$env:NEXT_PUBLIC_PAYMENT_MODE='devnet'
$env:NOVA_API_URL='http://127.0.0.1:8080'
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Open http://127.0.0.1:3001/business/invoices/new. Create an invoice, prepare its
payment, connect a DIFFERENT payer wallet, simulate, review, then personally
approve in Phantom. The payer needs test SOL and Circle USDC on Devnet. Never use
mainnet funds or supply a seed/private key. The demo recipient is server-configured,
not the mock contractor's wallet. Native mobile wallet integration is not included.

## Verification and limitations

- Backend validates genesis, mint, decimals, signer, memo, recipient owner, exact
  token delta and signature uniqueness. Confirmed is PAYMENT_DETECTED; only
  finalized is PAID_ON_CHAIN. Neither status means fiat payout.
- A broadcast signature is saved before submission. Reload and verify the same
  signature after a timeout; do not pay again. A dropped/failed broadcast currently
  needs investigation; there is deliberately no automatic replacement transfer.
- Tests use PostgreSQL with transactional rollback and mocked RPC transactions.
  They do not prove a real wallet-signed transfer has settled.
- Invoice list/mobile still have mock data paths. The checkout and backend are the
  authoritative views for this local demo; full shared-data integration remains.
- Run `npm test`, `node --test lib/solana-payment.test.ts`, `npm run lint`,
  `npm run build`, and Maven tests before committing.
- Do not expose this API or enable production payments until authentication,
  organization authorization, rate limits and operational recovery are implemented.
