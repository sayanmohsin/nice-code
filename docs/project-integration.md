# Project integration

Nice Code currently supports a direct checkout or Git submodule. npm
distribution is planned after the binary release contract is stable.
Recommended project files are:

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
