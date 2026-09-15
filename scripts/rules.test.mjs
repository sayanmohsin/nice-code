import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { tmpdir } from "node:os";

const script = join(process.cwd(), "scripts", "rules.mjs");
const run = (args, cwd) => execFileSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });

test("rules helper initializes, validates, and compiles Markdown rules", () => {
  const project = mkdtempSync(join(tmpdir(), "nice-code-rules-"));
  run(["init", "--project", project], project);
  assert.match(run(["validate", "--project", project], project), /Validated 1 custom rule/);
  run(["compile", "--project", project, "--apply"], project);
  const generated = JSON.parse(readFileSync(join(project, ".nice-code", "checks.json"), "utf8"));
  assert.equal(generated.checks[0].id, "CUSTOM-TEAM-001");
  assert.match(run(["validate", "--project", project], project), /Validated 1 custom rule/);
});

test("rules helper rejects malformed custom rules", async () => {
  const project = mkdtempSync(join(tmpdir(), "nice-code-rules-invalid-"));
  execFileSync(process.execPath, [script, "init", "--project", project], { cwd: project });
  const path = join(project, ".nice-code", "rules", "team.md");
  await writeFile(path, (await readFile(path, "utf8")).replace("CUSTOM-TEAM-001", "TEAM-001"));
  assert.throws(() => run(["validate", "--project", project], project), /invalid custom id/);
});
