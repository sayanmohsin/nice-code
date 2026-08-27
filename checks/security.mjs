import { finding, isCodeFile, isTestLikePath, lineNumber } from "./helpers.mjs";

export const checks = [
  {
    id: "AP-SEC-001",
    title: "Possible hardcoded secret",
    category: "security",
    severity: "critical",
    source: "https://docs.aws.amazon.com/wellarchitected/latest/framework/security.html",
    run(file) {
      if (!isCodeFile(file, [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".rs", ".go", ".dart", ".yaml", ".yml", ".json"])) {
        return [];
      }
      const results = [];
      const pattern = /(?:password|secret|token|api[_-]?key|access[_-]?token)\s*[:=]\s*["'][^"']{6,}["']/gi;
      for (const match of file.content.matchAll(pattern)) {
        if (/example|placeholder|dummy|fake|fixture|test-secret|changeme|not-a-real/i.test(match[0])) {
          continue;
        }
        const testLike = isTestLikePath(file.path);
        const result = finding(this, file, lineNumber(file.content, match.index), "Possible hardcoded credential; use an approved secret boundary or an unmistakable fixture value.", testLike ? "REVIEW" : "FAIL");
        if (testLike) result.severity = "warning";
        results.push(result);
      }
      return results;
    },
  },
];
