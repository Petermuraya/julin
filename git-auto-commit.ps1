$ErrorActionPreference = 'Stop'
$lines = git status --porcelain
if (-not $lines) {
  Write-Output "No changes to commit"
  exit 0
}
foreach ($line in $lines) {
  if ($line.Length -lt 4) { continue }
  $status = $line.Substring(0,2).Trim()
  $path = $line.Substring(3).Trim()
  Write-Output "----`nProcessing: $status $path"
  try {
    if ($status -match 'D') {
      git rm -- "$path" 2>$null
      try { git commit -m "chore: remove $path" --quiet } catch { Write-Output ("Commit failed for {0}: {1}" -f $path, $_.Exception.Message) }
    } else {
      git add -- "$path"
      try { git commit -m "chore: update $path" --quiet } catch { Write-Output ("Commit failed for {0}: {1}" -f $path, $_.Exception.Message) }
    }
  } catch {
    Write-Output ("Error processing {0}: {1}" -f $path, $_.Exception.Message)
  }
}
Write-Output "Remaining status:"
git status --porcelain
