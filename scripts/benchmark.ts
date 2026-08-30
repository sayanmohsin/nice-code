#!/usr/bin/env bun

import { dirname, join, resolve } from "node:path";

const projectIndex = process.argv.indexOf("--project");
const project =
  projectIndex >= 0
    ? (process.argv[projectIndex + 1] ?? "fixtures")
    : "fixtures";
const root = resolve(dirname(import.meta.dir));
const suffix = process.platform === "win32" ? ".exe" : "";
const engine = join(
  root,
  "engine",
  "target",
  "release",
  `nice-code-engine${suffix}`,
);
const command = [engine, "--project", project, "--all", "--format", "json"];
const samples: number[] = [];

for (let index = 0; index < 20; index += 1) {
  const start = performance.now();
  const result = Bun.spawnSync(command, {
    stdout: "ignore",
    stderr: "inherit",
  });
  if (result.exitCode !== 0) process.exit(result.exitCode);
  samples.push(performance.now() - start);
}

const sorted = [...samples].sort((a, b) => a - b);
const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
console.log(
  JSON.stringify(
    {
      engine: "rust-release",
      project: resolve(project),
      runs: samples.length,
      averageMs: Number(average.toFixed(2)),
      medianMs: Number(((sorted[9] + sorted[10]) / 2).toFixed(2)),
      p95Ms: Number(sorted[18].toFixed(2)),
      minMs: Number(sorted[0].toFixed(2)),
      maxMs: Number(sorted[19].toFixed(2)),
    },
    null,
    2,
  ),
);
