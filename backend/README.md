# Nova Backend

Spring Boot API shared by Nova Business and Nova Mobile. Flyway migrations run at
startup; the API never accepts a wallet private key or seed phrase.

## Local development

Set the values from `.env.example` in your shell, then run:

```powershell
$env:JAVA_HOME="D:\Tools\Java\jdk-21.0.12.1+1"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
& "D:\Tools\Maven\apache-maven-3.9.10\bin\mvn.cmd" spring-boot:run
```

The local API is available at `http://localhost:8080/api/v1/health`.

## Docker

From the repository root:

```powershell
docker compose up --build
```

Compose starts PostgreSQL and the API. The API waits for PostgreSQL to report
healthy and applies migrations before serving requests.

## Production environment

Set these values in the chosen API host. Do not commit real credentials.

```text
PORT=8080
DATABASE_URL=jdbc:postgresql://<host>:5432/<database>?sslmode=require
DATABASE_USER=<database-user>
DATABASE_PASSWORD=<database-password>
CORS_ALLOWED_ORIGINS=https://<business-domain>,<mobile-web-domain>
SOLANA_NETWORK=devnet
SOLANA_USDC_MINT=
```

Use a managed PostgreSQL instance in production. `SOLANA_USDC_MINT` remains
empty until the payment lifecycle is ready for Devnet integration.
