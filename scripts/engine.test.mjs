import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const binary = join(root, "engine", "target", "debug", `nice-code-engine${process.platform === "win32" ? ".exe" : ""}`);
const localEnv = { ...process.env, NICE_CODE_KNOWLEDGE_ROOT: join(root, "knowledge") };
for (const name of ["CI", "GITHUB_ACTIONS", "GITHUB_EVENT_NAME", "GITHUB_EVENT_PATH", "GITHUB_SHA", "GITLAB_CI", "TF_BUILD", "BUILDKITE", "CIRCLECI"]) delete localEnv[name];

function fixture(t, git = false) {
  const path = realpathSync(mkdtempSync(join(tmpdir(), "nice-code-engine-")));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  const repo = {
    path,
    write(name, content) {
      const target = join(path, name);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, typeof content === "string" ? content : JSON.stringify(content));
    },
    git(...args) { return execFileSync("git", ["-C", path, ...args], { encoding: "utf8", env: { ...localEnv, GIT_CONFIG_NOSYSTEM: "1" } }).trim(); },
    commit() { this.git("add", "."); this.git("commit", "-qm", "fixture"); return this.git("rev-parse", "HEAD"); },
    run(args = [], env = {}, project = path) {
      const result = spawnSync(binary, ["--project", project, "--json", ...args], { encoding: "utf8", cwd: root, env: { ...localEnv, ...env } });
      assert.ifError(result.error);
      return { ...result, report: result.stdout ? JSON.parse(result.stdout) : null };
    },
    event(name, payload, sha) {
      this.write("event.json", payload);
      return { CI: "true", GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: name, GITHUB_EVENT_PATH: join(path, "event.json"), GITHUB_SHA: sha };
    },
  };
  if (git) {
    repo.git("init", "-q", "-b", "main");
    repo.git("config", "user.name", "Nice Code tests");
    repo.git("config", "user.email", "tests@example.invalid");
    repo.git("config", "commit.gpgsign", "false");
    repo.write("initial.ts", "export const value = 1;\n");
    repo.commit();
  }
  return repo;
}

test("changed discovery includes nested untracked files, staged and unstaged files, and rename destinations", (t) => {
  const f = fixture(t, true);
  f.write("rename.ts", "export const renamed = 1;\n");
  f.write("deleted.ts", "export const deleted = 1;\n");
  f.write(".gitignore", "ignored/\n");
  f.commit();
  f.git("mv", "rename.ts", "renamed.ts");
  f.git("rm", "-q", "deleted.ts");
  f.write("initial.ts", "export const value = 2;\n");
  f.write("staged.ts", "export const staged = true;\n");
  f.git("add", "staged.ts");
  f.write("src/new directory/new file.ts", "export const fresh = true;\n");
  f.write("ignored/hidden.ts", "console.log(password);\n");
  const { status, report } = f.run();
  assert.equal(status, 0);
  assert.deepEqual(report.filesScanned, ["initial.ts", "renamed.ts", "src/new directory/new file.ts", "staged.ts"]);
  assert.equal(report.comparison.source, "working-tree");
  assert.deepEqual(f.run([], {}, join(f.path, "src")).report.filesScanned, ["new directory/new file.ts"]);
});

test("clean and unborn repositories have valid local scans", (t) => {
  const clean = fixture(t, true);
  assert.deepEqual(clean.run().report.filesScanned, []);
  const fresh = fixture(t);
  fresh.git("init", "-q");
  fresh.write("staged.ts", "export const value = 1;");
  fresh.git("add", "staged.ts");
  fresh.write("new/nested.ts", "export const other = 2;");
  assert.deepEqual(fresh.run().report.filesScanned, ["new/nested.ts", "staged.ts"]);
});

test("CI detects a committed critical finding in a clean push checkout", (t) => {
  const f = fixture(t, true);
  const base = f.git("rev-parse", "HEAD");
  f.write("src/helper.ts", "export const helper = true;");
  f.commit();
  f.write("src/auth.ts", 'const password = "live-value-012345";\n');
  const head = f.commit();
  const env = f.event("push", { ref: "refs/heads/main", before: base, after: head }, head);
  const { status, report } = f.run(["--ci"], env);
  assert.equal(status, 1);
  assert.deepEqual(report.filesScanned, ["src/auth.ts", "src/helper.ts"]);
  assert.deepEqual(report.comparison, { source: "github-push", base, target: head });
  assert.equal(report.exit.blocked, true);
});

test("PR merge and head checkouts exclude unrelated base changes", (t) => {
  const f = fixture(t, true);
  f.git("checkout", "-qb", "feature");
  f.write("feature.ts", "export const feature = true;");
  const head = f.commit();
  f.git("checkout", "-q", "main");
  f.write("base-only.ts", "export const baseOnly = true;");
  const base = f.commit();
  f.git("merge", "--no-ff", "-qm", "merge fixture", "feature");
  const merge = f.git("rev-parse", "HEAD");
  const env = f.event("pull_request", { pull_request: { base: { sha: base }, head: { sha: head } } }, merge);
  const merged = f.run(["--ci"], env);
  assert.equal(merged.status, 0);
  assert.equal(merged.report.comparison.source, "github-pull-request-merge");
  assert.deepEqual(merged.report.filesScanned, ["feature.ts"]);
  f.git("checkout", "-q", "feature");
  const unmerged = f.run(["--ci"], env);
  assert.equal(unmerged.status, 0);
  assert.equal(unmerged.report.comparison.source, "github-pull-request-head");
  assert.deepEqual(unmerged.report.filesScanned, ["feature.ts"]);
});

test("push uses endpoint comparison for a force push", (t) => {
  const f = fixture(t, true);
  f.write("changed.ts", "export const value = 0;");
  const common = f.commit();
  f.write("changed.ts", "export const value = 1;");
  const before = f.commit();
  f.git("checkout", "-qb", "replacement", common);
  f.write("new.ts", "export const fresh = true;");
  const after = f.commit();
  const result = f.run(["--ci"], f.event("push", { ref: "refs/heads/main", before, after, forced: true }, after));
  assert.equal(result.status, 0);
  assert.equal(result.report.comparison.base, before);
  assert.deepEqual(result.report.filesScanned, ["changed.ts", "new.ts"]);
});

test("invalid CI context errors, while explicit overrides bypass event metadata", (t) => {
  const f = fixture(t, true);
  const head = f.git("rev-parse", "HEAD");
  const events = [
    ["push", { ref: "refs/heads/main", before: "0".repeat(40), after: head }],
    ["push", { ref: "refs/heads/main", before: "f".repeat(40), after: head }],
    ["push", { ref: "refs/heads/main", before: head, after: "f".repeat(40) }],
    ["push", { ref: "refs/heads/main", before: head, after: head, deleted: true }],
    ["push", { ref: "refs/tags/v1", before: head, after: head }],
    ["pull_request", {}],
    ["workflow_dispatch", {}],
  ];
  for (const [name, payload] of events) {
    const env = f.event(name, payload, head);
    const result = f.run(["--ci"], env);
    assert.equal(result.status, 2, `${name}: ${JSON.stringify(payload)}`);
    assert.match(result.stderr, /fetch-depth: 0.*--base/);
    assert.equal(f.run(["--ci", "--base", head], env).status, 0);
  }
  assert.equal(f.run(["--ci"], { CI: "true" }).status, 2);
  assert.equal(f.run(["--ci"], { GITHUB_ACTIONS: "true" }).status, 2);
  assert.equal(f.run(["--base", "--invalid"]).status, 2);
  assert.equal(f.run(["--base", "missing"]).status, 2);
  assert.equal(f.run(["--all", "--base", head]).status, 2);
  assert.equal(f.run(["--all", "--ci"], { CI: "true" }).status, 0);
  assert.deepEqual(f.run(["--ci", "--base", head]).report.filesScanned, []);
  const env = f.event("push", { ref: "refs/heads/main", before: head, after: head }, head);
  assert.deepEqual(f.run(["--ci"], env).report.filesScanned, []);
  f.write("event.json", "{");
  assert.equal(f.run(["--ci"], env).status, 2);
});

test("an ambiguous PR merge base produces a setup error", (t) => {
  const f = fixture(t, true);
  const initial = f.git("rev-parse", "HEAD");
  const tree = f.git("rev-parse", "HEAD^{tree}");
  const left = f.git("commit-tree", tree, "-p", initial, "-m", "left");
  const right = f.git("commit-tree", tree, "-p", initial, "-m", "right");
  const base = f.git("commit-tree", tree, "-p", left, "-p", right, "-m", "base");
  const head = f.git("commit-tree", tree, "-p", right, "-p", left, "-m", "head");
  f.git("checkout", "-q", "--detach", head);
  const result = f.run(["--ci"], f.event("pull_request", { pull_request: { base: { sha: base }, head: { sha: head } } }, head));
  assert.equal(result.status, 2);
  assert.match(result.stderr, /multiple merge bases/);
});

test("native checks still run when a valid CI comparison is empty", { skip: process.platform === "win32" }, (t) => {
  const f = fixture(t, true);
  const head = f.git("rev-parse", "HEAD");
  f.write("mvnw", "#!/bin/sh\nexit 1\n");
  chmodSync(join(f.path, "mvnw"), 0o755);
  const result = f.run(["--ci"], f.event("push", { ref: "refs/heads/main", before: head, after: head }, head));
  assert.equal(result.status, 1);
  assert.deepEqual(result.report.filesScanned, []);
  assert.equal(result.report.nativeTools[0].status, "FAIL");
});

test("a shallow CI checkout reports missing comparison history", (t) => {
  const f = fixture(t, true);
  const before = f.git("rev-parse", "HEAD");
  f.write("next.ts", "export const next = true;");
  const after = f.commit();
  const clone = resolve(f.path, "..", `${f.path.split(/[\\/]/).at(-1)}-shallow`);
  t.after(() => rmSync(clone, { recursive: true, force: true }));
  execFileSync("git", ["clone", "-q", "--depth=1", `file://${f.path}`, clone]);
  const result = f.run(["--ci"], f.event("push", { ref: "refs/heads/main", before, after }, after), clone);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Fetch the required Git history/);
});

test("security findings remain active in production names and beside Rust inline tests", (t) => {
  const f = fixture(t);
  f.write("src/latest.ts", 'const password = "live-value-012345";');
  f.write("src/inspection.ts", 'console.log("password", password);');
  f.write("src/auth.rs", 'fn production() {\n let password = "live-value-012345";\n}\n#[cfg(test)]\nmod tests {\n const TOKEN: &str = "live-value-012345";\n}\n');
  f.write("src/auth.test.ts", 'const password = "live-value-012345";');
  const { report } = f.run(["--all"]);
  const credentials = report.findings.filter((item) => item.id === "AP-SEC-001");
  assert.deepEqual(credentials.map((item) => [item.file, item.line, item.fileClass]), [["src/auth.rs", 2, "production"], ["src/latest.ts", 1, "production"]]);
  assert.ok(report.findings.some((item) => item.id === "AP-LOG-001" && item.file === "src/inspection.ts"));
});

test("custom includeTests controls inline Rust tests and reports their class", (t) => {
  const f = fixture(t);
  f.write("src/auth.rs", '#[cfg(test)]\nmod tests {\n const MARKER: &str = "legacy";\n}\n');
  const rule = { id: "CUSTOM-SCOPE-001", title: "Legacy marker", matcher: "legacy", message: "Replace marker.", includeTests: false };
  f.write(".nice-code/checks.json", { checks: [rule] });
  assert.equal(f.run(["--all"]).report.findings.length, 0);
  f.write(".nice-code/checks.json", { checks: [{ ...rule, includeTests: true }] });
  const custom = f.run(["--all"]).report.findings;
  assert.equal(custom.length, 1);
  assert.equal(custom[0].fileClass, "test");
  assert.equal(custom[0].line, 3);
  f.write("src/auth.rs", 'mod auth { #[test] fn check() { let marker = "legacy"; } fn real() {} }');
  assert.equal(f.run(["--all"]).report.findings[0].fileClass, "test");
  rmSync(join(f.path, ".nice-code/checks.json"));
  f.write(".nice-code/rules/team.md", "---\nchecks:\n  - id: CUSTOM-SCOPE-001\n    title: Legacy marker\n    matcher: legacy\n    message: Replace marker.\n    includeTests: true\n---\n");
  execFileSync(process.execPath, [join(root, "scripts/rules.mjs"), "compile", "--project", f.path, "--apply"], { env: localEnv });
  const compiled = JSON.parse(readFileSync(join(f.path, ".nice-code/checks.json"), "utf8"));
  assert.equal(compiled.checks[0].includeTests, true);
  assert.equal(f.run(["--all"]).report.findings[0].fileClass, "test");
});

test("settings apply to engine, packaged, and custom rules before blocking, including cached runs", (t) => {
  const f = fixture(t, true);
  f.write("src/auth.ts", 'const password = "live-value-012345";');
  f.write("src/App.java", 'class App { void run() { System.out.println("legacy"); } }');
  f.write(".nice-code/checks.json", { checks: [{ id: "CUSTOM-LEGACY-001", title: "Legacy marker", matcher: "legacy", message: "Replace marker.", severity: "critical", status: "FAIL" }] });
  const env = { XDG_CACHE_HOME: join(f.path, "cache") };
  assert.equal(f.run(["--cache"], env).status, 1);
  f.write(".nice-code.json", { severity: { "AP-SEC-001": "review", "CUSTOM-LEGACY-001": "review" }, exceptions: [{ patternId: "AP-LOG-003", path: "src/App.java", reason: "Reviewed bootstrap output." }] });
  const adjusted = f.run(["--cache"], env);
  assert.equal(adjusted.status, 0);
  assert.equal(adjusted.report.findings.some((item) => item.id === "AP-LOG-003"), false);
  assert.ok(adjusted.report.findings.every((item) => item.status === "REVIEW"));
  assert.deepEqual(adjusted.report.findings, f.run(["--no-cache"]).report.findings);
  const ids = ["AP-SEC-001", "AP-LOG-003", "CUSTOM-LEGACY-001"];
  f.write(".nice-code.json", { severity: Object.fromEntries(ids.map((id) => [id, "pass"])) });
  const passed = f.run(["--cache"], env);
  assert.equal(passed.status, 0);
  assert.equal(passed.report.summary.pass, 3);
  f.write(".nice-code.json", { exceptions: ids.map((patternId) => ({ patternId, path: "src/**", reason: "Reviewed regression case." })) });
  const exempted = f.run(["--cache"], env);
  assert.equal(exempted.status, 0);
  assert.equal(exempted.report.findings.length, 0);
  f.write(".nice-code.json", {});
  assert.equal(f.run(["--cache"], env).status, 1);
});

test("configured profiles control matching and report output", (t) => {
  const f = fixture(t);
  f.write("tsconfig.json", "{}");
  f.write("src/value.ts", 'export const value = "legacy";');
  f.write(".nice-code/checks.json", { checks: [{ id: "CUSTOM-PROFILE-001", title: "Marker", matcher: "legacy", message: "Review marker.", appliesTo: ["selected"] }] });
  assert.equal(f.run(["--all"]).report.findings.length, 0);
  f.write(".nice-code.json", { profiles: ["selected"] });
  const result = f.run(["--all"]).report;
  assert.deepEqual(result.activeProfiles, ["selected"]);
  assert.equal(result.detected.typescript, true);
  assert.equal(result.findings[0].id, "CUSTOM-PROFILE-001");
});

const detectionCases = JSON.parse(readFileSync(join(root, "fixtures/detection.json"), "utf8"));
for (const scenario of detectionCases) {
  test(`engine and advisor agree: ${scenario.name}`, (t) => {
    const f = fixture(t);
    for (const [name, content] of Object.entries(scenario.files)) f.write(name, content);
    const report = f.run(["--all"]).report;
    const advisor = JSON.parse(execFileSync(process.execPath, [join(root, "scripts/project.mjs"), "advise", "--project", f.path, "--format", "json"], { encoding: "utf8", env: localEnv }));
    assert.deepEqual(advisor.detected.ecosystems, scenario.ecosystems);
    assert.deepEqual(report.detected.profiles.filter((profile) => !["default", "web"].includes(profile)), scenario.ecosystems);
    assert.equal(report.detected.profiles.includes("web"), advisor.detected.web);
  });
}
