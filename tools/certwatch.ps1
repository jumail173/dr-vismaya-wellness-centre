# Watches the GitHub Pages certificate and flips https_enforced if it is ever issued.
# Read-only apart from that. Run:  powershell -ExecutionPolicy Bypass -File tools\certwatch.ps1
# Stop it by creating tools\certwatch.stop

$log = Join-Path $PSScriptRoot 'certwatch.log'
$stop = Join-Path $PSScriptRoot 'certwatch.stop'
$repo = 'jumail173/dr-vismaya-wellness-centre'
$host_ = 'www.drvismayawellness.com'
$deadline = (Get-Date).AddHours(72)
$lastState = ''
$approvedAt = ''

function Log($m) {
  Add-Content -LiteralPath $log -Value ("{0} {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m)
}

function Probe($h) {
  try {
    $c = New-Object Net.Sockets.TcpClient($h, 443)
    $ssl = New-Object Net.Security.SslStream($c.GetStream(), $false, ({ $true }))
    $ssl.AuthenticateAsClient($h)
    return $ssl.RemoteCertificate.Subject
  } catch { return "ERR: $($_.Exception.Message)" }
}

Log "=== cert watcher started (72h window, ends $deadline) ==="
Log "    read-only except for enabling https_enforced IF/when the cert is approved"
Log "    see HANDOFF.md - this is a safety net only, migration to Cloudflare is the plan"

while ((Get-Date) -lt $deadline) {
  if (Test-Path -LiteralPath $stop) { Log "stop flag found - exiting"; break }

  $j = gh api "repos/$repo/pages" 2>$null | ConvertFrom-Json
  if (-not $j) { Log "API poll failed (transient) - retrying"; Start-Sleep -Seconds 120; continue }
  $state = $j.https_certificate.state

  if ($state -ne $lastState) {
    Log ("STATE CHANGE -> cert={0} cname={1} build={2} enforced={3}" -f `
          $state, $j.cname, $j.status, $j.https_enforced)
    $lastState = $state
  }

  if ($state -eq 'approved') {
    if ($approvedAt) { Log "already handled - idle watch"; Start-Sleep -Seconds 900; continue }
    $approvedAt = (Get-Date).ToString('o')
    Log "certificate approved -> enabling HTTPS enforcement"
    for ($try = 1; $try -le 5; $try++) {
      $out = gh api -X PUT "repos/$repo/pages" -f "cname=$host_" -F https_enforced=true 2>&1 | Out-String
      if ($out -match 'https_enforced') { Log "enable https OK on try $try"; break }
      Log "enable https attempt $try failed: " + ($out -replace "`r?`n", ' | ').Trim()
      Start-Sleep -Seconds 30
    }
    Start-Sleep -Seconds 20
    $j2 = gh api "repos/$repo/pages" 2>$null | ConvertFrom-Json
    Log ("FINAL: cname={0} enforced={1} cert={2}" -f $j2.cname, $j2.https_enforced, $j2.https_certificate.state)
    Log "served-on-443: www=$(Probe $host_)"
    Log "=== cert watcher done (success) ==="
    break
  }

  Start-Sleep -Seconds 300
}

if ((Get-Date) -ge $deadline) { Log "=== 72h window elapsed ===" }
