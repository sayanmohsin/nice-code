export function finding(check, file, line, message, status = "WARN") {
  return {
    id: check.id,
    title: check.title,
    category: check.category,
    severity: check.severity,
    status,
    file: file.path,
    line,
    message,
    fileClass: classifyPath(file.path),
    source: check.source,
  };
}

export function lineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

export function isCodeFile(file, extensions) {
  return extensions.some((extension) => file.path.endsWith(extension));
}

export function isTestLikePath(path) {
  return /(?:^|[\\/])(?:test|tests|spec|specs|fixtures?|examples?|__tests__|__fixtures__|mocks?)(?:[\\/]|\.|$)/i.test(path)
    || /(?:\.test|\.spec)\.[^.]+$/i.test(path);
}

export function classifyPath(path) {
  if (isTestLikePath(path)) return "test";
  if (/(?:^|[\\/])(?:generated|gen|dist|build|coverage)(?:[\\/]|\.|$)/i.test(path)) return "generated";
  if (/(?:^|[\\/])(?:examples?|fixtures?)(?:[\\/]|\.|$)/i.test(path)) return "example";
  if (/(?:^|[\\/])migrations?(?:[\\/]|\.|$)/i.test(path)) return "migration";
  return "production";
}
