# Project integration

Nice Code supports a direct checkout, Git submodule, or the public scoped npm
package. The npm launcher downloads the matching verified Rust binary, so users
do not need Bun, Cargo, or Rust installed.
Recommended project files are:

```text
.nice-code.json
AGENTS.md             # optional short routing note
package.json          # optional nice-code script
```

```json
{
  "scripts": {
    "nice-code": "node ../nice-code/scripts/nice-code.mjs --changed --project .",
    "nice-code:all": "node ../nice-code/scripts/nice-code.mjs --all --project ."
  }
}
```

Keep project-specific exceptions close to the project and make them as narrow as possible.
