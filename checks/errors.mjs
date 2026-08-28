import { finding, isCodeFile, isTestLikePath, lineNumber } from "./helpers.mjs";

export const checks = [
  {
    id: "AP-ERR-001",
    title: "Empty catch block",
    category: "errors",
    severity: "critical",
    source: "https://google.github.io/eng-practices/review/reviewer/looking-for.html",
    run(file) {
      if (!isCodeFile(file, [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"])) {
        return [];
      }
      const results = [];
      const pattern = /catch\s*(?:\([^)]*\))?\s*\{\s*(?:\/\/[^\n]*\s*)?\}/g;
      for (const match of file.content.matchAll(pattern)) {
        if (isIntentionalCatch(match[0])) continue;
        const testLike = isTestLikePath(file.path);
        const result = finding(this, file, lineNumber(file.content, match.index), "Failure is discarded; classify, propagate, or document why ignoring it is safe.", testLike ? "REVIEW" : "FAIL");
        if (testLike) result.severity = "warning";
        results.push(result);
      }
      return results;
    },
  },
  {
    id: "AP-ERR-002",
    title: "Catch only prints failure",
    category: "errors",
    severity: "warning",
    source: "https://go.dev/wiki/CodeReviewComments",
    run(file) {
      if (!isCodeFile(file, [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"])) {
        return [];
      }
      const results = [];
      const pattern = /catch\s*(?:\([^)]*\))?\s*\{[^{}]*(?:console\.|logger\.)[^{}]*\}/g;
      for (const match of file.content.matchAll(pattern)) {
        results.push(finding(this, file, lineNumber(file.content, match.index), "Logging a caught error is not enough; preserve the failure semantics for the caller.", "REVIEW"));
      }
      return results;
    },
  },
];

function isIntentionalCatch(value) {
  return /(?:intentional|expected|optional|best[- ]effort|safe to ignore|not applicable|non-fatal|enhancement|unavailable|not json|file not accessible|invalid session|not (?:be )?loaded|doesn['’]t exist|already removed|otel failures|skip span attributes|supplementary|missing persisted|corrupted|docker not available|fall through)/i.test(value);
}
