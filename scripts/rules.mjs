#!/usr/bin/env node

import { existsSync, readdirSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const project = resolve(args.includes("--project") ? args[args.indexOf("--project") + 1] ?? "." : ".");
const command = args[0] ?? "validate";

function scalar(raw) { return raw.trim().replace(/^['"]|['"]$/g, ""); }
function parsed(raw) {
  const value = raw.trim();
  if (value.startsWith("[") && value.endsWith("]")) return value.slice(1, -1).split(",").map(scalar).filter(Boolean);
  return scalar(value);
}
function markdownFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith(".md") ? [path] : [];
  });
}
function parseMarkdown(content) {
  const lines = content.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return [];
  const checks = [];
  let current;
  let inChecks = false;
  for (const raw of lines.slice(1)) {
    const line = raw.trim();
    if (line === "---") break;
    if (line === "checks:") { inChecks = true; continue; }
    if (!inChecks) continue;
    if (line.startsWith("- id:")) {
      if (current) checks.push(current);
      current = { id: scalar(line.slice(5)), category: "project", matcherType: "literal", severity: "warning", status: "review", extensions: [], appliesTo: [], includeTests: false };
      continue;
    }
    if (!current || !line.includes(":")) continue;
    const [key, ...rest] = line.split(":");
    const name = { matcher_type: "matcherType", applies_to: "appliesTo", include_tests: "includeTests" }[key.trim()] ?? key.trim();
    const value = parsed(rest.join(":"));
    current[name] = ["extensions", "appliesTo"].includes(name) ? (Array.isArray(value) ? value : [value]) : value;
  }
  if (current) checks.push(current);
  return checks;
}
function validate(checks, source) {
  const ids = new Map();
  for (const check of checks) {
    if (!/^CUSTOM-[A-Z0-9-]+$/.test(check.id ?? "")) throw new Error(`${source}: invalid custom id ${check.id ?? ""}`);
    const previous = ids.get(check.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(check)) throw new Error(`${source}: duplicate custom id ${check.id}`);
    ids.set(check.id, check);
    if (!check.title || !check.matcher || !check.message) throw new Error(`${source}: ${check.id} requires title, matcher, and message`);
    if (!["literal", "regex"].includes(String(check.matcherType).toLowerCase())) throw new Error(`${source}: ${check.id} has unsupported matcherType`);
    if (!["warning", "critical"].includes(String(check.severity).toLowerCase())) throw new Error(`${source}: ${check.id} has unsupported severity`);
    if (!["review", "warning", "critical", "fail"].includes(String(check.status).toLowerCase())) throw new Error(`${source}: ${check.id} has unsupported status`);
    if (String(check.matcherType).toLowerCase() === "regex") try { new RegExp(check.matcher); } catch { throw new Error(`${source}: ${check.id} has an invalid regex`); }
    for (const field of ["extensions", "appliesTo"]) if (!Array.isArray(check[field])) throw new Error(`${source}: ${check.id} ${field} must be a list`);
  }
}
function normalize(check) {
  return {
    category: "project",
    matcherType: "literal",
    severity: "warning",
    status: "review",
    extensions: [],
    appliesTo: [],
    includeTests: false,
    ...check,
  };
}
async function load() {
  const checks = [];
  for (const path of markdownFiles(join(project, ".nice-code", "rules"))) checks.push(...parseMarkdown(await readFile(path, "utf8")));
  const jsonPath = join(project, ".nice-code", "checks.json");
  if (existsSync(jsonPath)) {
    const data = JSON.parse(await readFile(jsonPath, "utf8"));
    checks.push(...(data.checks ?? data));
  }
  const normalized = checks.map(normalize);
  validate(normalized, project);
  const unique = [...new Map(normalized.map((check) => [check.id, check])).values()];
  return { schemaVersion: 1, checks: unique };
}
async function main() {
  if (command === "init") {
    const path = join(project, ".nice-code", "rules", "team.md");
    if (existsSync(path)) throw new Error(`Refusing to overwrite ${path}`);
    await mkdir(join(project, ".nice-code", "rules"), { recursive: true });
    await writeFile(path, "---\nid: team-rules\nchecks:\n  - id: CUSTOM-TEAM-001\n    title: Example project rule\n    matcher: forbidden\n    severity: warning\n    status: review\n    message: Replace this project-specific marker.\n    extensions: [ts, java]\n    appliesTo: [typescript, java]\n---\n\nDescribe the team convention here.\n");
    console.log(`Created ${path}`);
    return;
  }
  if (!["validate", "compile"].includes(command)) throw new Error(`Unknown rules command: ${command}`);
  const generated = await load();
  console.log(`Validated ${generated.checks.length} custom rule(s).`);
  if (command !== "compile") return;
  const output = join(project, ".nice-code", "checks.json");
  if (existsSync(output)) throw new Error(`${output} already exists; remove it or edit checks.json explicitly before compiling Markdown rules`);
  if (args.includes("--apply")) { await mkdir(join(project, ".nice-code"), { recursive: true }); await writeFile(output, `${JSON.stringify(generated, null, 2)}\n`); console.log(`Wrote ${output}`); }
  else console.log(JSON.stringify(generated, null, 2));
}
main().catch((error) => { console.error(`Nice Code rules: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 2; });
