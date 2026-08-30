#!/usr/bin/env bun

import { dirname, join, resolve } from "node:path";

const VERSION = "0.1.0";
const REPOSITORY = "sayanmohsin/nice-code";

function platformTarget(): { target: string; suffix: string } {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === "darwin" && arch === "arm64") return { target: "aarch64-apple-darwin", suffix: "" };
  if (platform === "darwin" && arch === "x64") return { target: "x86_64-apple-darwin", suffix: "" };
  if (platform === "linux" && arch === "arm64") return { target: "aarch64-unknown-linux-gnu", suffix: "" };
  if (platform === "linux" && arch === "x64") return { target: "x86_64-unknown-linux-gnu", suffix: "" };
  if (platform === "win32" && arch === "x64") return { target: "x86_64-pc-windows-msvc", suffix: ".exe" };
  throw new Error(`Nice Code has no prebuilt engine for ${platform}/${arch}. Set NICE_CODE_ENGINE to a local binary.`);
}

function localCandidates(): string[] {
  const root = resolve(dirname(import.meta.dir));
  const suffix = process.platform === "win32" ? ".exe" : "";
  return [
    process.env.NICE_CODE_ENGINE,
    join(root, "engine", "target", "release", `nice-code-engine${suffix}`),
    join(root, "engine", "target", "debug", `nice-code-engine${suffix}`),
  ].filter((path): path is string => Boolean(path));
}

async function downloadEngine(): Promise<string> {
  const { target, suffix } = platformTarget();
  const cacheRoot = process.env.XDG_CACHE_HOME ?? (process.env.LOCALAPPDATA ?? join(process.env.HOME ?? process.env.USERPROFILE ?? ".", ".cache"));
  const cacheDir = join(cacheRoot, "nice-code", VERSION, target);
  const binary = join(cacheDir, `nice-code-engine${suffix}`);
  if (await Bun.file(binary).exists()) return binary;
  await Bun.write(join(cacheDir, ".download-started"), "");
  const base = process.env.NICE_CODE_RELEASE_BASE_URL ?? `https://github.com/${REPOSITORY}/releases/download/v${VERSION}`;
  const asset = `${base}/nice-code-engine-${target}${suffix}`;
  const checksums = await fetch(`${base}/checksums.txt`);
  if (!checksums.ok) throw new Error(`Could not download Nice Code checksums (${checksums.status}). Set NICE_CODE_ENGINE or build the engine locally.`);
  const checksumText = await checksums.text();
  const response = await fetch(asset);
  if (!response.ok) throw new Error(`Could not download Nice Code engine (${response.status}). Set NICE_CODE_ENGINE or build the engine locally.`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const actual = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  const expected = checksumText.split("\n").find((line) => line.endsWith(`  nice-code-engine-${target}${suffix}`))?.split(/\s+/)[0];
  if (!expected || expected !== actual) throw new Error("Nice Code engine checksum verification failed.");
  await Bun.write(binary, bytes);
  if (process.platform !== "win32") Bun.spawnSync(["chmod", "+x", binary]);
  return binary;
}

async function main() {
  const candidates = localCandidates();
  const availability = await Promise.all(candidates.map((path) => Bun.file(path).exists()));
  let engine = candidates.find((_path, index) => availability[index]);
  if (!engine) engine = await downloadEngine();
  const result = Bun.spawnSync([engine, ...Bun.argv.slice(2)], { stdout: "inherit", stderr: "inherit" });
  process.exit(result.exitCode);
}

main().catch((error) => {
  console.error(`Nice Code: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
});
