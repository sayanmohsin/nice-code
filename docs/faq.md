# FAQ

### Does Nice Code replace SonarQube or native linters?

No. Native tools remain authoritative for compilation, formatting, type checks, and standard lint rules.

### Does a full scan fail CI?

The recommended policy is advisory until a project has measured signal quality. Only high-confidence, new findings should become blocking rules.

### Does it require Bun?

No. The GitHub-checkout launcher uses Node.js, and users can also run the
prebuilt Rust GitHub Release binary directly. Bun is only used for repository
development utilities. The public npm package provides the same launcher and
requires only Node.js on the user's machine.

### Does it send source code over the network?

Normal checks are local and do not require network access.

### Is there one quality score?

No. Track open, new, resolved, repeated, review, false-positive, and evidence-backed findings instead.
