import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";

const script = join(process.cwd(), "scripts", "knowledge.mjs");

test("knowledge compiler is deterministic and generated rules are current", () => {
  const output = execFileSync(process.execPath, [script, "compile", "--check"], { encoding: "utf8" });
  assert.equal(output, "");
});

test("knowledge check validates registered documents and sources", () => {
  const output = execFileSync(process.execPath, [script, "check"], { encoding: "utf8" });
  assert.match(output, /knowledge base: 12 entries and 6 sources valid/);
});
