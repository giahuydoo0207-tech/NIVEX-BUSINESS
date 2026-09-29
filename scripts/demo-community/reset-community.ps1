# Removes only the demo Community data created by seed-community.ps1: rows owned
# by or attached to profiles whose id starts with "nova-demo-". Nothing else is
# touched. Runs in one transaction.
#
# Usage:
#   $env:NOVA_SEED_DATABASE_URL = 'postgresql://USER:PASSWORD@localhost:5433/nova'
#   .\reset-community.ps1               # local database
#   .\reset-community.ps1 -AllowRemote  # required for any non-localhost database
param(
    [switch]$AllowRemote,
    [string]$Psql = 'psql'
)
$ErrorActionPreference = 'Stop'
$url = $env:NOVA_SEED_DATABASE_URL
if (-not $url) { throw 'Set NOVA_SEED_DATABASE_URL (postgresql://user:password@host:port/db).' }
$dbHost = ([uri]($url -replace '^postgres(ql)?://', 'http://')).Host
if ($dbHost -notin @('localhost', '127.0.0.1') -and -not $AllowRemote) {
    throw "Refusing to reset remote database '$dbHost' without -AllowRemote."
}

$sql = @"
-- Posts by demo authors; images, topics, reactions, comments, saves and hides cascade.
delete from community_posts where author_id like 'nova-demo-%';
-- Anything demo profiles left on other posts, and references to demo profiles.
delete from community_comment_likes where actor_id like 'nova-demo-%';
delete from community_comments where author_id like 'nova-demo-%';
delete from community_post_reactions where actor_id like 'nova-demo-%';
delete from community_saved_posts where actor_id like 'nova-demo-%';
delete from community_hidden_posts where actor_id like 'nova-demo-%';
delete from community_follows where actor_id like 'nova-demo-%' or followed_profile_id like 'nova-demo-%';
delete from community_blocks where actor_id like 'nova-demo-%' or blocked_profile_id like 'nova-demo-%';
delete from community_reports where reporter_id like 'nova-demo-%' or reported_profile_id like 'nova-demo-%';
delete from community_media where owner_id like 'nova-demo-%';
delete from community_profiles where id like 'nova-demo-%';
select count(*) as remaining_demo_profiles from community_profiles where id like 'nova-demo-%';
"@
$out = Join-Path $env:TEMP 'nova-demo-community-reset.sql'
[IO.File]::WriteAllText($out, $sql, (New-Object Text.UTF8Encoding($false)))
& $Psql --single-transaction -v ON_ERROR_STOP=1 -q -f $out $url
if ($LASTEXITCODE -ne 0) { throw "psql failed ($LASTEXITCODE); the transaction was rolled back." }
