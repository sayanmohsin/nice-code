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
    source: check.source,
  };
}

export function lineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

export function isCodeFile(file, extensions) {
  return extensions.some((extension) => file.path.endsWith(extension));
}
