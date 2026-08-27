import { finding, isCodeFile, lineNumber } from "./helpers.mjs";

const source = "https://microsoft.github.io/rust-guidelines/guidelines/universal/";

export const checks = [
  {
    id: "AP-LOG-001",
    title: "Secret-bearing log expression",
    category: "logging",
    severity: "critical",
    source,
    run(file) {
      if (!isCodeFile(file, [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".rs", ".go", ".dart"])) {
        return [];
      }
      const results = [];
      const pattern = /(?:console\.|logger\.|tracing::|log::|println!|eprintln!)[^\n]*(?:token|password|secret|authorization|api[_-]?key)/gi;
      for (const match of file.content.matchAll(pattern)) {
        results.push(finding(this, file, lineNumber(file.content, match.index), "Log expression may expose a credential or sensitive value.", "FAIL"));
      }
      return results;
    },
  },
  {
    id: "AP-LOG-002",
    title: "Unstructured production output",
    category: "logging",
    severity: "warning",
    source,
    run(file) {
      if (!isCodeFile(file, [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".rs", ".go", ".dart"])) {
        return [];
      }
      const results = [];
      const pattern = /(?:console\.(?:log|info|warn|error)|println!|eprintln!|fmt\.Println)\s*\(/g;
      for (const match of file.content.matchAll(pattern)) {
        results.push(finding(this, file, lineNumber(file.content, match.index), "Review whether this output is structured, contextual, and appropriate for production.", "REVIEW"));
      }
      return results;
    },
  },
];
