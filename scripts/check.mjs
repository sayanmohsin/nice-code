#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { checks } from "../checks/index.mjs";
import { runNativeTools } from "./run-tools.mjs";
import { applyConfig, isIgnored, loadConfig } from "./config.mjs";
import { toSarif } from "./sarif.mjs";

const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".rs", ".go", ".dart"]);
const ignoredDirectories = new Set([".git", "node_modules", "target", "build", "dist", ".dart_tool", ".next"]);
const checkerVersion = "0.1.0";
const validStatuses = new Set(["PASS", "WARN", "REVIEW", "FAIL"]);

function parseArgs(argv) {
  const options = {
    mode: "changed",
    format: "text",
    ci: false,
    color: null,
    verbose: false,
    includeReview: false,
    status: null,
    maxFindings: null,
    newOnly: false,
    project: process.cwd(),
    explain: null,
    baseline: null,
    writeBaseline: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--all") options.mode = "all";
    else if (argument === "--changed") options.mode = "changed";
    else if (argument === "--ci") {
      options.mode = "changed";
      options.ci = true;
    }
    else if (argument === "--color") options.color = true;
    else if (argument === "--no-color") options.color = false;
    else if (argument === "--verbose") options.verbose = true;
    else if (argument === "--include-review") options.includeReview = true;
    else if (argument === "--agent") options.format = "agent";
    else if (argument === "--status") {
      const value = argv[++index];
      if (!value) throw new Error("--status requires a comma-separated status list");
      const statuses = value.split(",").map((status) => status.trim().toUpperCase()).filter(Boolean);
      if (statuses.length === 0 || statuses.some((status) => !validStatuses.has(status))) {
        throw new Error("--status accepts PASS, WARN, REVIEW, and FAIL");
      }
      options.status = new Set(statuses);
    }
    else if (argument === "--max-findings") {
      const value = Number(argv[++index]);
      if (!Number.isInteger(value) || value < 1) throw new Error("--max-findings requires a positive integer");
      options.maxFindings = value;
    }
    else if (argument === "--new-only") options.newOnly = true;
    else if (argument === "--json") options.format = "json";
    else if (argument === "--format") options.format = argv[++index];
    else if (argument === "--baseline") options.baseline = resolve(argv[++index]);
    else if (argument === "--write-baseline") options.writeBaseline = resolve(argv[++index]);
    else if (argument === "--project") options.project = resolve(argv[++index]);
    else if (argument === "--explain") options.explain = argv[++index];
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (options.newOnly && !options.baseline) throw new Error("--new-only requires --baseline REPORT.json");
  return options;
}

function printHelp() {
  console.log("Usage: node scripts/check.mjs [--project PATH] [--changed|--all|--ci] [--format text|json|sarif|agent]");
  console.log("       [--agent] [--verbose] [--include-review] [--status STATUS,...] [--max-findings N]");
  console.log("       add --color or --no-color to control interactive text colors");
  console.log("       node scripts/check.mjs --project PATH --baseline REPORT.json");
  console.log("       node scripts/check.mjs --project PATH --all --format json --write-baseline BASELINE.json");
  console.log("       node scripts/check.mjs --explain CHECK_ID");
}

function packageManifests(project, config) {
  const manifests = [];
  function visit(directory, depth) {
    if (depth > 4 || isIgnored(config, relative(project, directory))) return;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "tools") continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path, depth + 1);
      else if (entry.isFile() && entry.name === "package.json") manifests.push(path);
    }
  }
  visit(project, 0);
  return manifests;
}

function detectProject(project, config) {
  const has = (name) => existsSync(join(project, name));
  const manifests = packageManifests(project, config);
  const packageJsons = manifests.map((path) => {
    try {
      return JSON.parse(readFileSync(path, "utf8"));
    } catch {
      return {};
    }
  });
  const dependencies = Object.assign({}, ...packageJsons.map((packageJson) => ({ ...packageJson.dependencies, ...packageJson.devDependencies })));
  return {
    rust: has("Cargo.toml"),
    go: has("go.mod"),
    dart: has("pubspec.yaml"),
    typescript: has("tsconfig.json") || Boolean(dependencies.typescript),
    react: Boolean(dependencies.react) || Boolean(dependencies["react-native"]),
    astro: Boolean(dependencies.astro),
    svelte: Boolean(dependencies.svelte),
    nestjs: Boolean(dependencies["@nestjs/core"]),
    next: Boolean(dependencies.next),
    vite: Boolean(dependencies.vite),
    workspacePackages: packageJsons.filter((packageJson) => packageJson.name).map((packageJson) => packageJson.name),
    profiles: [
      "default",
      ...(dependencies.typescript || has("tsconfig.json") ? ["typescript"] : []),
      ...(dependencies.react || dependencies["react-native"] ? ["react"] : []),
      ...(dependencies["@nestjs/core"] ? ["nestjs"] : []),
      ...(dependencies.next || dependencies.astro || dependencies.svelte || dependencies.vite ? ["web"] : []),
    ],
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

function findingKey(item) {
  return `${item.id}:${item.file}:${item.line}:${item.message}`;
}

function legacyFindingKey(item) {
  return `${item.id}:${item.file}:${item.message}`;
}

export function runChecks({ project = process.cwd(), mode = "changed", baseline = null } = {}) {
  const config = loadConfig(project);
  const files = readFiles(project, mode, config);
  const findings = applyConfig(config, checks.flatMap((check) => files.flatMap((file) => check.run(file))))
    .sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || left.id.localeCompare(right.id));
  const baselineFindings = baseline ? JSON.parse(readFileSync(baseline, "utf8")).findings ?? [] : [];
  const baselineKeys = new Set(baselineFindings.flatMap((item) => [findingKey(item), legacyFindingKey(item)]));
  const newFindings = findings.filter((item) => !baselineKeys.has(findingKey(item)) && !baselineKeys.has(legacyFindingKey(item)));
  const repeatedFindings = findings.filter((item) => baselineKeys.has(findingKey(item)) || baselineKeys.has(legacyFindingKey(item))).length;
  const baselineAges = baselineFindings
    .map((item) => item.firstSeen)
    .filter(Boolean)
    .map((firstSeen) => Math.max(0, Math.floor((Date.now() - Date.parse(firstSeen)) / 86_400_000)))
    .filter(Number.isFinite);
  const report = {
    schemaVersion: 1,
    checkerVersion,
    project,
    mode,
    config: config.path ? ".nice-code.json" : null,
    activeProfiles: config.profiles,
    detected: detectProject(project, config),
    filesScanned: files.map((file) => file.path),
    findings,
    customFindings: findings,
    baseline: baseline ? {
      path: baseline,
      findings: baselineFindings.length,
      newFindings: newFindings.length,
      resolvedFindings: baselineFindings.filter((item) => !findings.some((current) => (
        findingKey(current) === findingKey(item) || legacyFindingKey(current) === legacyFindingKey(item)
      ))).length,
      repeatedFindings,
      ageDays: baselineAges.length > 0 ? {
        oldest: Math.max(...baselineAges),
        average: Math.round(baselineAges.reduce((sum, age) => sum + age, 0) / baselineAges.length),
      } : null,
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
  return report;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Nice Code: ${error.message}`);
    process.exitCode = 2;
    return;
  }
  if (options.help) return printHelp();
  if (options.explain) {
    if (!explain(options.explain)) process.exitCode = 2;
    return;
  }
  const report = runChecks(options);
  report.tools = options.ci ? runNativeTools(options.project) : [];
  report.nativeTools = report.tools;
  report.generatedAt = new Date().toISOString();
  report.command = process.argv.slice(2);
  report.exit = {
    blocked: false,
    reasons: [],
  };
  if (options.writeBaseline) {
    const baselineCreatedAt = new Date().toISOString();
    writeFileSync(options.writeBaseline, `${JSON.stringify({
      schemaVersion: 1,
      checkerVersion: "0.1.0",
      createdAt: baselineCreatedAt,
      project: report.project,
      findings: report.findings.map((finding) => ({ ...finding, firstSeen: baselineCreatedAt })),
    }, null, 2)}\n`);
  }
  const blockingFindings = report.baseline ? report.newFindings : report.findings;
  if (options.mode === "changed" && blockingFindings.some((item) => item.status === "FAIL" && item.severity === "critical")) {
    report.exit.blocked = true;
    report.exit.reasons.push("new critical custom finding");
  }
  if (options.mode === "changed" && report.tools.some((tool) => tool.status === "FAIL")) {
    report.exit.blocked = true;
    report.exit.reasons.push("native tool failure");
  }
  const output = selectOutput(report, options);
  if (options.format === "json") {
    console.log(JSON.stringify(output.report, null, 2));
  } else if (options.format === "sarif") {
    console.log(JSON.stringify(toSarif(output.report), null, 2));
  } else if (options.format === "agent") {
    printAgentReport(report, output);
  } else {
    printTextReport(report, options.color, output);
  }
  if (report.exit.blocked) process.exitCode = 1;
}

function summarize(findings) {
  return {
    files: new Set(findings.map((item) => item.file)).size,
    findings: findings.length,
    pass: findings.filter((item) => item.status === "PASS").length,
    warn: findings.filter((item) => item.status === "WARN").length,
    review: findings.filter((item) => item.status === "REVIEW").length,
    fail: findings.filter((item) => item.status === "FAIL").length,
  };
}

function selectOutput(report, options) {
  const source = options.newOnly ? report.newFindings : report.findings;
  let findings = source;
  if (options.status) findings = findings.filter((item) => options.status.has(item.status));
  else if (options.format === "agent" && !options.includeReview) findings = findings.filter((item) => item.status === "FAIL" || item.status === "WARN");
  const selectedCount = findings.length;
  const defaultLimit = options.format === "text" && options.mode === "all" && !options.verbose ? 20 : null;
  const limit = options.maxFindings ?? defaultLimit;
  const displayedFindings = limit ? findings.slice(0, limit) : findings;
  const filtered = options.newOnly || options.status || options.includeReview || options.maxFindings !== null;
  const outputReport = filtered ? {
    ...report,
    findings: displayedFindings,
    customFindings: displayedFindings,
    newFindings: options.newOnly ? displayedFindings : report.newFindings,
    scanSummary: report.summary,
    summary: summarize(displayedFindings),
  } : report;
  return {
    findings: displayedFindings,
    selectedCount,
    hiddenCount: Math.max(0, selectedCount - displayedFindings.length),
    report: outputReport,
  };
}

function printTextReport(report, requestedColor, output) {
  const useColor = requestedColor ?? (process.stdout.isTTY && !process.env.NO_COLOR && !process.env.CI);
  const ansi = useColor ? {
    reset: "\u001b[0m",
    dim: "\u001b[2m",
    red: "\u001b[31m",
    yellow: "\u001b[33m",
    green: "\u001b[32m",
    cyan: "\u001b[36m",
    bold: "\u001b[1m",
  } : Object.fromEntries(["reset", "dim", "red", "yellow", "green", "cyan", "bold"].map((key) => [key, ""]));
  const paint = (color, text) => `${ansi[color]}${text}${ansi.reset}`;
  const symbol = (status) => status === "FAIL" ? paint("red", "✕") : status === "WARN" || status === "REVIEW" ? paint("yellow", "!") : paint("green", "✓");
  const status = (value) => {
    const raw = value.trim();
    return raw === "FAIL" ? paint("red", value) : raw === "WARN" || raw === "REVIEW" ? paint("yellow", value) : paint("green", value);
  };

  console.log(`${paint("bold", "Nice Code")} ${paint("dim", `v${checkerVersion}`)}`);
  console.log(`${paint("dim", "Project:")} ${report.project}`);
  console.log(`${paint("dim", "Mode:")} ${report.mode} ${paint("dim", "| Files:")} ${report.summary.files} ${paint("dim", "| Findings:")} ${report.summary.findings}`);
  console.log("");
  if (output.selectedCount === 0) {
    console.log(`${paint("green", "✓")} No findings.`);
  } else {
    console.log("Findings:");
    const groups = new Map();
    for (const item of output.findings) {
      const key = `${item.status}:${item.id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    for (const [key, items] of groups) {
      const [groupStatus, groupId] = key.split(":");
      console.log(`  ${symbol(groupStatus)} ${status(groupStatus)} ${paint("cyan", groupId)} ${paint("dim", `(${items.length})`)}`);
      for (const item of items) {
        console.log(`    ${item.file}:${item.line}`);
        console.log(`             ${item.message}`);
      }
    }
    if (output.hiddenCount > 0) console.log(`  ${paint("dim", `... ${output.hiddenCount} more finding(s) hidden; use --verbose or --max-findings.`)}`);
  }
  if (report.tools.length > 0) {
    console.log("");
    console.log("Native tools:");
    for (const tool of report.tools) console.log(`  ${tool.status === "PASS" ? paint("green", "✓") : paint("yellow", "!")} ${status(tool.status.padEnd(7))} ${tool.command}`);
  }
  console.log("");
  console.log(`${paint("dim", "Summary:")} ${report.summary.fail} fail, ${report.summary.warn} warn, ${report.summary.review} review.`);
  console.log(report.exit.blocked
    ? `${paint("red", "✕")} Result: ${paint("red", "BLOCKED")} (${report.exit.reasons.join(", ")})`
    : report.summary.findings > 0
      ? `${paint("yellow", "!")} Result: ${paint("yellow", "ADVISORY")} (${report.summary.findings} finding(s))`
      : `${paint("green", "✓")} Result: ${paint("green", "PASS")}`);
}

function printAgentReport(report, output) {
  const status = report.exit.blocked ? "BLOCKED" : report.summary.findings > 0 ? "ADVISORY" : "PASS";
  console.log(`NICE_CODE status=${status} mode=${report.mode} files=${report.summary.files} total=${report.summary.findings} selected=${output.selectedCount} shown=${output.findings.length}`);
  for (const item of output.findings) {
    console.log(`${item.status} ${item.id} ${item.file}:${item.line} severity=${item.severity} category=${item.category} :: ${item.message}`);
  }
  if (output.hiddenCount > 0) console.log(`HIDDEN ${output.hiddenCount} use=--verbose-or---max-findings`);
  for (const tool of report.tools) {
    if (tool.status !== "PASS") console.log(`TOOL_${tool.status} ${tool.command} :: ${tool.output}`);
  }
  if (report.exit.reasons.length > 0) console.log(`REASONS ${report.exit.reasons.join("; ")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
