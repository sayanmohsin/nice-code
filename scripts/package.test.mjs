import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { tmpdir } from "node:os";

const root = resolve(new URL("..", import.meta.url).pathname);
const engine = join(root, "engine", "target", "debug", "nice-code-engine");

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

test("packed scoped npm package works in a consumer project", () => {
  const workspace = mkdtempSync(join(tmpdir(), "nice-code-package-"));
  const packageDir = join(workspace, "package");
  const consumer = join(workspace, "consumer");
  const project = join(workspace, "fixture");
  mkdirSync(packageDir, { recursive: true });
  mkdirSync(project, { recursive: true });
  mkdirSync(join(project, ".nice-code", "rules"), { recursive: true });
  mkdirSync(join(project, ".nice-code", "resources"), { recursive: true });
  const npmEnv = { ...process.env, npm_config_cache: join(workspace, "npm-cache") };

  const packed = JSON.parse(
    run("npm", ["pack", "--json", "--pack-destination", packageDir], { env: npmEnv }),
  )[0];
  assert.equal(packed.name, "@sayanmohsin/nice-code");
  assert.equal(packed.version, "0.2.1");

  run("npm", [
    "install",
    "--prefix",
    consumer,
    "--no-package-lock",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    join(packageDir, packed.filename),
  ], { env: npmEnv });

  writeFileSync(join(project, "App.java"), "class App { String value = \"legacy\"; }\n");
  writeFileSync(
    join(project, ".nice-code.json"),
    JSON.stringify({ profiles: ["default", "java"] }, null, 2),
  );
  writeFileSync(
    join(project, ".nice-code", "rules", "security.md"),
    "---\nid: team-security\nchecks:\n  - id: CUSTOM-ACME-001\n    title: Avoid legacy marker\n    matcher: legacy\n    severity: warning\n    status: warning\n    message: Remove the legacy marker.\n---\n",
  );
  writeFileSync(
    join(project, ".nice-code", "checks.json"),
    JSON.stringify({
      checks: [{
        id: "CUSTOM-ACME-002",
        title: "Avoid String marker",
        matcher: "String",
        severity: "warning",
        status: "warning",
        message: "Review this String marker.",
        extensions: ["java"],
        appliesTo: ["java"],
      }],
    }, null, 2),
  );
  writeFileSync(join(project, ".nice-code", "resources", "architecture.md"), "Advisory architecture context.\n");

  const installed = join(consumer, "node_modules", ".bin", "nice-code");
  const localEngineEnv = { ...process.env, NICE_CODE_ENGINE: engine };
  const help = execFileSync(installed, ["--help"], {
    encoding: "utf8",
    env: localEngineEnv,
  });
  assert.match(help, /Nice Code|Usage|USAGE/);

  const report = JSON.parse(
    execFileSync(installed, ["--all", "--project", project, "--format", "json"], {
      cwd: root,
      encoding: "utf8",
      env: localEngineEnv,
    }),
  );
  assert.equal(report.summary.warn, 2);
  assert.ok(report.findings.some((finding) => finding.id === "CUSTOM-ACME-001"));
  assert.ok(report.findings.some((finding) => finding.id === "CUSTOM-ACME-002"));
  assert.deepEqual(report.activeProfiles, ["default", "java"]);
  assert.deepEqual(report.projectResources, [".nice-code/resources/architecture.md"]);
  assert.equal(readFileSync(join(project, "App.java"), "utf8").includes("legacy"), true);
  assert.match(
    execFileSync(installed, ["rules", "validate", "--project", project], {
      encoding: "utf8",
      env: localEngineEnv,
    }),
    /Validated 2 custom rule/,
  );
});
