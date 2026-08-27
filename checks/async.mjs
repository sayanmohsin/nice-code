import { finding, isCodeFile, isTestLikePath, lineNumber } from "./helpers.mjs";

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
      if (isTestLikePath(file.path) || /Promise\.all\s*\(/.test(file.content)) {
        return [];
      }
      const awaits = [...file.content.matchAll(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+([^\n;]+)/gm)];
      for (let index = 1; index < awaits.length; index += 1) {
        const previousNames = awaits.slice(0, index).map((match) => match[1]);
        const expression = awaits[index][2];
        if (!previousNames.some((name) => new RegExp(`\\b${name}\\b`).test(expression))) {
          return [finding(this, file, lineNumber(file.content, awaits[index].index), "Multiple awaits may be independent; verify dependency order and consider bounded parallelism.", "REVIEW")];
        }
      }
      return [];
    },
  },
];
