#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checks } from "../checks/index.mjs";

const reportPath = process.argv[2];
if (!reportPath) {
  console.error("Usage: node scripts/metrics.mjs REPORT.json");
  process.exit(2);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const byCategory = {};
const byId = {};
for (const item of report.findings ?? []) {
  byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
  byId[item.id] = (byId[item.id] ?? 0) + 1;
}

const total = report.findings?.length ?? 0;
const review = report.findings?.filter((item) => item.status === "REVIEW").length ?? 0;
const standardsRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const patternCount = readdirSync(join(standardsRoot, "patterns")).filter((file) => file.endsWith(".md") && file !== "index.md").length;
const checkedCategories = new Set(checks.map((check) => check.category));
console.log(JSON.stringify({
  project: report.project,
  mode: report.mode,
  filesScanned: report.filesScanned?.length ?? 0,
  findings: total,
  newFindings: report.baseline?.newFindings ?? total,
  resolvedFindings: report.baseline?.resolvedFindings ?? 0,
  criticalFailures: report.findings?.filter((item) => item.status === "FAIL" && item.severity === "critical").length ?? 0,
  byStatus: report.summary ?? {},
  byCategory,
  recurringPatternIds: Object.entries(byId).filter(([, count]) => count > 1).map(([id, count]) => ({ id, count })),
  reviewRate: total === 0 ? 0 : Number((review / total).toFixed(3)),
  manualReviewRate: total === 0 ? 0 : Number((review / total).toFixed(3)),
  patternCheckCoverage: patternCount === 0 ? 0 : Number((checkedCategories.size / patternCount).toFixed(3)),
}, null, 2));
