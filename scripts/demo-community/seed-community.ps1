# Seeds exactly 10 demo Community posts (with images, reactions, comments and
# replies) into the shared Nova database in one transaction.
#
# All demo rows hang off community profiles whose id starts with "nova-demo-".
# Those profiles have no login account and no talent profile, so they never
# appear in applications, Nhân sự, invoices or wallets. Re-running is safe:
# every row has a fixed id and is inserted with "on conflict do nothing".
#
# Usage:
#   $env:NOVA_SEED_DATABASE_URL = 'postgresql://USER:PASSWORD@localhost:5433/nova'
#   .\seed-community.ps1               # local database
#   .\seed-community.ps1 -AllowRemote  # required for any non-localhost database
#   .\seed-community.ps1 -DryRun       # only writes the SQL file
param(
    [switch]$AllowRemote,
    [switch]$DryRun,
    [string]$Psql = 'psql'
)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = $env:NOVA_SEED_DATABASE_URL
if (-not $DryRun) {
    if (-not $url) { throw 'Set NOVA_SEED_DATABASE_URL (postgresql://user:password@host:port/db).' }
    $dbHost = ([uri]($url -replace '^postgres(ql)?://', 'http://')).Host
    if ($dbHost -notin @('localhost', '127.0.0.1') -and -not $AllowRemote) {
        throw "Refusing to seed remote database '$dbHost' without -AllowRemote."
    }
}

$data = Get-Content (Join-Path $here 'seed-data.json') -Raw -Encoding UTF8 | ConvertFrom-Json
function Hex([string]$path) { [BitConverter]::ToString([IO.File]::ReadAllBytes($path)).Replace('-', '') }
function Lit([string]$value) { '$nova$' + $value + '$nova$' }

$sql = New-Object Text.StringBuilder
[void]$sql.AppendLine('set client_encoding = ''UTF8'';')

foreach ($p in $data.profiles) {
    $avatar = Join-Path $here "avatars\$($p.id).png"
    [void]$sql.AppendLine("insert into community_profiles (id, kind, display_name, handle, headline, bio, avatar_url, avatar_content_type, avatar_content) values ('$($p.id)', 'FREELANCER', $(Lit $p.name), '$($p.handle)', $(Lit $p.headline), $(Lit $p.bio), '/api/v1/profile/$($p.id)/avatar?v=1', 'image/png', decode('$(Hex $avatar)', 'hex')) on conflict (id) do nothing;")
}

foreach ($post in $data.posts) {
    $created = "now() - interval '$($post.hoursAgo) hours'"
    [void]$sql.AppendLine("insert into community_posts (id, author_id, content, privacy, created_at, updated_at) values ('$($post.id)', '$($post.author)', $(Lit $post.content), 'PUBLIC', $created, $created) on conflict (id) do nothing;")
    if ($post.image) {
        $file = Join-Path $here "images\$($post.image.file)"
        [void]$sql.AppendLine("insert into community_media (id, owner_id, content_type, content) values ('$($post.image.mediaId)', '$($post.author)', 'image/jpeg', decode('$(Hex $file)', 'hex')) on conflict (id) do nothing;")
        [void]$sql.AppendLine("insert into community_post_images (id, post_id, image_url, sort_order) values ('$($post.image.rowId)', '$($post.id)', '/media/community/$($post.image.mediaId)', 0) on conflict do nothing;")
    }
    $i = 0
    foreach ($r in $post.reactions) {
        [void]$sql.AppendLine("insert into community_post_reactions (post_id, actor_id, reaction_type, created_at) values ('$($post.id)', '$($r[0])', '$($r[1])', $created + interval '$(5 + 7 * $i) minutes') on conflict do nothing;")
        $i++
    }
    # Parents are listed before their replies in seed-data.json.
    foreach ($c in $post.comments) {
        $at = "$created + interval '$($c.minutesAfter) minutes'"
        $parent = if ($c.parent) { "'$($c.parent)'" } else { 'null' }
        [void]$sql.AppendLine("insert into community_comments (id, post_id, parent_comment_id, author_id, content, created_at, updated_at) values ('$($c.id)', '$($post.id)', $parent, '$($c.author)', $(Lit $c.content), $at, $at) on conflict (id) do nothing;")
        foreach ($r in @($c.reactions | Where-Object { $_ })) {
            [void]$sql.AppendLine("insert into community_comment_likes (comment_id, actor_id, reaction_type) values ('$($c.id)', '$($r[0])', '$($r[1])') on conflict do nothing;")
        }
    }
}

[void]$sql.AppendLine("select p.id, a.display_name as author, left(replace(p.content, E'\n', ' '), 48) as preview, coalesce(i.image_url, '(không ảnh)') as image, (select count(*) from community_post_reactions r where r.post_id = p.id) as reactions, (select count(*) from community_comments c where c.post_id = p.id and c.deleted_at is null) as comments, (select count(*) from community_comments c where c.post_id = p.id and c.parent_comment_id is not null) as replies from community_posts p join community_profiles a on a.id = p.author_id left join community_post_images i on i.post_id = p.id where p.author_id like 'nova-demo-%' and p.deleted_at is null order by p.created_at desc;")

$out = Join-Path $env:TEMP 'nova-demo-community-seed.sql'
[IO.File]::WriteAllText($out, $sql.ToString(), (New-Object Text.UTF8Encoding($false)))
Write-Host "SQL written to $out ($([int]((Get-Item $out).Length / 1KB)) KB)"
if ($DryRun) { return }

$env:PGCLIENTENCODING = 'UTF8'
& $Psql --single-transaction -v ON_ERROR_STOP=1 -q -f $out $url
if ($LASTEXITCODE -ne 0) { throw "psql failed ($LASTEXITCODE); the transaction was rolled back." }
