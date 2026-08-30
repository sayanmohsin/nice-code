#!/usr/bin/env bun

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const requiredSections = [
  "## Problem",
  "## Pattern",
  "## Avoid",
  "## Example",
  "## Enforcement",
  "## Exceptions",
  "## Sources",
];
const patternDirectory = join(process.cwd(), "patterns");
const files = readdirSync(patternDirectory).filter(
  (file) => file.endsWith(".md") && file !== "index.md",
);
const errors: string[] = [];

for (const file of files) {
  const content = readFileSync(join(patternDirectory, file), "utf8");
  for (const section of requiredSections) {
    if (!content.includes(section)) errors.push(`${file}: missing ${section}`);
  }
  if (!/https?:\/\//.test(content)) errors.push(`${file}: missing source URL`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.length} pattern document(s).`);
}
