# Chrome Connect Playbook

## Preferred path

Use fixed debug port `9222` first.

Windows command:

```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug"
```

Connectivity checks:

1. Port is listening: `127.0.0.1:9222`
2. `http://127.0.0.1:9222/json/version` returns `200`
3. response contains `webSocketDebuggerUrl`

## If dynamic port is shown

When browser shows `Server running at: 127.0.0.1:<port>`, use that dynamic port first.
Do not treat `/json/version` `404` as guaranteed failure before checking MCP connection.

## Hard reset flow

```powershell
$pids=(Get-Process chrome -ErrorAction SilentlyContinue).Id
if ($pids) { Stop-Process -Id $pids -Force }
$chromePath='C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chromePath)) { $chromePath="$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe" }
$profile='C:\temp\chrome-mcp-profile'
New-Item -ItemType Directory -Force -Path $profile | Out-Null
Start-Process -FilePath $chromePath -ArgumentList "--user-data-dir=$profile --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --remote-allow-origins=* --new-window http://localhost:8000"
Invoke-WebRequest -Uri 'http://127.0.0.1:9222/json/version' -UseBasicParsing
```

## Common failure labels

- `PORT_UNAVAILABLE`
- `VERSION_ENDPOINT_FAIL`
- `MCP_ATTACH_FAIL`
- `PAGE_NOT_READY`

Always output at least one label when blocked.
