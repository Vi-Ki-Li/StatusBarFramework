$ErrorActionPreference = 'Stop'

$workspaceOnlyPrefixes = @(
  'docs/.local-data/',
  'session-state/'
)

$reservedNamePatterns = @(
  '(?i)local-only',
  '(?i)workspace-only',
  '(?i)no-publish',
  '(?i)do-not-commit'
)

$raw = git diff --cached --name-only --diff-filter=ACMR
if (-not $raw) {
  exit 0
}

$staged = @($raw | ForEach-Object { $_.Trim().Replace('\', '/') } | Where-Object { $_ })
$blocked = @()

foreach ($file in $staged) {
  $isWorkspaceOnlyPath = $false
  foreach ($prefix in $workspaceOnlyPrefixes) {
    if ($file.StartsWith($prefix)) {
      $isWorkspaceOnlyPath = $true
      break
    }
  }

  $hasReservedName = $false
  if (-not $isWorkspaceOnlyPath) {
    foreach ($pattern in $reservedNamePatterns) {
      if ($file -match $pattern) {
        $hasReservedName = $true
        break
      }
    }
  }

  if ($isWorkspaceOnlyPath -or $hasReservedName) {
    $blocked += $file
  }
}

if ($blocked.Count -eq 0) {
  exit 0
}

Write-Host ""
Write-Host "[guard:fixtures] Blocked commit: workspace-only artifacts detected in staged files." -ForegroundColor Red
Write-Host ""
$blocked | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
Write-Host ""
Write-Host "How to proceed:" -ForegroundColor Cyan
Write-Host "1) Keep workspace-only data under docs/.local-data/ or session-state/."
Write-Host "2) Publish-ready fixtures should stay under docs/test-data/public-fixtures/."
Write-Host "3) If staged by mistake, run: git restore --staged <path>."
Write-Host ""
exit 1
