param(
  [string]$Source = "",
  [string]$BackupRoot = ""
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

if ([string]::IsNullOrWhiteSpace($Source)) {
  $Source = Join-Path $repoRoot "prisma\\dev.db"
}

if ([string]::IsNullOrWhiteSpace($BackupRoot)) {
  $BackupRoot = Join-Path $repoRoot "backups\\database"
}

if (-Not (Test-Path $Source)) {
  Write-Error "Database not found at $Source"
  exit 1
}

$snapshotFolder = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$targetDir = Join-Path $BackupRoot $snapshotFolder
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

$destination = Join-Path $targetDir "dev.db"
Copy-Item -Path $Source -Destination $destination -Force
Write-Output "Backup complete: $destination"

$backupDirs = Get-ChildItem -Path $BackupRoot -Directory | Sort-Object LastWriteTime -Descending
if ($backupDirs.Count -gt 10) {
  $toDelete = $backupDirs | Select-Object -Skip 10
  foreach ($dir in $toDelete) {
    Remove-Item -Path $dir.FullName -Recurse -Force
    Write-Output "Pruned old backup: $($dir.FullName)"
  }
}
