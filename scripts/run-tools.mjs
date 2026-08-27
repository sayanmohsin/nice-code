import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

function available(command) {
  try {
    execFileSync("which", [command], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function run(project, command, args) {
  try {
    const output = execFileSync(command, args, { cwd: project, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { command: [command, ...args].join(" "), status: "PASS", output: output.trim().slice(-2000) };
  } catch (error) {
    return {
      command: [command, ...args].join(" "),
      status: "FAIL",
      output: `${error.stdout ?? ""}${error.stderr ?? ""}`.trim().slice(-2000),
    };
  }
}

export function runNativeTools(project) {
  const results = [];
  if (existsSync(join(project, "Cargo.toml")) && available("cargo")) {
    results.push(run(project, "cargo", ["fmt", "--all", "--check"]));
  }
  if (existsSync(join(project, "tsconfig.json")) && existsSync(join(project, "node_modules/.bin/tsc"))) {
    results.push(run(project, join(project, "node_modules/.bin/tsc"), ["--noEmit"]));
  }
  if (existsSync(join(project, "biome.json")) && existsSync(join(project, "node_modules/.bin/biome"))) {
    results.push(run(project, join(project, "node_modules/.bin/biome"), ["check", "."]));
  }
  if (existsSync(join(project, "go.mod")) && available("go")) {
    results.push(run(project, "go", ["vet", "./..."]));
  }
  if (existsSync(join(project, "pubspec.yaml")) && available("dart")) {
    results.push(run(project, "dart", ["analyze"]));
  }
  return results;
}
