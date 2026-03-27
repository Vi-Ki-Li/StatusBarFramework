# Result JSON Template

Save into `session-state/ui-test-results.json`.

```json
{
  "targetUrl": "http://localhost:8000",
  "timestamp": 1700000000000,
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
    "entryVisible": true,
    "modules": {
      "data-center": "pass",
      "data-studio": "pass",
      "style-workshop": "pass",
      "layout-composer": "pass",
      "system-config": "pass"
    }
  },
  "blockers": [],
  "notes": []
}
```
