# FAQ

### Does Nice Code replace SonarQube or native linters?

No. Native tools remain authoritative for compilation, formatting, type checks, and standard lint rules.

### Does a full scan fail CI?

The recommended policy is advisory until a project has measured signal quality. Only high-confidence, new findings should become blocking rules.

### Does it require Bun?

The current development CLI uses Bun to launch the Rust engine. Users do not need Rust when using a prebuilt GitHub Release binary.

### Does it send source code over the network?

Normal checks are local and do not require network access.

### Is there one quality score?

No. Track open, new, resolved, repeated, review, false-positive, and evidence-backed findings instead.
