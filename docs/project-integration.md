# Project integration

Nice Code supports a direct path, Git submodule, or npm package. Recommended project files are:

```text
.nice-code.json
AGENTS.md             # optional short routing note
package.json          # optional nice-code script
```

```json
{
  "scripts": {
    "nice-code": "bun ../nice-code/scripts/nice-code.ts --changed --project .",
    "nice-code:all": "bun ../nice-code/scripts/nice-code.ts --all --project ."
  }
}
```

Keep project-specific exceptions close to the project and make them as narrow as possible.
