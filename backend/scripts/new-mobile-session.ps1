#requires -Version 7.2
param(
    [Parameter(Mandatory)][Guid]$OrganizationId,
    [Parameter(Mandatory)][ValidateLength(1,120)][string]$ContractorId,
    [string]$Psql = 'psql'
)
$ErrorActionPreference = 'Stop'
$sessionBytes = [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)
$sessionToken = [Convert]::ToBase64String($sessionBytes).TrimEnd('=').Replace('+','-').Replace('/','_')
$sessionHash = [Convert]::ToHexString(
    [System.Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($sessionToken))
).ToLowerInvariant()
$sessionSql = @'
insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at)
values (:'token_hash', :'organization_id'::uuid, :'contractor_id', now()+interval '8 hours');
'@
$sessionSql | & $Psql -X --set=ON_ERROR_STOP=1 "--set=token_hash=$sessionHash" "--set=organization_id=$OrganizationId" "--set=contractor_id=$ContractorId"
if ($LASTEXITCODE -ne 0) { throw 'Session creation failed.' }
Write-Host 'Temporary read-only session (expires in 8 hours):'
Write-Output $sessionToken
