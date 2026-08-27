import { finding, isCodeFile, lineNumber } from "./helpers.mjs";

export const checks = [
  {
    id: "AP-ASYNC-001",
    title: "Likely sequential independent awaits",
    category: "async",
    severity: "warning",
    source: "https://vercel.com/blog/introducing-react-best-practices",
    run(file) {
      if (!isCodeFile(file, [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"])) {
        return [];
      }
      const awaitLines = [...file.content.matchAll(/^\s*(?:const|let|var)\s+[^\n]*=\s*await\s+/gm)];
      if (awaitLines.length < 2 || /Promise\.all\s*\(/.test(file.content)) {
        return [];
      }
      return [finding(this, file, lineNumber(file.content, awaitLines[1].index), "Multiple awaits may be independent; verify dependency order and consider bounded parallelism.", "REVIEW")];
    },
  },
];
