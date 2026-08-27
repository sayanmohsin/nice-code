#!/usr/bin/env node

import { readFileSync } from "node:fs";

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
console.log(JSON.stringify({
  project: report.project,
  mode: report.mode,
  filesScanned: report.filesScanned?.length ?? 0,
  findings: total,
  criticalFailures: report.findings?.filter((item) => item.status === "FAIL" && item.severity === "critical").length ?? 0,
  byStatus: report.summary ?? {},
  byCategory,
  recurringPatternIds: Object.entries(byId).filter(([, count]) => count > 1).map(([id, count]) => ({ id, count })),
  reviewRate: total === 0 ? 0 : Number((review / total).toFixed(3)),
}, null, 2));
