import { createHash } from "node:crypto";
import {
  access,
  copyFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { constants } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dir, "..");
const assetsDir = join(root, "release");
const targets = [
  ["aarch64-apple-darwin", ""],
  ["x86_64-apple-darwin", ""],
  ["aarch64-unknown-linux-gnu", ""],
  ["x86_64-unknown-linux-gnu", ""],
  ["x86_64-pc-windows-msvc", ".exe"],
] as const;

function fail(message: string): never {
  console.error(`Release failed: ${message}`);
  process.exit(1);
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error) fail(result.error.message);
  if (result.status !== 0)
    fail(`${command} exited with status ${result.status}`);
}

async function exists(path: string) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function normalizeVersion(value: string) {
  const version = value.replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))
    fail(`version must look like 0.1.0, received ${value}`);
  return version;
}

async function assertVersion(version: string) {
  const packageJson = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  );
  const cargo = await readFile(join(root, "engine", "Cargo.toml"), "utf8");
  if (packageJson.version !== version)
    fail(`package.json is ${packageJson.version}, expected ${version}`);
  if (
    !new RegExp(`^version = "${version.replaceAll(".", "\\.")}"`, "m").test(
      cargo,
    )
  )
    fail(`engine/Cargo.toml is not version ${version}`);
}

function currentTarget() {
  const key = `${process.platform}/${process.arch}`;
  const mapping: Record<string, string> = {
    "darwin/arm64": "aarch64-apple-darwin",
    "darwin/x64": "x86_64-apple-darwin",
    "linux/arm64": "aarch64-unknown-linux-gnu",
    "linux/x64": "x86_64-unknown-linux-gnu",
    "win32/x64": "x86_64-pc-windows-msvc",
  };
  return mapping[key] ?? fail(`unsupported host platform ${key}`);
}

async function prepare(version: string, target = currentTarget()) {
  await assertVersion(version);
  await mkdir(assetsDir, { recursive: true });
  const suffix = targets.find(([name]) => name === target)?.[1];
  if (suffix === undefined) fail(`unsupported release target ${target}`);
  run("cargo", [
    "build",
    "--release",
    "--manifest-path",
    "engine/Cargo.toml",
    "--target",
    target,
  ]);
  const source = join(
    root,
    "engine",
    "target",
    target,
    "release",
    `nice-code-engine${suffix}`,
  );
  const output = join(assetsDir, `nice-code-engine-${target}${suffix}`);
  if (!(await exists(source))) fail(`Cargo did not produce ${source}`);
  await copyFile(source, output);
  console.log(`Prepared ${output}`);
}

async function checksums() {
  const names = (await readdir(assetsDir))
    .filter(
      (name) =>
        name.startsWith("nice-code-engine-") && name !== "checksums.txt",
    )
    .sort();
  if (names.length !== targets.length)
    fail(`expected ${targets.length} platform binaries, found ${names.length}`);
  const lines = [];
  for (const name of names) {
    const bytes = await readFile(join(assetsDir, name));
    lines.push(`${createHash("sha256").update(bytes).digest("hex")}  ${name}`);
  }
  await writeFile(join(assetsDir, "checksums.txt"), `${lines.join("\n")}\n`);
}

async function publish(version: string) {
  await assertVersion(version);
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });
  if (status.stdout?.trim())
    fail("working tree is not clean; commit changes before releasing");
  await checksums();
  const tag = `v${version}`;
  const assets = (await readdir(assetsDir))
    .sort()
    .map((name) => join("release", name));
  run("gh", [
    "release",
    "create",
    tag,
    ...assets,
    "--title",
    tag,
    "--generate-notes",
  ]);
  console.log(
    `Published ${tag} with ${assets.length - 1} binaries and checksums.`,
  );
}

const [command, rawVersion, ...options] = process.argv.slice(2);
if (!command || !rawVersion || !["prepare", "publish"].includes(command))
  fail(
    "usage: bun scripts/release.mts <prepare|publish> <version> [--target <triple>]",
  );
const version = normalizeVersion(rawVersion);
if (command === "prepare") {
  const index = options.indexOf("--target");
  await prepare(version, index === -1 ? undefined : options[index + 1]);
} else {
  await publish(version);
}
