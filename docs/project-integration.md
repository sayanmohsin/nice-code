# Project integration

Nice Code supports a direct checkout, Git submodule, or the public scoped npm
package. The npm launcher downloads the matching verified Rust binary, so users
do not need Bun, Cargo, or Rust installed.
Recommended project files are:

```text
.nice-code.json
AGENTS.md             # optional short routing note
DESIGN.md             # optional product-specific visual language
.nice-code/skills.lock.json # optional pinned project skills
package.json          # optional nice-code script
```

```json
{
  "scripts": {
    "nice-code": "nice-code --changed --project .",
    "nice-code:all": "nice-code --all --project ."
  }
}
```

Keep project-specific exceptions close to the project and make them as narrow as possible.
Keep product-specific design decisions in `DESIGN.md`. Nice Code's bundled
skills provide reusable agent guidance; they do not replace a project's own
visual identity.
