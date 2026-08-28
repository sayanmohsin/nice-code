import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const defaultConfig = {
  profiles: ["default"],
  ignore: [],
  severity: {},
  exceptions: [],
};

export function loadConfig(project) {
  const path = join(project, ".nice-code.json");
  if (!existsSync(path)) return { ...defaultConfig, path: null };
  try {
    const user = JSON.parse(readFileSync(path, "utf8"));
    if (user.exceptions !== undefined && (!Array.isArray(user.exceptions) || user.exceptions.some((exception) => (
      !exception || typeof exception.id !== "string" || exception.id.length === 0
      || typeof exception.reason !== "string" || exception.reason.trim().length === 0
    )))) {
      throw new Error("exceptions must contain an id and a non-empty reason");
    }
    return {
      ...defaultConfig,
      ...user,
      profiles: user.profiles ?? defaultConfig.profiles,
      ignore: user.ignore ?? defaultConfig.ignore,
      severity: user.severity ?? defaultConfig.severity,
      exceptions: user.exceptions ?? defaultConfig.exceptions,
      path,
    };
  } catch (error) {
    throw new Error(`Invalid .nice-code.json: ${error.message}`);
  }
}

function matches(pattern, value) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
  return new RegExp(`^${escaped}$`).test(value);
}

export function isIgnored(config, file) {
  return config.ignore.some((pattern) => matches(pattern, file));
}

export function isException(config, item) {
  return config.exceptions.some((exception) => (
    exception.id === item.id
    && (!exception.file || matches(exception.file, item.file))
  ));
}

export function applyConfig(config, findings) {
  return findings
    .filter((item) => !isException(config, item))
    .map((item) => ({
      ...item,
      severity: config.severity[item.id] ?? item.severity,
    }));
}
