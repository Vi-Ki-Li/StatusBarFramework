# Result JSON Template

Save into `session-state/ui-test-results.json`.

```json
{
  "targetUrl": "http://localhost:8000",
  "timestamp": 1700000000000,
  "mode": "module-deep",
  "depth": "deep",
  "target": "data-studio",
  "fixture": {
    "path": "docs/.local-data/dso-terminal-imports",
    "imported": true,
    "fallbackUsed": false
  },
  "capabilityMatrix": {
    "desktopExpected": true,
    "mobileExpected": false
  },
  "desktop": {
    "viewport": "1366x640",
    "entryVisible": true,
    "modules": {
      "data-center": "pass",
      "data-studio": "pass",
      "style-workshop": "pass",
      "layout-composer": "pass",
      "system-config": "pass"
    },
    "systemConfigSubmodules": {
      "raw-data": "pass",
      "theme-combo": "pass",
      "narrative-snapshot": "pass",
      "backup-migration": "pass",
      "guide": "pass"
    }
  },
  "mobile": {
    "viewport": "360x780",
    "entryVisible": false,
    "modules": {
      "data-center": "not-run",
      "data-studio": "not-run",
      "style-workshop": "not-run",
      "layout-composer": "not-run",
      "system-config": "not-run"
    }
  },
  "actionLogs": [
    {
      "step": 1,
      "action": "open data-studio and create one entry",
      "evidence": "session-state/skill-selftest/ui-validation/01-data-studio-create-after-desktop.png",
      "result": "pass",
      "findingType": "interaction",
      "note": "create/save succeeded and toast visible"
    }
  ],
  "findings": {
    "p0": [],
    "p1": [],
    "p2": []
  },
  "blockers": [],
  "notes": []
}
```
