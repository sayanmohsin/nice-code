#!/usr/bin/env bun

import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const projectIndex = args.indexOf("--project");
const project = resolve(
  projectIndex >= 0 ? args[projectIndex + 1] : process.cwd(),
);
if (!existsSync(project)) {
  console.error(`Project directory does not exist: ${project}`);
  process.exit(1);
}
const configPath = join(project, ".nice-code.json");
if (existsSync(configPath)) {
  console.error(`${configPath} already exists; refusing to overwrite it.`);
  process.exit(1);
}
writeFileSync(
  configPath,
  `${JSON.stringify(
    {
      profiles: ["default"],
      ignore: ["node_modules/**", "dist/**", "build/**", "target/**"],
      severity: {},
      exceptions: [],
    },
    null,
    2,
  )}\n`,
);
console.log(`Created ${configPath}`);
console.log(
  "Add a project script or CI step pointing to the Node-compatible Nice Code launcher.",
);
