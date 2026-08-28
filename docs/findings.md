# Findings and statuses

Each finding has a stable pattern ID, file, line, category, severity, message, and enforcement status.

| Status   | Meaning                                                           |
| -------- | ----------------------------------------------------------------- |
| `FAIL`   | High-confidence issue that may block according to project policy. |
| `WARN`   | Actionable concern that normally needs review.                    |
| `REVIEW` | Context is required; it should not fail CI automatically.         |
| `PASS`   | The relevant check ran without a finding.                         |
| `N/A`    | The check does not apply to the project or change.                |

Human output is readable and capped for full scans. Agent output is compact and defaults to `FAIL` and `WARN`. JSON and SARIF retain complete results unless filtering is explicitly requested.
