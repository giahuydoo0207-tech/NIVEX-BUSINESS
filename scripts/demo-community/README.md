# Demo Community posts

Seeds 10 Community posts (9 with images) plus reactions, comments and replies for
demo videos and screenshots. Data lives in the shared database, so Business Web and
Flutter show the same feed.

All rows belong to 10 demo profiles whose id starts with `nova-demo-`. They have no
login account and no talent profile, so they never appear in applications, Nhân sự,
invoices or wallets. Reset removes exactly these rows.

## Commands (PowerShell)

```powershell
$env:NOVA_SEED_DATABASE_URL = 'postgresql://USER:PASSWORD@HOST:PORT/DB'   # never commit this
.\seed-community.ps1  -Psql 'D:\Tools\PostgreSQL\16\bin\psql.exe'               # localhost only
.\seed-community.ps1  -Psql 'D:\Tools\PostgreSQL\16\bin\psql.exe' -AllowRemote  # e.g. Railway
.\seed-community.ps1  -DryRun                                                   # writes SQL only
.\reset-community.ps1 -Psql 'D:\Tools\PostgreSQL\16\bin\psql.exe' [-AllowRemote]
.\generate-illustrations.ps1   # re-draws p1, p8, p9, p10 and the avatars
```

Seeding is idempotent (fixed ids, `on conflict do nothing`) and runs in one
transaction. Comments by real users on demo posts are removed by reset together
with those posts.

## Image sources

| File | Source | License |
|---|---|---|
| p1-flutter-app.jpg, p8-sprint-board.jpg, p9-profile-checklist.jpg, p10-usdc-flow.jpg, avatars/*.png | Drawn by `generate-illustrations.ps1` | Project-owned |
| p2-wireframes.jpg | [Designer sketching Wireframes](https://commons.wikimedia.org/wiki/File:Designer_sketching_Wireframes_(Unsplash).jpg), Green Chameleon (Unsplash) | CC0 |
| p3-home-office.jpg | [Home-office-336377](https://commons.wikimedia.org/wiki/File:Home-office-336377.jpg), Free-Photos (Pixabay) | CC0 |
| p4-meeting-room.jpg | [Bright conference room](https://commons.wikimedia.org/wiki/File:Bright_conference_room_(Unsplash).jpg), Breather (Unsplash) | CC0 |
| p6-coding.jpg | [Pexels-luis-gomes-546819](https://commons.wikimedia.org/wiki/File:Pexels-luis-gomes-546819.jpg), Luis Gomes (Pexels) | CC0 |
| p7-typography.jpg | [Pencil-typography-black-design](https://commons.wikimedia.org/wiki/File:Pencil-typography-black-design.jpg), Karolina Grabowska (Pexels) | CC0 |

Photos were downloaded at 1280 px (127–146 KB) and are stored in the database, so
no external URL is needed at runtime.
