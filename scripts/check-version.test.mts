import { afterEach, expect, test } from "bun:test";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fixtures: string[] = [];
afterEach(() => {
  for (const path of fixtures.splice(0)) rmSync(path, { recursive: true, force: true });
});

function check(lockVersion: string) {
  const root = mkdtempSync(join(tmpdir(), "nice-code-version-"));
  fixtures.push(root);
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "engine"));
  copyFileSync(join(import.meta.dir, "check-version.mts"), join(root, "scripts/check-version.mts"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ version: "0.3.3" }));
  writeFileSync(join(root, "engine/Cargo.toml"), '[package]\nname = "nice-code-engine"\nversion = "0.3.3"\n');
  writeFileSync(join(root, "engine/Cargo.lock"), `version = 4\n\n[[package]]\nname = "clap"\nversion = "4.6.10"\n\n[[package]]\nname = "nice-code-engine"\nversion = "${lockVersion}"\n`);
  writeFileSync(join(root, "SKILL.md"), "---\nversion: 0.3.3\n---\n");
  return Bun.spawnSync([process.execPath, join(root, "scripts/check-version.mts")], {
    env: { ...process.env, GITHUB_REF_NAME: "" },
    stdout: "pipe",
    stderr: "pipe",
  });
}

test("a release version bump accepts its synchronized Cargo lock entry", () => {
  const result = check("0.3.3");
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("Version contract passed: 0.3.3");
});

test("a release version bump rejects a stale Cargo lock entry", () => {
  const result = check("0.3.2");
  expect(result.exitCode).toBe(1);
  expect(result.stderr.toString()).toContain("engine/Cargo.lock is not synchronized");
});
