#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  chmod,
  mkdir,
  readFile,
  rename,
  writeFile,
  access,
} from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const VERSION = "0.1.3";
const REPOSITORY = "sayanmohsin/nice-code";

function platformTarget() {
  const targets = {
    "darwin/arm64": ["aarch64-apple-darwin", ""],
    "darwin/x64": ["x86_64-apple-darwin", ""],
    "linux/arm64": ["aarch64-unknown-linux-gnu", ""],
    "linux/x64": ["x86_64-unknown-linux-gnu", ""],
    "win32/x64": ["x86_64-pc-windows-msvc", ".exe"],
  };
  const result = targets[`${process.platform}/${process.arch}`];
  if (!result)
    throw new Error(
      `Nice Code has no prebuilt engine for ${process.platform}/${process.arch}. Set NICE_CODE_ENGINE or run the Rust binary directly.`,
    );
  return { target: result[0], suffix: result[1] };
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function localCandidates() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const suffix = process.platform === "win32" ? ".exe" : "";
  return [
    process.env.NICE_CODE_ENGINE,
    join(root, "engine", "target", "release", `nice-code-engine${suffix}`),
    join(root, "engine", "target", "debug", `nice-code-engine${suffix}`),
  ].filter(Boolean);
}

async function downloadEngine() {
  const { target, suffix } = platformTarget();
  const cacheRoot =
    process.env.XDG_CACHE_HOME ??
    process.env.LOCALAPPDATA ??
    join(process.env.HOME ?? process.env.USERPROFILE ?? ".", ".cache");
  const cacheDir = join(cacheRoot, "nice-code", VERSION, target);
  const binary = join(cacheDir, `nice-code-engine${suffix}`);
  if (await exists(binary)) return binary;
  await mkdir(cacheDir, { recursive: true });
  const base =
    process.env.NICE_CODE_RELEASE_BASE_URL ??
    `https://github.com/${REPOSITORY}/releases/download/v${VERSION}`;
  const assetName = `nice-code-engine-${target}${suffix}`;
  const checksums = await fetch(`${base}/checksums.txt`);
  if (!checksums.ok)
    throw new Error(
      `Could not download Nice Code checksums (${checksums.status}). Set NICE_CODE_ENGINE or build the Rust engine locally.`,
    );
  const response = await fetch(`${base}/${assetName}`);
  if (!response.ok)
    throw new Error(
      `Could not download Nice Code engine (${response.status}). Set NICE_CODE_ENGINE or build the Rust engine locally.`,
    );
  const bytes = Buffer.from(await response.arrayBuffer());
  const actual = createHash("sha256").update(bytes).digest("hex");
  const expected = (await checksums.text())
    .split("\n")
    .find((line) => line.trimEnd().endsWith(`  ${assetName}`))
    ?.trim()
    .split(/\s+/)[0];
  if (!expected || expected !== actual)
    throw new Error("Nice Code engine checksum verification failed.");
  const temporary = `${binary}.tmp-${process.pid}`;
  await writeFile(temporary, bytes);
  await rename(temporary, binary);
  if (process.platform !== "win32") await chmod(binary, 0o755);
  return binary;
}

async function main() {
  const candidates = localCandidates();
  let engine;
  for (const candidate of candidates)
    if (await exists(candidate)) {
      engine = candidate;
      break;
    }
  engine ??= await downloadEngine();
  const result = spawnSync(engine, process.argv.slice(2), { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 2;
}

main().catch((error) => {
  console.error(
    `Nice Code: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 2;
});
