import { finding, isCodeFile, lineNumber } from "./helpers.mjs";

export const checks = [
  {
    id: "AP-PERF-001",
    title: "Chained collection passes",
    category: "performance",
    severity: "warning",
    source: "https://developer.mozilla.org/en-US/docs/Web/Performance",
    run(file) {
      if (!isCodeFile(file, [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"])) {
        return [];
      }
      const results = [];
      const pattern = /\.(?:filter|map|flatMap)\s*\([^\n]*\)\s*\.(?:filter|map|flatMap)\s*\(/g;
      for (const match of file.content.matchAll(pattern)) {
        results.push(finding(this, file, lineNumber(file.content, match.index), "Multiple collection passes may be intentional; review allocation cost and measure before changing it.", "REVIEW"));
      }
      return results;
    },
  },
];
