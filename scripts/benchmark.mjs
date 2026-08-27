#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { performance } from "node:perf_hooks";

function available(runtime) {
  try {
    execFileSync("which", [runtime], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const runtimes = ["node", ...(available("bun") ? ["bun"] : [])];
const command = "scripts/check.mjs";
const args = ["--project", "fixtures", "--all", "--format", "json"];
const iterations = 5;

for (const runtime of runtimes) {
  const samples = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    execFileSync(runtime, [command, ...args], { stdio: "ignore" });
    samples.push(performance.now() - start);
  }
  const average = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
  console.log(`${runtime}: average ${average.toFixed(2)} ms over ${iterations} runs`);
}
