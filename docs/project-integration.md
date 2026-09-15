# Project integration

Nice Code supports a direct checkout, Git submodule, or the public
`@sayanmohsin/nice-code` npm package. The npm launcher downloads the matching verified Rust binary, so users
do not need Bun, Cargo, or Rust installed.
Recommended project files are:

```text
.nice-code.json
AGENTS.md             # optional short routing note
DESIGN.md             # optional product-specific visual language
.nice-code/skills.lock.json # optional pinned project skills
.nice-code/checks.json       # optional project-owned deterministic rules
.nice-code/rules/*.md       # optional prose guidance plus declared rules
.nice-code/resources/*.md    # optional project context for agents/reviewers
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

Project checks use safe declarative rules and must use `CUSTOM-` IDs. Markdown skills can declare
checks in front matter, so teams do not need to hand-author JSON. Project resources are advisory
only and are never treated as part of Nice Code's package-owned knowledge base.
