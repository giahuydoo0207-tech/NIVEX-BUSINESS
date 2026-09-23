# Phase 7: backend and Flutter foundation

Implemented locally:

- V4 records verified payment evidence, with one row per payment and commitment.
  Verification and invoice updates share a database transaction.
  V4 imports already verified Phase 6 payments; it does not fabricate payer or slot data.
- Optional finalizer polls up to 25 PAYMENT_DETECTED rows every 30 seconds.
  Enable with NOVA_PAYMENT_FINALIZER_ENABLED=true. It verifies existing evidence;
  it does not send transactions or discover signatures the backend has never received.
- Read-only GET /api/v1/mobile/me, /invoices and /transactions use scoped bearer
  sessions. Database stores only SHA-256 token hashes, expiry and revocation.
  Organization and contractor come from the session, never query parameters.
  Transactions contain finalized invoice payments only, not a wallet balance.
- Flutter staging has Wallet > Hoa don Devnet, backed by the invoices endpoint.
  Session tokens are entered at runtime and stored in secure storage per API origin.
  The demo app remains available; existing wallet balance/cashout screens are still simulations.

## Staging verification

1. Deploy backend code after reviewing V4; Flyway applies the migration.
2. Set the finalizer flag above to enable background finalization.
3. Use a PostgreSQL admin connection through PGHOST, PGPORT, PGUSER, PGDATABASE
   and the usual password prompt/PGPASSFILE. Do not use the public mobile API to issue sessions.
4. In PowerShell 7, run:

   ./backend/scripts/new-mobile-session.ps1 -OrganizationId <organization-uuid> -ContractorId <invoice-contractor-id>

   The command creates an 8-hour read-only staging session and displays its token once.
   Use the contractor_id from the intended invoice, not the display name or wallet address.
5. In D:/NIVEX-FLUTTER run:

   flutter run --dart-define=APP_ENV=staging --dart-define=NOVA_API_URL=https://YOUR-BACKEND-HOST

6. Open Wallet > Hoa don Devnet and enter that session token.
   Issued invoices for that organization and contractor should appear.
   Verify a Devnet payment on the web, refresh mobile, and check PAID_ON_CHAIN.
7. Revoke the session in the admin database:

   UPDATE mobile_sessions SET revoked_at=now() WHERE token_hash='<stored-hash>';

   Refresh mobile: invoice data must clear and the session prompt must return.

Backend tests use a separate PostgreSQL database via DATABASE_URL, DATABASE_USER
and DATABASE_PASSWORD. Run mvn test in backend. Flutter: flutter analyze and flutter test.

## Remaining Phase 7 work

This is a staging foundation, not complete production authentication.
Real user login, refresh tokens, membership management, account recovery, wallet
ownership linking, live balances, job applications and
production rollout remain separate implementation work.
All recipients still follow the Phase 6 fixed demo-recipient model; contractor
labels are not proof that the contractor owns that recipient wallet.
Do not embed NOVA_DEMO_API_KEY or session tokens in APKs or dart-defines.

## Cap nhat kiem tra ngay 2026-09-22

- Flutter da co hai tab Hoa don / Giao dich. Giao dich chi lay bang chung
  finalized tu API, co tai them va xem ma giao dich, vi nhan, dia chi token.
- Khi phien het han, ca hai danh sach bi xoa; ma phien luu tren may cung duoc xoa.
- 108 kiem thu Flutter dat; flutter analyze khong bao loi.
- API Railway /api/v1/mobile/me dang tra 404 tai thoi diem kiem tra.
  Chua the ket luan luong mobile voi du lieu that da chay end-to-end.

### Thu tren dien thoai

1. Trien khai backend Phase 7 va kiem tra Flyway V4 thanh cong.
2. Goi /api/v1/mobile/me khi chua co token: phai tra 401, khong phai 404.
3. Cap ma phien bang script new-mobile-session.ps1 o tren cho dung nguoi nhan.
4. Mo Vi > Hoa don Devnet trong ban staging, nhap ma phien.
5. Kiem tra Hoa don va Giao dich: chi du lieu cua nguoi nhan duoc cap quyen.
6. Mo chi tiet giao dich va doi chieu signature voi giao dich Devnet tren web.
7. Thu hoi phien tren backend, bam Tai lai: danh sach phai bien mat.

Dang nhap nguoi dung that va tu dong gia han phien chua duoc trien khai.
Ma phien thu nghiem hien tai chi co quyen doc trong 8 gio.
