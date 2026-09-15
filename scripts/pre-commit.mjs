#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const hook = join(root, ".githooks", "pre-commit");
if (process.argv.includes("--install")) {
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], { cwd: root, stdio: "inherit" });
  console.log("Installed Nice Code repository hooks.");
  process.exit(0);
}

const files = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
execFileSync("git", ["diff", "--cached", "--check"], { cwd: root, stdio: "inherit" });
const run = (script) => execFileSync("npm", ["run", script], { cwd: root, stdio: "inherit" });
if (files.some((file) => /^(knowledge|patterns|skills|sources)\//.test(file))) { run("knowledge:compile"); run("knowledge:check"); run("skills:check"); run("check:docs"); }
if (files.some((file) => file.startsWith("engine/"))) run("engine:test");
if (files.some((file) => /^(package\.json|scripts\/|skills\/|knowledge\/)/.test(file))) run("pack:check");
