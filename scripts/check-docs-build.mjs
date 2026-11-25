import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const output = fileURLToPath(new URL("../docs/.vitepress/dist/", import.meta.url));
const pages = JSON.parse(readFileSync(join(output, "hashmap.json"), "utf8"));
assert.ok(Object.keys(pages).length > 0, "The documentation build contains no pages.");
for (const [page, hash] of Object.entries(pages)) {
  const stem = page.replaceAll("/", "_");
  for (const suffix of ["js", "lean.js"]) {
    const asset = join(output, "assets", `${stem}.${hash}.${suffix}`);
    assert.ok(readFileSync(asset, "utf8").length > 0, `Missing page module: ${asset}`);
  }
}
console.log(`Verified full and lean modules for ${Object.keys(pages).length} documentation pages.`);
