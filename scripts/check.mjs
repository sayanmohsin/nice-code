#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { checks } from "../checks/index.mjs";
import { runNativeTools } from "./run-tools.mjs";
import { applyConfig, isIgnored, loadConfig } from "./config.mjs";
import { toSarif } from "./sarif.mjs";

const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".rs", ".go", ".dart"]);
const ignoredDirectories = new Set([".git", "node_modules", "target", "build", "dist", ".dart_tool", ".next"]);

function parseArgs(argv) {
  const options = { mode: "changed", format: "text", ci: false, project: process.cwd(), explain: null, baseline: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--all") options.mode = "all";
    else if (argument === "--changed") options.mode = "changed";
    else if (argument === "--ci") {
      options.mode = "changed";
      options.ci = true;
    }
    else if (argument === "--json") options.format = "json";
    else if (argument === "--format") options.format = argv[++index];
    else if (argument === "--baseline") options.baseline = resolve(argv[++index]);
    else if (argument === "--project") options.project = resolve(argv[++index]);
    else if (argument === "--explain") options.explain = argv[++index];
    else if (argument === "--help" || argument === "-h") options.help = true;
  }
  return options;
}

function printHelp() {
  console.log("Usage: node scripts/check.mjs [--project PATH] [--changed|--all|--ci] [--format text|json|sarif]");
  console.log("       node scripts/check.mjs --project PATH --baseline REPORT.json");
  console.log("       node scripts/check.mjs --explain CHECK_ID");
}

function detectProject(project) {
  const has = (name) => existsSync(join(project, name));
  let packageJson = {};
  if (has("package.json")) {
    try {
      packageJson = JSON.parse(readFileSync(join(project, "package.json"), "utf8"));
    } catch {
      packageJson = {};
    }
  }
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  return {
    rust: has("Cargo.toml"),
    go: has("go.mod"),
    dart: has("pubspec.yaml"),
    typescript: has("tsconfig.json") || Boolean(dependencies.typescript),
    react: Boolean(dependencies.react) || Boolean(dependencies["react-native"]),
    astro: Boolean(dependencies.astro),
    svelte: Boolean(dependencies.svelte),
  };
}

function gitFiles(project) {
  try {
    const output = execFileSync("git", ["-C", project, "diff", "--name-only", "--diff-filter=ACMR", "HEAD"], { encoding: "utf8" });
    const untracked = execFileSync("git", ["-C", project, "ls-files", "--others", "--exclude-standard"], { encoding: "utf8" });
    return [...new Set(`${output}\n${untracked}`.split("\n").filter(Boolean))];
  } catch {
    return [];
  }
}

function walk(directory, root, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
      walk(join(directory, entry.name), root, files);
    } else if (entry.isFile() && sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf(".")))) {
      files.push(relative(root, join(directory, entry.name)));
    }
  }
  return files;
}

function readFiles(project, mode, config) {
  const isStandardsRepository = existsSync(join(project, "patterns")) && existsSync(join(project, "sources"));
  const paths = mode === "all" ? walk(project, project) : gitFiles(project);
  return paths
    .filter((path) => !isStandardsRepository || !/^(checks|fixtures|scripts)\//.test(path))
    .filter((path) => !isIgnored(config, path))
    .filter((path) => sourceExtensions.has(path.slice(path.lastIndexOf("."))))
    .map((path) => ({ path, absolutePath: join(project, path), content: readFileSync(join(project, path), "utf8") }));
}

function explain(id) {
  const check = checks.find((candidate) => candidate.id === id);
  if (!check) return false;
  console.log(`${check.id} — ${check.title}`);
  console.log(`Category: ${check.category}`);
  console.log(`Severity: ${check.severity}`);
  console.log(`Source: ${check.source}`);
  return true;
}

export function runChecks({ project = process.cwd(), mode = "changed", baseline = null } = {}) {
  const config = loadConfig(project);
  const files = readFiles(project, mode, config);
  const findings = applyConfig(config, checks.flatMap((check) => files.flatMap((file) => check.run(file))));
  const baselineFindings = baseline ? JSON.parse(readFileSync(baseline, "utf8")).findings ?? [] : [];
  const baselineKeys = new Set(baselineFindings.map((item) => `${item.id}:${item.file}:${item.message}`));
  const newFindings = findings.filter((item) => !baselineKeys.has(`${item.id}:${item.file}:${item.message}`));
  return {
    project,
    mode,
    config: config.path ? ".nice-code.json" : null,
    detected: detectProject(project),
    filesScanned: files.map((file) => file.path),
    findings,
    baseline: baseline ? {
      path: baseline,
      findings: baselineFindings.length,
      newFindings: newFindings.length,
      resolvedFindings: baselineFindings.filter((item) => !findings.some((current) => (
        `${current.id}:${current.file}:${current.message}` === `${item.id}:${item.file}:${item.message}`
      ))).length,
    } : null,
    newFindings,
    summary: {
      files: files.length,
      findings: findings.length,
      pass: findings.filter((item) => item.status === "PASS").length,
      warn: findings.filter((item) => item.status === "WARN").length,
      review: findings.filter((item) => item.status === "REVIEW").length,
      fail: findings.filter((item) => item.status === "FAIL").length,
    },
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return printHelp();
  if (options.explain) {
    if (!explain(options.explain)) process.exitCode = 2;
    return;
  }
  const report = runChecks(options);
  report.tools = options.ci ? runNativeTools(options.project) : [];
  if (options.format === "json") {
    console.log(JSON.stringify(report, null, 2));
  } else if (options.format === "sarif") {
    console.log(JSON.stringify(toSarif(report), null, 2));
  } else {
    console.log(`Nice Code: ${report.project} (${report.mode})`);
    console.log(`Scanned ${report.summary.files} file(s); ${report.summary.findings} finding(s).`);
    for (const item of report.findings) {
      console.log(`${item.status.padEnd(6)} ${item.id.padEnd(14)} ${item.file}:${item.line} ${item.message}`);
    }
    console.log(`Summary: ${report.summary.fail} fail, ${report.summary.warn} warn, ${report.summary.review} review.`);
  }
  const blockingFindings = report.baseline ? report.newFindings : report.findings;
  if (options.mode === "changed" && (blockingFindings.some((item) => item.status === "FAIL" && item.severity === "critical") || report.tools.some((tool) => tool.status === "FAIL"))) {
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
