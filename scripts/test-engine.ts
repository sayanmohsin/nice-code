#!/usr/bin/env bun

const result = Bun.spawnSync(
  ["cargo", "test", "--manifest-path", "engine/Cargo.toml"],
  {
    stdout: "inherit",
    stderr: "inherit",
  },
);
process.exit(result.exitCode);
