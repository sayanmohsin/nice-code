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

function parseArgs(argv) {
  const options = { mode: "changed", format: "text", ci: false, color: null, project: process.cwd(), explain: null, baseline: null, writeBaseline: null };
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
    else if (argument === "--json") options.format = "json";
    else if (argument === "--format") options.format = argv[++index];
    else if (argument === "--baseline") options.baseline = resolve(argv[++index]);
    else if (argument === "--write-baseline") options.writeBaseline = resolve(argv[++index]);
    else if (argument === "--project") options.project = resolve(argv[++index]);
    else if (argument === "--explain") options.explain = argv[++index];
    else if (argument === "--help" || argument === "-h") options.help = true;
  }
  return options;
}

function printHelp() {
  console.log("Usage: node scripts/check.mjs [--project PATH] [--changed|--all|--ci] [--format text|json|sarif|agent]");
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

export function runChecks({ project = process.cwd(), mode = "changed", baseline = null } = {}) {
  const config = loadConfig(project);
  const files = readFiles(project, mode, config);
  const findings = applyConfig(config, checks.flatMap((check) => files.flatMap((file) => check.run(file))))
    .sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || left.id.localeCompare(right.id));
  const baselineFindings = baseline ? JSON.parse(readFileSync(baseline, "utf8")).findings ?? [] : [];
  const baselineKeys = new Set(baselineFindings.map((item) => `${item.id}:${item.file}:${item.message}`));
  const newFindings = findings.filter((item) => !baselineKeys.has(`${item.id}:${item.file}:${item.message}`));
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
  return report;
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
  report.nativeTools = report.tools;
  report.generatedAt = new Date().toISOString();
  report.command = process.argv.slice(2);
  report.exit = {
    blocked: false,
    reasons: [],
  };
  if (options.writeBaseline) {
    writeFileSync(options.writeBaseline, `${JSON.stringify({
      schemaVersion: 1,
      checkerVersion: "0.1.0",
      createdAt: new Date().toISOString(),
      project: report.project,
      findings: report.findings,
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
  if (options.format === "json") {
    console.log(JSON.stringify(report, null, 2));
  } else if (options.format === "sarif") {
    console.log(JSON.stringify(toSarif(report), null, 2));
  } else if (options.format === "agent") {
    printAgentReport(report);
  } else {
    printTextReport(report, options.color);
  }
  if (report.exit.blocked) process.exitCode = 1;
}

function printTextReport(report, requestedColor) {
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
  if (report.summary.findings === 0) {
    console.log(`${paint("green", "✓")} No findings.`);
  } else {
    console.log("Findings:");
    for (const item of report.findings) {
      console.log(`  ${symbol(item.status)} ${status(item.status.padEnd(6))} ${paint("cyan", item.id)} ${item.file}:${item.line}`);
      console.log(`           ${item.message}`);
    }
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
    : `${paint("green", "✓")} Result: ${paint("green", "PASS")}`);
}

function printAgentReport(report) {
  console.log(`NICE_CODE status=${report.exit.blocked ? "BLOCKED" : "PASS"} mode=${report.mode} files=${report.summary.files} findings=${report.summary.findings}`);
  for (const item of report.findings) {
    console.log(`${item.status} ${item.id} ${item.file}:${item.line} severity=${item.severity} category=${item.category} :: ${item.message}`);
  }
  for (const tool of report.tools) {
    if (tool.status !== "PASS") console.log(`TOOL_${tool.status} ${tool.command} :: ${tool.output}`);
  }
  if (report.exit.reasons.length > 0) console.log(`REASONS ${report.exit.reasons.join("; ")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
