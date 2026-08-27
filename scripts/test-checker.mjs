#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runChecks } from "./check.mjs";

const project = join(process.cwd(), "fixtures");
const report = runChecks({ project, mode: "all" });
const ids = new Set(report.findings.map((finding) => finding.id));

assert(ids.has("AP-LOG-001"), "secret-bearing logging should be detected");
assert(ids.has("AP-SEC-001"), "hardcoded secrets should be detected");
assert(ids.has("AP-ERR-001"), "empty catches should be detected");
assert(ids.has("AP-ASYNC-001"), "likely sequential awaits should be reviewed");
assert(ids.has("AP-PERF-001"), "chained collection passes should be reviewed");
assert(!report.findings.some((finding) => finding.file === "good.ts"), "good fixture should be clean");
assert(!report.findings.some((finding) => finding.file === "ambiguous.ts" && finding.id === "AP-ASYNC-001"), "dependent awaits should not be flagged as independent");

const configuredProject = mkdtempSync(join(tmpdir(), "nice-code-test-"));
writeFileSync(join(configuredProject, ".nice-code.json"), JSON.stringify({
  ignore: ["ignored.ts"],
  exceptions: [{ id: "AP-SEC-001", file: "bad.ts", reason: "fixture exception" }],
}));
writeFileSync(join(configuredProject, "ignored.ts"), "const password = 'secret';\n");
writeFileSync(join(configuredProject, "bad.ts"), "const password = 'secret';\n");
const configuredReport = runChecks({ project: configuredProject, mode: "all" });
assert.equal(configuredReport.findings.length, 0, "config ignores and exceptions should be precise");

const workspaceProject = mkdtempSync(join(tmpdir(), "nice-code-workspace-"));
writeFileSync(join(workspaceProject, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
const workspaceApp = join(workspaceProject, "apps");
const { mkdirSync } = await import("node:fs");
mkdirSync(workspaceApp);
writeFileSync(join(workspaceApp, "package.json"), JSON.stringify({ name: "workspace-app", dependencies: { react: "1", "@nestjs/core": "1" } }));
const workspaceReport = runChecks({ project: workspaceProject, mode: "all" });
assert.equal(workspaceReport.detected.react, true, "workspace React dependency should be detected");
assert.equal(workspaceReport.detected.nestjs, true, "workspace NestJS dependency should be detected");
assert(workspaceReport.detected.workspacePackages.includes("workspace-app"), "workspace package should be listed");

console.log(`Checker tests passed with ${report.findings.length} expected finding(s).`);
