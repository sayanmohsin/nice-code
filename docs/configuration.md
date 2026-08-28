# Configuration

Create `.nice-code.json` at the project root when defaults need to be adjusted:

```json
{
  "profiles": ["typescript", "react"],
  "ignore": ["vendor/**", "generated/**"],
  "severity": { "AP-LOG-001": "review" },
  "exceptions": [
    {
      "patternId": "AP-SEC-001",
      "path": "fixtures/example.ts",
      "reason": "Synthetic token used only by a deterministic fixture."
    }
  ]
}
```

Exceptions should suppress one known finding, not an entire category or directory. Keep the reason specific and review it during audits.
