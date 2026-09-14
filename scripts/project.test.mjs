import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const script = join(process.cwd(), "scripts", "project.mjs");

function advise(project) {
  return JSON.parse(execFileSync(process.execPath, [script, "advise", "--project", project, "--format", "json"], { encoding: "utf8" }));
}

test("advisor detects Java and Spring Boot and recommends the managed skill", () => {
  const project = mkdtempSync(join(tmpdir(), "nice-code-java-"));
  mkdirSync(join(project, "src/main/java/example"), { recursive: true });
  writeFileSync(join(project, "src/main/java/example/Application.java"), "@SpringBootApplication class Application {}\n");
  writeFileSync(join(project, "pom.xml"), "<artifactId>spring-boot-starter-parent</artifactId>\n");
  const result = advise(project);
  assert.deepEqual(result.detected.ecosystems, ["java", "spring-boot"]);
  assert.equal(result.detected.recommendedSkills[0].id, "java-spring-boot");
  rmSync(project, { recursive: true, force: true });
});

test("advisor detects plain Java without recommending Spring-specific context", () => {
  const project = mkdtempSync(join(tmpdir(), "nice-code-java-"));
  writeFileSync(join(project, "Main.java"), "class Main {}\n");
  const result = advise(project);
  assert.deepEqual(result.detected.ecosystems, ["java"]);
  assert.equal(result.detected.recommendedSkills[0].id, "java-spring-boot");
  assert.equal(result.detected.springBoot, false);
  rmSync(project, { recursive: true, force: true });
});
