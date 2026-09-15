#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const registryPath = join(root, "skills", "registry.json");

function projectPath(args) {
  const index = args.indexOf("--project");
  return resolve(index >= 0 ? args[index + 1] ?? "." : ".");
}

async function registry() {
  return JSON.parse(await readFile(registryPath, "utf8"));
}

function printSkill(skill) {
  console.log(`${skill.id} ${skill.version} · ${skill.name}${skill.deprecated ? " (deprecated alias)" : ""}`);
  console.log(`  ${skill.description}`);
  console.log(`  ${skill.source} @ ${skill.revision}`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.startsWith("--") ? "list" : args[0] ?? "list";
  const data = await registry();
  if (command === "check") {
    const ids = new Set();
    for (const skill of data.skills ?? []) {
      if (!skill.id || ids.has(skill.id)) throw new Error(`Invalid or duplicate skill id: ${skill.id}`);
      ids.add(skill.id);
      if (!skill.version || !skill.source || !skill.revision || !skill.license || !skill.path) {
        throw new Error(`Incomplete metadata for skill: ${skill.id}`);
      }
      if (skill.primary && skill.deprecated) throw new Error(`Primary skill cannot be deprecated: ${skill.id}`);
      if (skill.deprecated && !data.skills.some((candidate) => candidate.id === skill.aliasOf && candidate.primary)) throw new Error(`Invalid skill alias target: ${skill.id}`);
      if (!existsSync(join(root, "skills", skill.path))) {
        throw new Error(`Missing skill file for ${skill.id}: ${skill.path}`);
      }
    }
    console.log(`Nice Code skill registry: ${ids.size} skills valid`);
    return;
  }
  if (command === "show") {
    const skill = (data.skills ?? []).find((entry) => entry.id === args[1]);
    if (!skill) throw new Error(`Unknown skill: ${args[1] ?? ""}`);
    printSkill(skill);
    return;
  }
  if (command === "outdated") {
    const project = projectPath(args);
    const lockPath = join(project, ".nice-code", "skills.lock.json");
    if (!existsSync(lockPath)) {
      console.log("No project skill lock found.");
      return;
    }
    const lock = JSON.parse(await readFile(lockPath, "utf8"));
    const current = new Map((data.skills ?? []).map((skill) => [skill.id, skill.version]));
    const outdated = (lock.skills ?? []).filter((skill) => current.get(skill.id) && current.get(skill.id) !== skill.version);
    if (outdated.length === 0) {
      console.log("Installed Nice Code skills are current.");
      return;
    }
    for (const skill of outdated) console.log(`${skill.id}: ${skill.version} -> ${current.get(skill.id)}`);
    return;
  }
  if (command === "update") {
    const project = projectPath(args);
    const lockPath = join(project, ".nice-code", "skills.lock.json");
    if (!existsSync(lockPath)) {
      throw new Error("No project skill lock found; run `nice-code init --project . --apply` first.");
    }
    const lock = JSON.parse(await readFile(lockPath, "utf8"));
    const current = new Map((data.skills ?? []).map((skill) => [skill.id, skill]));
    const updates = (lock.skills ?? [])
      .map((installed) => ({ installed, next: current.get(installed.id) }))
      .filter(({ installed, next }) => next && next.version !== installed.version);
    if (updates.length === 0) {
      console.log("Installed Nice Code skills are current.");
      return;
    }
    for (const { installed, next } of updates) console.log(`${installed.id}: ${installed.version} -> ${next.version}`);
    if (!args.includes("--apply")) {
      console.log("Preview only. Re-run with --apply to update the project lock.");
      return;
    }
    const skills = (lock.skills ?? []).map((installed) => {
      const next = current.get(installed.id);
      return next ? { id: next.id, version: next.version, source: next.source, revision: next.revision } : installed;
    });
    await mkdir(join(project, ".nice-code"), { recursive: true });
    await writeFile(lockPath, `${JSON.stringify({ ...lock, skills }, null, 2)}\n`, "utf8");
    console.log(`Updated ${updates.length} project skill lock entr${updates.length === 1 ? "y" : "ies"}.`);
    return;
  }
  if (command !== "list") throw new Error(`Unknown skills command: ${command}`);
  if (args.includes("--format") && args[args.indexOf("--format") + 1] === "json") {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  for (const skill of data.skills ?? []) printSkill(skill);
}

main().catch((error) => {
  console.error(`Nice Code skills: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
});
