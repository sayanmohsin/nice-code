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
  function addIfProject(manifest, command, args) {
    if (!existsSync(join(project, manifest))) return;
    results.push(available(command)
      ? run(project, command, args)
      : { command: [command, ...args].join(" "), status: "SKIPPED", output: `${command} is not installed` });
  }
  addIfProject("Cargo.toml", "cargo", ["fmt", "--all", "--check"]);
  if (existsSync(join(project, "tsconfig.json"))) {
    const command = join(project, "node_modules/.bin/tsc");
    results.push(existsSync(command)
      ? run(project, command, ["--noEmit"])
      : { command: `${command} --noEmit`, status: "SKIPPED", output: "local TypeScript is not installed" });
  }
  if (existsSync(join(project, "biome.json"))) {
    const command = join(project, "node_modules/.bin/biome");
    results.push(existsSync(command)
      ? run(project, command, ["check", "."])
      : { command: `${command} check .`, status: "SKIPPED", output: "local Biome is not installed" });
  }
  addIfProject("go.mod", "go", ["vet", "./..."]);
  addIfProject("pubspec.yaml", "dart", ["analyze"]);
  return results;
}
