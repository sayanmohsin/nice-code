import { finding, isCodeFile, lineNumber } from "./helpers.mjs";

export const checks = [
  {
    id: "AP-TEST-001",
    title: "Tautological test assertion",
    category: "testing",
    severity: "warning",
    source: "https://microsoft.github.io/rust-guidelines/guidelines/ai/",
    run(file) {
      if (!isCodeFile(file, [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"])) {
        return [];
      }
      const results = [];
      const pattern = /expect\(\s*([^\n]+?)\s*\)\.to(?:Be|Equal)\(\s*\1\s*\)/g;
      for (const match of file.content.matchAll(pattern)) {
        results.push(finding(this, file, lineNumber(file.content, match.index), "The assertion repeats the same expression and may not protect behavior.", "REVIEW"));
      }
      return results;
    },
  },
];
