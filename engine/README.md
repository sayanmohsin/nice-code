# Nice Code Engine

This is the Rust engine for Nice Code. A Node-compatible launcher provides the
user-facing command; all source analysis runs in this engine.

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

The engine is normally used through the Node-compatible launcher. Tagged GitHub Releases
build verified binaries for supported platforms; npm distribution is deferred
until that binary contract is stable.
