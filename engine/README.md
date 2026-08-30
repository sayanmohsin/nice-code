# Nice Code Engine

This is the Rust engine for Nice Code. Bun provides the user-facing launcher;
all source analysis runs in this engine.

Run it from this checkout:

```bash
cargo run --manifest-path engine/Cargo.toml -- \
  --project ../arqen \
  --all \
  --format agent
```

The engine scans JavaScript, TypeScript, Rust, Go, and Dart source files. It
supports text, JSON, SARIF, and agent output, plus the existing native-tool
checks in `--ci` mode.

The engine is currently used through the Bun launcher and is still being
qualified for cross-platform release distribution.
