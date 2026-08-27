#!/usr/bin/env node

import assert from "node:assert/strict";
import { join } from "node:path";
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
assert(report.findings.some((finding) => finding.file === "ambiguous.ts" && finding.status === "REVIEW"), "ambiguous fixture should be review-only");

console.log(`Checker tests passed with ${report.findings.length} expected finding(s).`);
