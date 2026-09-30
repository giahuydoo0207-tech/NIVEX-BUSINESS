# Deploy demo: Vercel Web + backend public + APK

```
Business Web (Vercel) ──/api/devnet proxy + X-Nova-Demo-Key──┐
                                                              ├─> Spring Boot (HTTPS public) ─> PostgreSQL ─> Solana Devnet
Flutter APK ──────────Bearer token───────────────────────────┘
```

Web không gọi backend từ trình duyệt; proxy server-side của Vercel gắn khóa demo.
APK gọi thẳng backend bằng token đăng nhập. Không có `NOVA_DEMO_API_KEY` trong APK.

## 0. Trước khi bắt đầu

- **Backup DB thật.** Lần khởi động đầu, Flyway sẽ apply các migration đang pending (V14–V16 theo audit 28/09; V19 thêm ví nhận tiền của ứng viên):
  ```powershell
  & 'D:\Tools\PostgreSQL\16\bin\pg_dump.exe' -h localhost -p 5433 -U nova -d nova -n public -Fc -f D:\Data\nova-backup-$(Get-Date -Format yyyyMMdd-HHmm).dump
  ```
- **Tạo khóa demo** (dùng chung cho backend và Vercel):
  ```powershell
  $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | ForEach-Object { $_.ToString('x2') })
  ```
- **Rủi ro:** Business Web chưa có đăng nhập doanh nghiệp. Ai có URL Vercel đều đăng job, xem hồ sơ ứng viên (email). Với demo, bật
  Vercel → Settings → Deployment Protection (Vercel Authentication hoặc Password) cho Production.

## 1A. Backend qua tunnel (nhanh, giữ nguyên DB trên PC)

Backend và PostgreSQL chạy trên PC; tunnel mở HTTPS ra ngoài. Backend giữ `SERVER_ADDRESS=127.0.0.1` vì tunnel kết nối local.

```powershell
# Terminal 1: backend
Set-Location D:\NIVEX-BUSINESS\backend
$env:JAVA_HOME='D:\Tools\Java\jdk-21.0.12.1+1'
$env:NOVA_DEMO_API_KEY='<khoa-demo>'
$env:SOLANA_DEMO_RECIPIENT='<dia-chi-vi-demo-cu>'  # tùy chọn, chỉ gắn nhãn giao dịch cũ
$env:NOVA_PAYMENT_FINALIZER_ENABLED='true'
& 'D:\Tools\Maven\apache-maven-3.9.10\bin\mvn.cmd' -o -q package -DskipTests
& "$env:JAVA_HOME\bin\java.exe" -jar target\nova-backend-0.1.0.jar

# Terminal 2: tunnel (cài một lần: winget install --id Cloudflare.cloudflared)
cloudflared tunnel --url http://127.0.0.1:8080
# -> in ra https://<ten-ngau-nhien>.trycloudflare.com  = <backend-public-url>
```

Giới hạn: tắt PC/terminal là URL chết. Quick tunnel đổi URL mỗi lần chạy lại, khi đó phải sửa `NOVA_API_URL` trên Vercel,
redeploy và build lại APK. Muốn URL cố định: named tunnel của Cloudflare (cần domain) hoặc static domain của ngrok
(`ngrok http --url=<static-domain> 8080`).

## 1B. Backend trên Railway (ổn định)

1. New Project → Deploy from GitHub repo `NIVEX-BUSINESS` (Railway dùng `Dockerfile` ở root; image đã bind `0.0.0.0`, đọc `PORT`).
2. Add → Database → PostgreSQL.
3. Variables của service backend:
   ```
   DATABASE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
   DATABASE_USER=${{Postgres.PGUSER}}
   DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}
   NOVA_DEMO_API_KEY=<khoa-demo>
   CORS_ALLOWED_ORIGINS=https://<vercel-domain>
   SOLANA_NETWORK=devnet
   SOLANA_RPC_URL=https://api.devnet.solana.com
   # Tùy chọn: chỉ để gắn nhãn giao dịch cũ vào ví demo; không bao giờ là người nhận.
   SOLANA_DEMO_RECIPIENT=<dia-chi-vi-demo-cu>
   # Để trống hoặc đúng BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k (xem mục 2).
   SOLANA_USDC_MINT=
   NOVA_PAYMENT_FINALIZER_ENABLED=true
   ```
   `DATABASE_URL` phải là dạng `jdbc:postgresql://…`, không phải `postgres://…`.
4. Chuyển dữ liệu hiện có (backup ở bước 0) vào Postgres của Railway, dùng public connection URL trong tab Connect:
   ```powershell
   & 'D:\Tools\PostgreSQL\16\bin\pg_restore.exe' --no-owner --no-acl -d "<railway-public-postgres-url>" D:\Data\nova-backup-<...>.dump
   ```
5. Settings → Networking → Generate Domain → `<backend-public-url>`.

## 2. Kiểm tra backend

```powershell
Invoke-RestMethod https://<backend-public-url>/api/v1/health
# Mong đợi: ok=True, network=devnet, paymentsConfigured=True, usdcMint=BRjpCH…
Invoke-RestMethod https://<backend-public-url>/api/v1/jobs
```

Từ V19, USDC được chuyển thẳng tới ví nhận tiền mà ứng viên tự khai báo trong app (`/api/v1/mobile/wallet/receive`);
health trả `payoutRecipient=CONTRACTOR_WALLET`. `SOLANA_DEMO_RECIPIENT` không còn là người nhận của thanh toán nào; nó chỉ để
gắn nhãn các giao dịch cũ đã trả vào ví demo (và để từ chối nếu ứng viên khai báo trùng địa chỉ đó).
`paymentsConfigured=False` nghĩa là `SOLANA_NETWORK` khác `devnet`.

`usdcMint` trong health đọc từ `SOLANA_USDC_MINT` (để trống = `BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k`). Web vẫn chỉ ký
giao dịch với mint `BRjpCH…`, nên nếu health báo mint khác thì mọi thanh toán sẽ bị Web từ chối: để trống biến này hoặc đặt đúng `BRjpCH…`.
Ứng viên chưa có ví: tạo hóa đơn nháp được, nhưng tạo yêu cầu thanh toán trả 422 `WALLET_NOT_CONFIGURED`.

## 3. Vercel (project `nivex-business`)

Settings → Environment Variables → **Production**:

```
DEVNET_DEMO_ENABLED=true
NEXT_PUBLIC_PAYMENT_MODE=devnet
NOVA_API_URL=https://<backend-public-url>
NOVA_DEMO_API_KEY=<khoa-demo>
```

Sau đó **Redeploy** (biến `NEXT_PUBLIC_*` được nhúng lúc build; đổi biến mà không build lại thì web vẫn ở chế độ minh họa).
Kiểm tra: mở `https://<vercel-domain>/api/devnet/business/jobs` → JSON danh sách job (không phải 503).

## 4. APK

```powershell
Set-Location D:\NIVEX-FLUTTER
flutter build apk --release `
  --dart-define=NOVA_API_URL=https://<backend-public-url> `
  --dart-define=NOVA_API_ALLOW_LOCAL_HTTP=false `
  --dart-define=APP_ENV=staging
# -> build\app\outputs\flutter-apk\app-release.apk
```

Nếu Gradle báo `insufficient memory … G1 virtual space`: đóng bớt cửa sổ VS Code (extension Java chạy nhiều JVM) rồi build lại.

## 5. Xử lý sự cố

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| Web vẫn hiện dữ liệu minh họa | `NEXT_PUBLIC_PAYMENT_MODE` không có lúc build | Đặt biến ở Production, Redeploy |
| Web báo "Devnet demo is disabled" (503) | Thiếu `DEVNET_DEMO_ENABLED`/`NOVA_API_URL`/`NOVA_DEMO_API_KEY` trên Vercel | Thêm biến, Redeploy |
| Web nhận 401 từ backend | Khóa demo hai bên khác nhau | Đặt cùng một giá trị |
| "Backend chua san sang" | Vercel không tới được backend (tunnel tắt, URL cũ) | Kiểm tra `/api/v1/health` |
| Job đăng rồi nhưng mobile không thấy | Job còn DRAFT/PAUSED hoặc hết hạn | Đăng ngay với hạn ≥ hôm nay (backend giờ trả 400 nếu hạn đã qua) |
| Verify thanh toán thất bại "Expected USDC transfer…" | Người trả dùng USDC khác mint `BRjpCH…` | Xem `backend/DEVNET-DEMO.md` |
| APK không kết nối | URL không phải HTTPS, hoặc build thiếu `NOVA_API_URL` (app chạy fixtures) | Build lại với URL HTTPS |
