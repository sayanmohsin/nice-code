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

Exceptions and severity overrides apply to engine checks, packaged knowledge rules, and project
custom rules before baselines and exit decisions. Path ignores exclude files from every rule.
A nonempty `profiles` list replaces automatically detected profiles; see [profiles](/profiles).
