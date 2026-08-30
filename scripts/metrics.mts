#!/usr/bin/env bun

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const reportPath = process.argv[2];
if (!reportPath) {
  console.error("Usage: bun scripts/metrics.mts REPORT.json");
  process.exit(2);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const findings = report.customFindings ?? report.findings ?? [];
const byCategory: Record<string, number> = {};
const byId: Record<string, number> = {};
const byStatus: Record<string, number> = {};
const byFileClass: Record<string, number> = {};
for (const item of findings) {
  byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
  byId[item.id] = (byId[item.id] ?? 0) + 1;
  byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
  byFileClass[item.fileClass ?? "unknown"] =
    (byFileClass[item.fileClass ?? "unknown"] ?? 0) + 1;
}

const total = findings.length;
const review = findings.filter((item) => item.status === "REVIEW").length;
const standardsRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const patternCount = readdirSync(join(standardsRoot, "patterns")).filter(
  (file) => file.endsWith(".md") && file !== "index.md",
).length;
const checkedCategories = new Set(findings.map((item) => item.category));
console.log(
  JSON.stringify(
    {
      project: report.project,
      mode: report.mode,
      filesScanned: report.filesScanned?.length ?? 0,
      findings: total,
      criticalFailures: findings.filter(
        (item) => item.status === "FAIL" && item.severity === "critical",
      ).length,
      byStatus: report.summary ?? {},
      findingStatus: byStatus,
      byFileClass,
      byCategory,
      recurringPatternIds: Object.entries(byId)
        .filter(([, count]) => count > 1)
        .map(([id, count]) => ({ id, count })),
      reviewRate: total === 0 ? 0 : Number((review / total).toFixed(3)),
      patternCheckCoverage:
        patternCount === 0
          ? 0
          : Number((checkedCategories.size / patternCount).toFixed(3)),
    },
    null,
    2,
  ),
);
