#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const registryPath = join(root, "knowledge", "registry.json");
const sourcesPath = join(root, "knowledge", "sources.json");
const rulesPath = join(root, "knowledge", "rules.json");

function load(path) { return JSON.parse(readFileSync(path, "utf8")); }
function entries() { return load(registryPath).entries ?? []; }
function assert(condition, message) { if (!condition) throw new Error(message); }
function files(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : entry.name.endsWith(".md") ? [path] : [];
  });
}
function value(text) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return trimmed.slice(1, -1).split(",").map((item) => item.trim().replace(/^['\"]|['\"]$/g, "")).filter(Boolean);
  return trimmed.replace(/^['\"]|['\"]$/g, "").replaceAll("\\\\", "\\");
}
function frontMatter(content) {
  const lines = content.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return {};
  const result = {};
  for (const line of lines.slice(1)) {
    if (line.trim() === "---") break;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    result[line.slice(0, separator).trim()] = value(line.slice(separator + 1));
  }
  return result;
}
function compileRules() {
  const rules = files(join(root, "knowledge", "rules")).map((path) => {
    const metadata = frontMatter(readFileSync(path, "utf8"));
    const rule = { id: metadata.id, title: metadata.title, category: metadata.category ?? "general", scope: metadata.scope ?? [], extensions: metadata.extensions ?? [], matcher: metadata.matcher, matcherType: metadata.matcherType ?? "literal", severity: metadata.severity ?? "warning", status: metadata.status ?? "REVIEW", message: metadata.message, source: metadata.source ?? "" };
    assert(/^AP-[A-Z0-9-]+$/.test(rule.id ?? ""), `invalid built-in rule id in ${path}`);
    assert(rule.title && rule.matcher && rule.message, `incomplete rule in ${path}`);
    assert(["literal", "regex"].includes(rule.matcherType), `unsupported matcher type in ${path}`);
    assert(["critical", "warning"].includes(String(rule.severity).toLowerCase()), `unsupported severity in ${path}`);
    if (rule.matcherType === "regex") { try { new RegExp(rule.matcher); } catch { throw new Error(`invalid regex in ${path}`); } }
    return rule;
  }).sort((a, b) => a.id.localeCompare(b.id));
  const ids = new Set();
  for (const rule of rules) { assert(!ids.has(rule.id), `duplicate rule id: ${rule.id}`); ids.add(rule.id); }
  return { schemaVersion: 1, rules };
}
function compile(check) {
  const generated = `${JSON.stringify(compileRules(), null, 2)}\n`;
  if (check) {
    assert(existsSync(rulesPath), "missing generated knowledge/rules.json; run knowledge:compile");
    assert(readFileSync(rulesPath, "utf8") === generated, "knowledge/rules.json is stale; run knowledge:compile");
  } else {
    writeFileSync(rulesPath, generated, "utf8");
    console.log(`Compiled ${JSON.parse(generated).rules.length} knowledge rule(s).`);
  }
}
function check() {
  const registry = load(registryPath);
  const sources = load(sourcesPath);
  assert(registry.schemaVersion === 1, "knowledge registry schemaVersion must be 1");
  assert(sources.schemaVersion === 1, "knowledge source registry schemaVersion must be 1");
  const ids = new Set();
  const sourceIds = new Set();
  for (const source of sources.sources ?? []) { assert(source.id && !sourceIds.has(source.id), `invalid or duplicate source id: ${source.id}`); assert(/^https?:\/\//.test(source.url), `source ${source.id} must have an http URL`); assert(source.reviewedOn && source.reviewAfter, `source ${source.id} needs review metadata`); sourceIds.add(source.id); }
  for (const entry of entries()) { assert(entry.id && !ids.has(entry.id), `invalid or duplicate knowledge id: ${entry.id}`); assert(entry.title && entry.document && entry.kind && entry.status, `incomplete knowledge entry: ${entry.id}`); const document = resolve(root, entry.document); assert(document.startsWith(`${root}${process.platform === "win32" ? "\\" : "/"}`) && existsSync(document), `missing document for ${entry.id}: ${entry.document}`); for (const source of entry.sources ?? []) assert(sourceIds.has(source), `${entry.id} references unknown source: ${source}`); ids.add(entry.id); }
  for (const document of files(join(root, "knowledge", "general")).concat(files(join(root, "knowledge", "languages")), files(join(root, "knowledge", "frameworks")))) assert(entries().some((entry) => entry.document === document.slice(root.length + 1)), `unregistered knowledge document: ${document}`);
  compile(true);
  console.log(`Nice Code knowledge base: ${ids.size} entries and ${sourceIds.size} sources valid`);
}
function outdated() { const stale = (load(sourcesPath).sources ?? []).filter((source) => new Date(source.reviewAfter) < new Date()); if (!stale.length) { console.log("All knowledge sources are within their review window."); return; } for (const source of stale) console.log(`${source.id}: review after ${source.reviewAfter} (${source.url})`); process.exitCode = 1; }
function list() { for (const entry of entries()) console.log(`${entry.id} · ${entry.kind} · ${entry.status} · ${entry.title}`); }
try { const args = process.argv.slice(2); const command = args[0] ?? "list"; if (command === "compile") compile(args.includes("--check")); else if (command === "check") check(); else if (command === "outdated") outdated(); else if (command === "list") list(); else if (command === "refresh") { console.log("Source refresh is report-only; review sources and update Markdown in a pull request."); outdated(); } else throw new Error(`Unknown knowledge command: ${command}`); } catch (error) { console.error(`Nice Code knowledge: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 2; }
