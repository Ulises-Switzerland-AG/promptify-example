<#
.SYNOPSIS
  Sets up the local Promptify environment against an already installed SQL Server (Express or not).

.DESCRIPTION
  1. Checks that sqlcmd and node/npm are installed.
  2. For a SQL Server installed on this machine, makes sure it is reachable by the app: TCP/IP enabled on a static port,
     mixed-mode authentication (the app uses SQL logins) and the service running. Changes are applied only when
     something is missing, which requires running the script as Administrator. SQL Server Browser is not needed.
  3. Creates the application, integration and e2e databases and the two least-privilege logins (promptify_migrator = DDL, promptify_app = CRUD).
  4. Creates/updates .env (existing values and passwords are preserved; missing ones are generated).
  5. Applies the Prisma migrations and seeds the first Administrator.
  6. Loads test data (Users, Categories and Prompts).
  The script is idempotent: it can be run again at any time.

.PARAMETER Server
  Host of the SQL Server. Default: localhost.

.PARAMETER Port
  TCP port. Default: 1433. Ignored when a local SQL Server instance is detected (its static port is used) or -Instance is set.

.PARAMETER Instance
  Named instance (e.g. SQLEXPRESS). Detected automatically when this machine has a single instance and no -Port is given.
  For a local instance the script connects through its static TCP port; for a remote server the instance name is used.

.PARAMETER SkipSqlServerConfig
  Do not inspect or change the configuration of the local SQL Server.

.PARAMETER Database
  Application database name. Default: promptify.

.PARAMETER SqlAdminUser / SqlAdminPassword
  SQL administrator (sysadmin) credentials. When omitted, Windows authentication is used.

.PARAMETER SkipTestData
  Do not load test data.

.PARAMETER Integration
  Also provision the throwaway database used by `npm run test:integration` (requires -Database promptify).

.PARAMETER E2e
  Also provision the throwaway database used by `npm run test:e2e` (requires -Database promptify).

.EXAMPLE
  .\scripts\setup-local.ps1
  .\scripts\setup-local.ps1 -Instance SQLEXPRESS
  .\scripts\setup-local.ps1 -SqlAdminUser sa -SqlAdminPassword '...' -Integration
#>
[CmdletBinding()]
param(
  [string]$Server = "localhost",
  [int]$Port = 1433,
  [string]$Instance,
  [string]$Database = "promptify",
  [string]$SqlAdminUser,
  [string]$SqlAdminPassword,
  [switch]$SkipSqlServerConfig=$false,
  [switch]$SkipTestData=$false,
  [switch]$Integration=$true,
  [switch]$E2e=$true
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot ".env"
$sqlDir = Join-Path $PSScriptRoot "local"

function Write-Step($message) { Write-Host "==> $message" -ForegroundColor Cyan }

function Assert-Command($name, $hint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "'$name' not found. $hint" }
}

function New-Secret([int]$length = 32) {
  $alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789".ToCharArray()
  $bytes = New-Object byte[] $length
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  -join ($bytes | ForEach-Object { $alphabet[$_ % $alphabet.Length] })
}

function Read-DotEnv($path) {
  $values = [ordered]@{}
  if (Test-Path $path) {
    foreach ($line in Get-Content $path) {
      if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') { $values[$Matches[1]] = $Matches[2].Trim() }
    }
  }
  $values
}

function Get-UrlPassword($url, $login) {
  if ($url -match "user=$login;password=([A-Za-z0-9]+)") { return $Matches[1] }
}

# Runs sqlcmd; -b makes SQL errors fail the script. Extra arguments are passed through.
function Invoke-Sql([string]$login, [string]$password, [string]$file, [hashtable]$variables, [string]$targetDatabase = "master") {
  $arguments = @("-S", $sqlTarget, "-C", "-b", "-f", "65001", "-d", $targetDatabase, "-i", $file)
  if ($login) { $arguments += @("-U", $login, "-P", $password) } else { $arguments += "-E" }
  if ($variables.Count -gt 0) {
    $arguments += "-v"
    $arguments += $variables.GetEnumerator() | ForEach-Object {     "$($_.Key)=`"$($_.Value)`"" }
  }
  & sqlcmd @arguments
  if ($LASTEXITCODE -ne 0) { throw "sqlcmd failed for $(Split-Path $file -Leaf) (exit code $LASTEXITCODE)." }
}

function New-DatabaseUrl($login, $password, $databaseName) {
  $location = if ($Instance) { "$Server;instanceName=$Instance" } else { "${Server}:$Port" }
  "sqlserver://$location;database=$databaseName;user=$login;password=$password;encrypt=true;trustServerCertificate=true"
}

function Test-LocalServer {
  $Server -in @("localhost", ".", "(local)", "127.0.0.1", $env:COMPUTERNAME)
}

function Assert-Administrator($reason) {
  $principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "The local SQL Server needs changes ($reason). Run this script again from a terminal opened as Administrator."
  }
}

# SQL Server instances installed on this machine, read from the registry.
function Get-LocalSqlInstances {
  $key = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL"
  if (-not (Test-Path $key)) { return @() }
  $names = (Get-ItemProperty $key).PSObject.Properties | Where-Object { $_.Name -notlike "PS*" }
  @($names | ForEach-Object {
    $root = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\$($_.Value)\MSSQLServer"
    [pscustomobject]@{
      Name = $_.Name
      Root = $root
      Service = if ($_.Name -eq "MSSQLSERVER") { "MSSQLSERVER" } else { "MSSQL`$$($_.Name)" }
      StaticPort = (Get-ItemProperty "$root\SuperSocketNetLib\Tcp\IPAll").TcpPort
    }
  })
}

# Makes a local instance usable by the app (TCP/IP on a static port, mixed mode, running) and returns its TCP port.
function Initialize-LocalSqlInstance($instance, [int]$defaultPort, $otherInstances) {
  $tcpKey = "$($instance.Root)\SuperSocketNetLib\Tcp"
  $ipAllKey = "$tcpKey\IPAll"
  $port = $instance.StaticPort
  $needsPort = -not $port
  if ($needsPort) {
    $port = $defaultPort
    if ($otherInstances | Where-Object { $_.StaticPort -eq "$port" }) {
      throw "Instance '$($instance.Name)' has no static TCP port and port $port is used by another instance. Configure a free port in SQL Server Configuration Manager."
    }
  }

  $changes = @()
  if ((Get-ItemProperty $tcpKey).Enabled -ne 1) { $changes += "enable TCP/IP" }
  if ($needsPort) { $changes += "set static TCP port $port" }
  if ((Get-ItemProperty $instance.Root).LoginMode -ne 2) { $changes += "enable mixed-mode authentication" }
  $needsRestart = $changes.Count -gt 0
  $service = Get-Service $instance.Service
  $needsStart = $service.Status -ne "Running"

  if ($needsRestart -or $needsStart) {
    $summary = (@($changes) + $(if ($needsStart) { "start service" })) -join ", "
    Assert-Administrator $summary
    Write-Host "Configuring SQL Server instance '$($instance.Name)': $summary."
    Set-ItemProperty $tcpKey -Name Enabled -Value 1
    Set-ItemProperty $ipAllKey -Name TcpPort -Value "$port"
    Set-ItemProperty $ipAllKey -Name TcpDynamicPorts -Value ""
    Set-ItemProperty $instance.Root -Name LoginMode -Value 2
    if ($needsRestart -and -not $needsStart) { Restart-Service $instance.Service -Force } else { Start-Service $instance.Service }
  }
  [int]$port
}

Set-Location $repoRoot
$adminLogin = if ($SqlAdminUser) { $SqlAdminUser } else { $null }

Write-Step "Checking prerequisites"
Assert-Command sqlcmd "Install the SQL Server command-line tools (sqlcmd)."
Assert-Command node "Install Node.js."
Assert-Command npm "Install Node.js."
if ($Database -notmatch '^[A-Za-z0-9_]+$') { throw "Database name may only contain letters, digits and underscores." }
if ($Integration -and $Database -ne "promptify") { throw "-Integration requires -Database promptify (tests/integration/provision.sql is fixed)." }
if ($E2e -and $Database -ne "promptify") { throw "-E2e requires -Database promptify (tests/e2e/provision.sql is fixed)." }

if (-not $SkipSqlServerConfig -and (Test-LocalServer)) {
  $instances = @(Get-LocalSqlInstances)
  $selected = $null
  if ($Instance) {
    $selected = $instances | Where-Object { $_.Name -eq $Instance }
  } elseif (-not $PSBoundParameters.ContainsKey("Port")) {
    $selected = $instances | Where-Object { $_.Name -eq "MSSQLSERVER" }
    if (-not $selected -and $instances.Count -eq 1) { $selected = $instances[0] }
    if (-not $selected -and $instances.Count -gt 1) {
      throw "Several SQL Server instances found ($($instances.Name -join ', ')). Pass -Instance <name>."
    }
  }
  if ($selected) {
    Write-Step "Checking local SQL Server instance '$($selected.Name)'"
    $others = @($instances | Where-Object { $_.Name -ne $selected.Name })
    $Port = Initialize-LocalSqlInstance $selected $Port $others
    $Instance = $null
  }
}
$sqlTarget = if ($Instance) { "$Server\$Instance" } else { "$Server,$Port" }

$probe = Join-Path $env:TEMP "promptify-probe.sql"
Set-Content -Path $probe -Value "SELECT @@VERSION;" -Encoding ASCII
try {
  Invoke-Sql $adminLogin $SqlAdminPassword $probe @{} | Out-Null
} catch {
  throw "Cannot connect to SQL Server at '$sqlTarget'. Check that the service is running, TCP/IP is enabled (SQL Server Configuration Manager) and, for named instances, pass -Instance. $($_.Exception.Message)"
} finally {
  Remove-Item $probe -ErrorAction SilentlyContinue
}

Write-Step "Preparing .env"
$dotEnv = Read-DotEnv $envPath
$appPassword = Get-UrlPassword $dotEnv["DATABASE_URL"] "promptify_app"
if (-not $appPassword) { $appPassword = New-Secret }
$migratorPassword = Get-UrlPassword $dotEnv["MIGRATION_DATABASE_URL"] "promptify_migrator"
if (-not $migratorPassword) { $migratorPassword = New-Secret }

$adminOid = $dotEnv["FIRST_ADMINISTRATOR_OID"]
if (-not $adminOid) { $adminOid = [guid]::NewGuid().ToString() }
$adminOid = $adminOid.ToLowerInvariant()
$devName = if ($dotEnv["PROMPTIFY_DEV_USER_NAME"]) { $dotEnv["PROMPTIFY_DEV_USER_NAME"] } else { "Dev User" }
if ($devName -notmatch "^[A-Za-z0-9 ._-]+$") { throw "PROMPTIFY_DEV_USER_NAME may only contain letters, digits, spaces, '.', '_' and '-'." }

$dotEnv["DATABASE_URL"] = New-DatabaseUrl "promptify_app" $appPassword $Database
$dotEnv["MIGRATION_DATABASE_URL"] = New-DatabaseUrl "promptify_migrator" $migratorPassword $Database
if (-not $dotEnv.Contains("APPLICATIONINSIGHTS_CONNECTION_STRING")) { $dotEnv["APPLICATIONINSIGHTS_CONNECTION_STRING"] = "" }
$dotEnv["FIRST_ADMINISTRATOR_OID"] = $adminOid
$dotEnv["PROMPTIFY_DEV_USER_OID"] = $adminOid
$dotEnv["PROMPTIFY_DEV_USER_NAME"] = $devName
$dotEnv["NODE_ENV"] = "development"

$envText = ($dotEnv.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "`n"
[System.IO.File]::WriteAllText($envPath, "$envText`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Host ".env written (secrets are not printed)."

Write-Step "Provisioning database '$Database' and logins"
Invoke-Sql $adminLogin $SqlAdminPassword (Join-Path $sqlDir "provision.sql") @{
  Database = $Database
  MigratorPassword = $migratorPassword
  AppPassword = $appPassword
}

if ($Integration) {
  Write-Step "Provisioning integration database 'promptify_integration'"
  Invoke-Sql $adminLogin $SqlAdminPassword (Join-Path $repoRoot "tests\integration\provision.sql") @{}
}

if ($E2e) {
  Write-Step "Provisioning e2e database 'promptify_e2e'"
  Invoke-Sql $adminLogin $SqlAdminPassword (Join-Path $repoRoot "tests\e2e\provision.sql") @{}
}

Write-Step "Applying migrations"
$env:MIGRATION_DATABASE_URL = $dotEnv["MIGRATION_DATABASE_URL"]
& npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "prisma migrate deploy failed." }

Write-Step "Seeding first Administrator ($adminOid)"
& npm run db:seed
if ($LASTEXITCODE -ne 0) { throw "db:seed failed." }

if (-not $SkipTestData) {
  Write-Step "Loading test data"
  Invoke-Sql "promptify_app" $appPassword (Join-Path $sqlDir "seed-test-data.sql") @{
    AdminOid = $adminOid
    AdminName = $devName
  } $Database
}

Write-Host ""
Write-Host "Done. Start the app with: npm run dev  (signed in as '$devName', oid $adminOid, Administrator)" -ForegroundColor Green
