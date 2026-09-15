#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const registry = JSON.parse(await readFile(join(root, "skills", "registry.json"), "utf8"));

function value(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

function project(args) {
  return resolve(value(args, "--project", "."));
}

function detect(projectRoot) {
  const has = (name) => existsSync(join(projectRoot, name));
  const packageJson = has("package.json") ? JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8")) : {};
  const dependencies = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
  const ecosystems = [];
  if (has("Cargo.toml")) ecosystems.push("rust");
  if (has("go.mod")) ecosystems.push("go");
  if (has("pubspec.yaml")) ecosystems.push("dart");
  const java = has("pom.xml") || has("build.gradle") || has("build.gradle.kts") || hasJavaSource(projectRoot);
  if (java) ecosystems.push("java");
  const springBoot = isSpringBoot(projectRoot);
  if (springBoot) ecosystems.push("spring-boot");
  if (has("tsconfig.json") || dependencies.typescript) ecosystems.push("typescript");
  if (dependencies.react || dependencies["react-dom"]) ecosystems.push("react");
  if (has("astro.config.ts") || has("astro.config.mjs") || dependencies.astro) ecosystems.push("astro");
  if (dependencies.svelte || dependencies["@sveltejs/kit"]) ecosystems.push("svelte");
  if (has("vite.config.ts") || has("vite.config.js") || dependencies.vite) ecosystems.push("vite");
  const web = ecosystems.some((entry) => ["typescript", "react", "astro", "svelte", "vite"].includes(entry));
  const files = [".nice-code.json", "DESIGN.md", "AGENTS.md", "SKILL.md", ".nice-code/skills.lock.json"];
  const existing = files.filter((file) => has(file));
  const recommendedSkills = registry.skills.filter((skill) => !skill.deprecated && skill.primary && (skill.ecosystems.length === 0 || skill.ecosystems.some((entry) => ecosystems.includes(entry))));
  return { ecosystems, web, java, springBoot, existing, recommendedSkills };
}

function hasJavaSource(projectRoot) {
  return readdirRecursive(projectRoot).some((file) => file.endsWith(".java"));
}

function readdirRecursive(rootPath) {
  const entries = readdirSync(rootPath, { withFileTypes: true });
  return entries.flatMap((entry) => {
    if ([".git", "node_modules", "target", "build", "dist"].includes(entry.name)) return [];
    const path = join(rootPath, entry.name);
    return entry.isDirectory() ? readdirRecursive(path) : [path];
  });
}

function isSpringBoot(projectRoot) {
  return ["pom.xml", "build.gradle", "build.gradle.kts"].some((name) => existsSync(join(projectRoot, name)) && readFileSync(join(projectRoot, name), "utf8").includes("spring-boot"))
    || readdirRecursive(projectRoot).filter((file) => file.endsWith(".java")).some((file) => readFileSync(file, "utf8").includes("@SpringBootApplication"));
}

function report(projectRoot, detected) {
  return {
    schemaVersion: 1,
    project: projectRoot,
    detected,
    recommendations: [
      ...(detected.web && !detected.existing.includes("DESIGN.md") ? ["Add DESIGN.md for product-specific visual direction."] : []),
      ...(!detected.existing.includes(".nice-code.json") ? ["Add .nice-code.json with detected profiles."] : []),
      ...(!detected.existing.includes("AGENTS.md") ? ["Add concise agent routing for Nice Code and project design guidance."] : []),
    ],
  };
}

function print(reportData) {
  console.log(`Nice Code project advisor: ${reportData.project}`);
  console.log(`Detected: ${reportData.detected.ecosystems.join(", ") || "no supported ecosystem"}`);
  console.log(`Recommended skills: ${reportData.detected.recommendedSkills.map((skill) => skill.id).join(", ") || "none"}`);
  for (const recommendation of reportData.recommendations) console.log(`- ${recommendation}`);
}

function filesFor(projectRoot, detected) {
  const profiles = ["default", ...detected.ecosystems];
  const skills = detected.recommendedSkills.map(({ id, version, source, revision }) => ({ id, version, source, revision }));
  const design = `# Design direction\n\nDocument this project's visual language, typography, spacing, color, component primitives, responsive behavior, and intentional exceptions here.\n\nNice Code can review implementation patterns, but rendered browser feedback is still required for visual quality.\n`;
  const agents = `## Nice Code\n\nUse the project's DESIGN.md for product-specific UI decisions. Run \`nice-code advise --project .\` when adding a new surface and \`nice-code --changed --project .\` before handoff.\n`;
  return new Map([
    [".nice-code.json", `${JSON.stringify({ profiles, ignore: ["node_modules/**", "dist/**", "build/**", "target/**"], severity: {}, exceptions: [] }, null, 2)}\n`],
    ["DESIGN.md", design],
    ["AGENTS.md", agents],
    [".nice-code/skills.lock.json", `${JSON.stringify({ schemaVersion: 1, skills }, null, 2)}\n`],
  ]);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ?? "advise";
  const projectRoot = project(args);
  const detected = detect(projectRoot);
  const data = report(projectRoot, detected);
  if (command === "advise") {
    if (args.includes("--format") && value(args, "--format", "") === "json") console.log(JSON.stringify(data, null, 2));
    else print(data);
    return;
  }
  if (command !== "init") throw new Error(`Unknown project command: ${command}`);
  const proposals = [...filesFor(projectRoot, detected)].filter(([file]) => !detected.existing.includes(file));
  const conflicts = [...filesFor(projectRoot, detected)].filter(([file]) => detected.existing.includes(file)).map(([file]) => file);
  console.log(`Nice Code initialization: ${projectRoot}`);
  console.log(`Proposed files: ${proposals.map(([file]) => file).join(", ") || "none"}`);
  if (conflicts.length > 0) console.log(`Existing files preserved for review: ${conflicts.join(", ")}`);
  if (!args.includes("--apply")) {
    console.log("Preview only. Re-run with --apply to create missing files.");
    return;
  }
  for (const [file, content] of proposals) {
    const path = join(projectRoot, file);
    await mkdir(resolve(path, ".."), { recursive: true });
    await writeFile(path, content, "utf8");
    console.log(`Created ${file}`);
  }
}

main().catch((error) => {
  console.error(`Nice Code project: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
});
