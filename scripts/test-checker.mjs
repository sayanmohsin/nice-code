#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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
assert(report.findings.find((finding) => finding.file === "bad.ts").fileClass === "production", "production findings should be classified");
assert.equal(report.customFindings, report.findings, "custom findings should remain backwards-compatible");

const configuredProject = mkdtempSync(join(tmpdir(), "nice-code-test-"));
writeFileSync(join(configuredProject, ".nice-code.json"), JSON.stringify({
  ignore: ["ignored.ts"],
  exceptions: [{ id: "AP-SEC-001", file: "bad.ts", reason: "fixture exception" }],
}));
writeFileSync(join(configuredProject, "ignored.ts"), "const password = 'secret';\n");
writeFileSync(join(configuredProject, "bad.ts"), "const password = 'secret';\n");
writeFileSync(join(configuredProject, "auth.test.ts"), "const password = 'secret';\n");
const configuredReport = runChecks({ project: configuredProject, mode: "all" });
assert.equal(configuredReport.findings.length, 1, "config ignores and exceptions should be precise");
assert.equal(configuredReport.findings[0].file, "auth.test.ts", "ignored and excepted files should not produce findings");
assert.equal(configuredReport.findings[0].status, "REVIEW", "test-only credentials should remain reviewable");

const testSecretProject = mkdtempSync(join(tmpdir(), "nice-code-test-secret-"));
writeFileSync(join(testSecretProject, "auth.test.ts"), "const password = 'secret';\n");
const testSecretReport = runChecks({ project: testSecretProject, mode: "all" });
assert.equal(testSecretReport.findings[0].status, "REVIEW", "test-only credentials should be review findings");
assert.equal(testSecretReport.findings[0].severity, "warning", "test-only credentials should not be critical");

const placeholderProject = mkdtempSync(join(tmpdir(), "nice-code-placeholder-"));
writeFileSync(join(placeholderProject, "docs.ts"), [
  'const authToken = "<your-api-key>";',
  'const exampleToken = "md_live_...";',
  'const envToken = process.env.API_TOKEN;',
].join("\n"));
const placeholderReport = runChecks({ project: placeholderProject, mode: "all" });
assert.equal(placeholderReport.findings.length, 0, "placeholders and environment references should be ignored");

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

const checkerPath = join(process.cwd(), "scripts/check.mjs");
const jsonOutput = execFileSync(process.execPath, [checkerPath, "--project", project, "--all", "--format", "json"], { encoding: "utf8" });
const jsonReport = JSON.parse(jsonOutput);
assert.equal(jsonReport.schemaVersion, 1, "JSON output should expose a schema version");
assert.equal(jsonReport.checkerVersion, "0.1.0", "JSON output should expose the checker version");
assert.equal(jsonReport.exit.blocked, false, "JSON output should include the computed exit state");
assert.equal(jsonReport.findings[0].file, "bad.ts", "JSON findings should have stable file ordering");

const agentOutput = execFileSync(process.execPath, [checkerPath, "--project", project, "--all", "--format", "agent"], { encoding: "utf8" });
assert(agentOutput.startsWith("NICE_CODE status=PASS"), "agent output should start with a parseable summary");
assert(agentOutput.includes("FAIL AP-SEC-001 bad.ts:2"), "agent output should include actionable finding lines");
assert(!agentOutput.includes("REVIEW AP-LOG-002"), "agent output should omit review findings by default");

const agentAliasOutput = execFileSync(process.execPath, [checkerPath, "--project", project, "--all", "--agent", "--include-review", "--max-findings", "10"], { encoding: "utf8" });
assert(agentAliasOutput.includes("REVIEW AP-LOG-002"), "--agent should support explicit review findings");
assert.equal(agentAliasOutput.split("\n").filter((line) => /^(FAIL|WARN|REVIEW) /.test(line)).length, 6, "agent output should respect max-findings");

const filteredJson = JSON.parse(execFileSync(process.execPath, [checkerPath, "--project", project, "--all", "--status", "FAIL", "--format", "json"], { encoding: "utf8" }));
assert(filteredJson.findings.every((finding) => finding.status === "FAIL"), "explicit JSON filters should filter findings");
assert.equal(filteredJson.scanSummary.findings, report.findings.length, "filtered JSON should retain the complete scan summary");

assert.throws(
  () => execFileSync(process.execPath, [checkerPath, "--project", project, "--unknown"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
  /status 2|Unknown option/,
  "unknown options should fail with a useful error",
);

console.log(`Checker tests passed with ${report.findings.length} expected finding(s).`);
