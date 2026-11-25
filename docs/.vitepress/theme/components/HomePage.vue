<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { withBase } from "vitepress";

const installCommand = "npm install -g @sayanmohsin/nice-code";
const modes = [
  {
    id: "local",
    label: "Local review",
    command: "nice-code --changed --include-review",
  },
  { id: "ci", label: "CI", command: "nice-code --ci --format sarif" },
  { id: "agent", label: "Agents", command: "nice-code --changed --agent" },
] as const;
const selectedMode = ref<(typeof modes)[number]["id"]>("local");
const mode = computed(() =>
  modes.find((item) => item.id === selectedMode.value)!,
);
const copyState = ref("Copy");
let copyTimer: ReturnType<typeof setTimeout> | undefined;

async function copyInstall() {
  clearTimeout(copyTimer);
  try {
    await navigator.clipboard.writeText(installCommand);
    copyState.value = "Copied!";
  } catch {
    copyState.value = "Select to copy";
  }
  copyTimer = setTimeout(() => {
    copyState.value = "Copy";
  }, 2400);
}
onBeforeUnmount(() => clearTimeout(copyTimer));

const benefits = [
  {
    number: "01",
    title: "Start with your change.",
    description:
      "Review changed and untracked files by default. Keep a full scan for the moments that call for one.",
    link: "/cli",
    label: "Explore the CLI",
  },
  {
    number: "02",
    title: "Follow the evidence.",
    description:
      "Get a clear finding, its location, and a source. Use the pattern library to understand the reasoning behind it.",
    link: "/sources",
    label: "See the sources",
  },
  {
    number: "03",
    title: "Keep the judgment.",
    description:
      "Critical issues can block a change. Warnings and review findings give you the context to make the call.",
    link: "/findings",
    label: "Understand findings",
  },
];
const guides = [
  {
    label: "Get up and running",
    detail: "Install the CLI and review your first change.",
    link: "/getting-started",
    category: "QUICK START",
  },
  {
    label: "Bring it into CI",
    detail: "Review PR changes and publish SARIF reports.",
    link: "/ci",
    category: "GITHUB ACTIONS",
  },
  {
    label: "Work with your agent",
    detail: "Pair concise findings with focused guidance.",
    link: "/agent-integration",
    category: "AGENT WORKFLOWS",
  },
  {
    label: "Make it your own",
    detail: "Set profiles, exceptions, and project rules.",
    link: "/configuration",
    category: "CONFIGURATION",
  },
];
const sarifExample = `{
  "version": "2.1.0",
  "runs": [{
    "tool": { "driver": { "name": "Nice Code" } },
    "results": [{
      "ruleId": "AP-LOG-001",
      "level": "error",
      "message": {
        "text": "Log expression may expose a credential."
      }
    }]
  }]
}`;
const agentExample = `NICE_CODE status=BLOCKED mode=changed files=3 findings=1 blocked=true

FAIL AP-LOG-001 src/auth.ts:24 severity=critical category=logging :: Log expression may expose a credential or sensitive value.`;
</script>

<template>
  <div class="nc-home">
    <section class="nc-hero" aria-labelledby="home-heading">
      <div class="nc-intro">
        <div class="nc-eyebrow">
          <span class="nc-spark" aria-hidden="true">✳</span> SOURCE-BACKED
          ENGINEERING GUARDRAILS
        </div>
        <h1 id="home-heading">
          Give your code<br /><span>a second look.</span>
        </h1>
        <p class="nc-lead">
          Catch recurring engineering mistakes with focused checks and guidance
          you can trace back to the source.
        </p>
        <p class="nc-sublead">
          For your terminal, your coding agent, and your CI.
        </p>
        <div class="nc-actions">
          <a
            class="nc-button nc-button-primary"
            :href="withBase('/getting-started')"
            >Get started <span aria-hidden="true">→</span></a
          >
          <a class="nc-text-link" :href="withBase('/patterns')"
            >Explore the patterns <span aria-hidden="true">↗</span></a
          >
        </div>
        <div class="nc-install" aria-label="Install Nice Code">
          <span class="nc-dollar" aria-hidden="true">$</span>
          <code>{{ installCommand }}</code>
          <button
            type="button"
            :aria-label="
              copyState === 'Copied!'
                ? 'Install command copied'
                : 'Copy install command'
            "
            @click="copyInstall"
          >
            {{ copyState }}
          </button>
        </div>
        <span class="nc-sr-only" role="status">{{
          copyState === "Copied!"
            ? "Install command copied to clipboard."
            : copyState === "Select to copy"
              ? "Copy unavailable. Select the install command to copy it."
              : ""
        }}</span>
        <div class="nc-meta">
          <span>Node.js 20+</span><span aria-hidden="true">·</span
          ><span>Rust-powered engine</span><span aria-hidden="true">·</span
          ><span>MIT licensed</span>
        </div>
      </div>

      <div class="nc-demo">
        <div class="nc-demo-toolbar">
          <div class="nc-window-controls" aria-hidden="true">
            <i></i><i></i><i></i>
          </div>
          <span class="nc-demo-filename">nice-code / your-project</span>
          <span class="nc-demo-live">EXAMPLE</span>
        </div>
        <div class="nc-demo-modes" role="group" aria-label="Review workflow">
          <button
            v-for="item in modes"
            :key="item.id"
            type="button"
            :aria-pressed="selectedMode === item.id"
            @click="selectedMode = item.id"
          >
            {{ item.label }}
          </button>
          <span class="nc-demo-platform">CLI</span>
        </div>
        <div class="nc-demo-body" aria-live="polite" aria-atomic="true">
          <div class="nc-demo-command">
            <span aria-hidden="true">$</span><code>{{ mode.command }}</code>
          </div>
          <div v-if="selectedMode === 'local'" class="nc-local-output">
            <div class="nc-output-heading">
              <span class="nc-output-dot" aria-hidden="true"></span>2 findings
              <span>across 3 changed files</span>
            </div>
            <div class="nc-finding">
              <div class="nc-finding-meta">
                <span class="nc-status nc-status-fail">FAIL</span
                ><span>AP-LOG-001</span
                ><span class="nc-finding-line">auth.ts:24</span>
              </div>
              <p>A credential in a log expression.</p>
              <code class="nc-code-sample"
                >logger.info("session", { <mark>token</mark> });</code
              >
              <div class="nc-finding-note">
                Redact sensitive values at the logging boundary.
              </div>
            </div>
            <div class="nc-finding nc-finding-review">
              <div class="nc-finding-meta">
                <span class="nc-status nc-status-review">REVIEW</span
                ><span>AP-ASYNC-001</span
                ><span class="nc-finding-line">load.ts:42</span>
              </div>
              <p>Could these awaits run independently?</p>
              <div class="nc-finding-note">
                Check dependencies before changing execution order.
              </div>
            </div>
          </div>
          <pre
            v-else
            class="nc-machine-output"
          ><code>{{ selectedMode === 'ci' ? sarifExample : agentExample }}</code></pre>
        </div>
        <div class="nc-demo-footer">
          <span class="nc-tiny-check" aria-hidden="true">✓</span
          ><span v-if="selectedMode === 'local'"
            >A clear location. A useful question. A source to follow.</span
          ><span v-else-if="selectedMode === 'ci'"
            >SARIF reports for your existing code-scanning workflow.</span
          ><span v-else
            >Compact, line-oriented findings for the next agent step.</span
          >
        </div>
      </div>
    </section>

    <div class="nc-ecosystems" aria-label="Supported languages and frameworks">
      <span class="nc-ecosystem-label">AT HOME IN YOUR STACK</span>
      <div>
        <span>Rust</span><span>TypeScript</span><span>Go</span
        ><span>Java &amp; Spring</span><span>Dart</span><span>React</span>
      </div>
    </div>

    <section class="nc-principles" aria-labelledby="principles-heading">
      <div class="nc-section-intro">
        <div>
          <p class="nc-eyebrow">A THOUGHTFUL REVIEW LAYER</p>
          <h2 id="principles-heading">
            Small checks.<br />Useful conversations.
          </h2>
        </div>
        <p>
          Keep your formatter, compiler, and linter. Add a focused review of the
          patterns that need engineering context.
        </p>
      </div>
      <div class="nc-benefits">
        <article v-for="benefit in benefits" :key="benefit.number">
          <span class="nc-step-number">{{ benefit.number }}</span>
          <h3>{{ benefit.title }}</h3>
          <p>{{ benefit.description }}</p>
          <a :href="withBase(benefit.link)"
            >{{ benefit.label }} <span aria-hidden="true">→</span></a
          >
        </article>
      </div>
    </section>

    <section class="nc-patterns" aria-labelledby="patterns-heading">
      <div class="nc-patterns-copy">
        <p class="nc-eyebrow">GUIDANCE WITH A PAPER TRAIL</p>
        <h2 id="patterns-heading">Every pattern<br />has a reason.</h2>
        <p>
          Read the problem, the recommendation, and the tradeoffs. Follow the
          public source and decide how it applies to your project.
        </p>
        <a class="nc-text-link" :href="withBase('/patterns')"
          >Browse the pattern library <span aria-hidden="true">↗</span></a
        >
      </div>
      <div class="nc-pattern-list">
        <a :href="withBase('/patterns#logging-and-observability')"
          ><span class="nc-pattern-symbol" aria-hidden="true">{ }</span>
          <div>
            <strong>Logging &amp; observability</strong
            ><span>Useful context. Careful handling of sensitive data.</span>
          </div>
          <span class="nc-pattern-arrow" aria-hidden="true">↗</span></a
        >
        <a :href="withBase('/patterns#async-and-concurrency')"
          ><span class="nc-pattern-symbol" aria-hidden="true">↗</span>
          <div>
            <strong>Async &amp; concurrency</strong
            ><span>Dependencies, parallelism, and bounded work.</span>
          </div>
          <span class="nc-pattern-arrow" aria-hidden="true">↗</span></a
        >
        <a :href="withBase('/patterns#security-and-data-integrity')"
          ><span class="nc-pattern-symbol" aria-hidden="true">◈</span>
          <div>
            <strong>Security &amp; data integrity</strong
            ><span>Credentials, persistence, and safer boundaries.</span>
          </div>
          <span class="nc-pattern-arrow" aria-hidden="true">↗</span></a
        >
        <div class="nc-pattern-footnote">
          Patterns include examples, exceptions, and enforcement notes.
        </div>
      </div>
    </section>

    <section class="nc-guides" aria-labelledby="guides-heading">
      <div class="nc-guides-heading">
        <div>
          <p class="nc-eyebrow">PICK YOUR STARTING POINT</p>
          <h2 id="guides-heading">Make it part of your workflow.</h2>
        </div>
        <a class="nc-text-link" :href="withBase('/cli')"
          >CLI reference <span aria-hidden="true">↗</span></a
        >
      </div>
      <div class="nc-guide-grid">
        <a
          v-for="guide in guides"
          :key="guide.link"
          :href="withBase(guide.link)"
          class="nc-guide"
          ><span class="nc-guide-category">{{ guide.category }}</span>
          <h3>{{ guide.label }} <span aria-hidden="true">↗</span></h3>
          <p>{{ guide.detail }}</p></a
        >
      </div>
    </section>

    <section class="nc-bottom-cta" aria-label="Get started">
      <div>
        <span class="nc-spark" aria-hidden="true">✳</span>
        <h2>
          A useful second opinion.<br /><span
            >Start with your next change.</span
          >
        </h2>
      </div>
      <a
        class="nc-button nc-button-primary"
        :href="withBase('/getting-started')"
        >Read the quick start <span aria-hidden="true">→</span></a
      >
    </section>
  </div>
</template>

<style scoped>
.nc-home {
  --nc-accent: var(--vp-c-brand-1);
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
}
.nc-hero {
  display: grid;
  grid-template-columns: 1.02fr 1fr;
  align-items: center;
  gap: 56px;
  padding: 90px 0 70px;
}
.nc-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.5;
  font-weight: 650;
  letter-spacing: 1.6px;
}
.nc-spark {
  color: var(--nc-accent);
  font-size: 24px;
  line-height: 1;
}
h1 {
  margin: 25px 0 22px;
  color: var(--vp-c-text-1);
  font-size: clamp(44px, 4.7vw, 65px);
  font-weight: 650;
  letter-spacing: -3.5px;
  line-height: 1.06;
}
h1 span {
  color: var(--nc-accent);
}
.nc-lead {
  max-width: 470px;
  color: var(--vp-c-text-2);
  font-size: 17px;
  line-height: 1.75;
}
.nc-sublead {
  margin-top: 13px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.7;
}
.nc-actions {
  display: flex;
  align-items: center;
  gap: 23px;
  margin-top: 30px;
}
.nc-button {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  gap: 25px;
  min-height: 46px;
  padding: 11px 19px;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 13px;
  line-height: 1.6;
  font-weight: 650;
  transition:
    background 160ms,
    transform 160ms;
}
.nc-button-primary {
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
  box-shadow: 0 2px 2px #00000009;
}
.nc-button-primary:hover {
  background: var(--vp-button-brand-hover-bg);
  transform: translateY(-1px);
}
.nc-text-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  line-height: 1.7;
  font-weight: 550;
}
.nc-text-link:hover,
.nc-benefits a:hover {
  color: var(--nc-accent);
}
.nc-install {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 453px;
  margin-top: 28px;
  padding: 11px 11px 11px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  background: var(--vp-c-bg-soft);
}
.nc-dollar {
  color: var(--nc-accent);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
}
.nc-install code {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.8;
}
.nc-install button {
  flex-shrink: 0;
  min-height: 32px;
  margin-left: auto;
  padding: 3px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.8;
}
.nc-install button:hover {
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
}
.nc-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 12px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.6;
}
.nc-demo {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #394148;
  border-radius: 11px;
  background: #20262c;
  color: #e7ecf0;
  box-shadow:
    0 22px 45px -18px #171c2045,
    0 2px 5px #171c2012;
}
.nc-demo-toolbar {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 15px 17px;
  border-bottom: 1px solid #ffffff0e;
  background: #252c33;
}
.nc-window-controls {
  display: flex;
  gap: 5px;
}
.nc-window-controls i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #7d5352;
}
.nc-window-controls i:nth-child(2) {
  background: #958253;
}
.nc-window-controls i:nth-child(3) {
  background: #5a8168;
}
.nc-demo-filename {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #a5afb9;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
}
.nc-demo-live {
  margin-left: auto;
  color: #9da8b2;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 1.2px;
}
.nc-demo-modes {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 14px;
  border-bottom: 1px solid #ffffff0d;
}
.nc-demo-modes button {
  min-height: 36px;
  padding: 5px 10px;
  border-radius: 4px;
  color: #a3adb7;
  font-size: 12px;
  line-height: 1.6;
}
.nc-demo-modes button[aria-pressed="true"] {
  color: #f2f0eb;
  background: #ffffff10;
}
.nc-demo-modes button:hover {
  color: #fff;
}
.nc-demo-platform {
  margin-left: auto;
  padding-right: 4px;
  color: #91a08f;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
}
.nc-demo-body {
  min-height: 315px;
  padding: 21px 20px 14px;
}
.nc-demo-command {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 25px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.75;
}
.nc-demo-command > span {
  color: #eca475;
}
.nc-demo-command code {
  overflow-wrap: anywhere;
  color: #eef0ec;
  font: inherit;
}
.nc-output-heading {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 13px;
  color: #dfe2e2;
  font-size: 12px;
}
.nc-output-heading > span:last-child {
  margin-left: auto;
  color: #97a3ad;
  font-size: 11px;
}
.nc-output-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #edb472;
}
.nc-finding {
  padding: 12px 13px;
  border: 1px solid #dd8a6433;
  border-left: 2px solid #da8b66;
  border-radius: 5px;
  background: #dd8a6406;
}
.nc-finding-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c4ccd1;
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  line-height: 1.6;
}
.nc-status {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.nc-status-fail {
  color: #f2a18e;
}
.nc-status-review {
  color: #e9c48a;
}
.nc-finding-line {
  margin-left: auto;
  color: #a6b0b9;
}
.nc-finding p {
  margin: 8px 0;
  color: #e8ebec;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
}
.nc-code-sample {
  display: block;
  color: #afb9bf;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.nc-code-sample mark {
  border-radius: 2px;
  background: #d98d6b25;
  color: #f0aa87;
  padding: 1px 2px;
}
.nc-finding-note {
  margin-top: 6px;
  color: #9faab3;
  font-size: 11px;
  line-height: 1.6;
}
.nc-finding-review {
  margin-top: 10px;
  border-color: #d6ba8330;
  border-left-color: #b9a472;
  background: #d6ba8303;
}
.nc-finding-review p {
  margin-bottom: 2px;
}
.nc-demo-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 37px;
  padding: 9px 18px;
  border-top: 1px solid #ffffff0c;
  background: #1c2329;
  color: #a6b3b9;
  font-size: 10px;
  line-height: 1.6;
}
.nc-tiny-check {
  color: #8cb39e;
  font-size: 12px;
}
.nc-machine-output {
  min-height: 239px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #bdcbd7;
  font: 12px/1.75 var(--vp-font-family-mono);
}
.nc-ecosystems {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 23px 0;
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
}
.nc-ecosystem-label {
  flex-shrink: 0;
  color: var(--vp-c-text-2);
  font-size: 11px;
  letter-spacing: 1.3px;
}
.nc-ecosystems > div {
  display: flex;
  flex: 1;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px 22px;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-weight: 550;
}
.nc-principles {
  padding: 76px 0;
}
.nc-section-intro {
  display: grid;
  grid-template-columns: 1fr 0.8fr;
  align-items: end;
  gap: 70px;
}
.nc-section-intro > p {
  max-width: 390px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.8;
}
h2 {
  margin-top: 16px;
  color: var(--vp-c-text-1);
  font-size: 35px;
  font-weight: 550;
  letter-spacing: -1.5px;
  line-height: 1.18;
}
.nc-benefits {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 38px;
  margin-top: 39px;
}
.nc-benefits article {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-top: 19px;
  border-top: 1px solid var(--vp-c-divider);
}
.nc-step-number {
  margin-bottom: 18px;
  color: var(--nc-accent);
  font: 11px var(--vp-font-family-mono);
}
.nc-benefits h3 {
  color: var(--vp-c-text-1);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.4px;
  line-height: 1.5;
}
.nc-benefits p {
  margin: 12px 0 20px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.9;
}
.nc-benefits a {
  display: inline-flex;
  gap: 12px;
  margin-top: auto;
  color: var(--vp-c-text-1);
  font-size: 12px;
  font-weight: 550;
  line-height: 1.7;
}
.nc-patterns {
  display: grid;
  grid-template-columns: 0.9fr 1fr;
  gap: 70px;
  padding: 40px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}
.nc-patterns-copy > p:not(.nc-eyebrow) {
  max-width: 340px;
  margin: 17px 0 22px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.9;
}
.nc-pattern-list {
  align-self: center;
}
.nc-pattern-list > a {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 17px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.nc-pattern-list > a:first-child {
  padding-top: 0;
}
.nc-pattern-list > a:hover strong {
  color: var(--nc-accent);
}
.nc-pattern-symbol {
  display: inline-grid;
  place-items: center;
  width: 31px;
  height: 34px;
  flex-shrink: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--nc-accent);
  font: 14px var(--vp-font-family-mono);
}
.nc-pattern-list strong {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
}
.nc-pattern-list a div > span {
  display: block;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.65;
}
.nc-pattern-arrow {
  margin-left: auto;
  color: var(--vp-c-text-2);
  font-size: 15px;
}
.nc-pattern-footnote {
  padding-top: 13px;
  color: var(--vp-c-text-2);
  font-size: 11px;
  line-height: 1.7;
}
.nc-guides {
  padding: 76px 0 65px;
}
.nc-guides-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 30px;
}
.nc-guides-heading h2 {
  font-size: 29px;
}
.nc-guide-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 30px;
}
.nc-guide {
  display: block;
  padding: 23px 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  transition:
    background 160ms,
    border-color 160ms;
}
.nc-guide:hover {
  background: var(--vp-c-bg-soft);
  border-color: var(--nc-accent);
}
.nc-guide-category {
  color: var(--vp-c-text-2);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.3px;
}
.nc-guide h3 {
  display: flex;
  justify-content: space-between;
  margin-top: 13px;
  font-size: 16px;
  font-weight: 550;
  letter-spacing: -0.4px;
  line-height: 1.5;
}
.nc-guide h3 span {
  color: var(--nc-accent);
}
.nc-guide p {
  margin-top: 8px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.8;
}
.nc-bottom-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 35px;
  padding: 36px 0 5px;
  border-top: 1px solid var(--vp-c-divider);
}
.nc-bottom-cta > div {
  display: flex;
  align-items: center;
  gap: 19px;
}
.nc-bottom-cta .nc-spark {
  font-size: 36px;
}
.nc-bottom-cta h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.45;
  letter-spacing: -0.6px;
}
.nc-bottom-cta h2 span {
  color: var(--vp-c-text-2);
}
a:focus-visible,
button:focus-visible {
  outline: 3px solid var(--vp-c-brand-1);
  outline-offset: 5px;
}
.nc-demo button:focus-visible {
  outline-color: #f0b188;
}
.nc-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@media (min-width: 1440px) {
  .nc-home {
    max-width: 1264px;
  }
  .nc-hero {
    gap: 74px;
    padding-top: 105px;
    padding-bottom: 85px;
  }
  h1 {
    font-size: 72px;
  }
  .nc-demo-body {
    min-height: 340px;
    padding: 24px;
  }
  .nc-finding {
    padding: 15px;
  }
  .nc-finding p {
    font-size: 13px;
  }
  .nc-finding-meta {
    font-size: 11px;
  }
  .nc-code-sample {
    font-size: 12px;
  }
  .nc-finding-note {
    font-size: 12px;
  }
}
@media (max-width: 1020px) {
  .nc-hero {
    gap: 30px;
    padding-top: 65px;
  }
  h1 {
    font-size: 49px;
    letter-spacing: -2.5px;
  }
  .nc-eyebrow {
    font-size: 11px;
    letter-spacing: 1.1px;
  }
  .nc-actions {
    gap: 16px;
  }
  .nc-text-link {
    font-size: 13px;
  }
  .nc-demo-body {
    padding: 18px 16px 14px;
  }
  .nc-patterns {
    gap: 40px;
    padding: 32px;
  }
  .nc-section-intro {
    gap: 45px;
  }
}
@media (max-width: 760px) {
  .nc-home {
    padding: 0 24px;
  }
  .nc-hero {
    grid-template-columns: 1fr;
    gap: 36px;
    padding: 48px 0 42px;
  }
  .nc-intro {
    max-width: 550px;
  }
  h1 {
    font-size: 54px;
    letter-spacing: -2.8px;
  }
  .nc-lead {
    font-size: 16px;
  }
  .nc-demo {
    width: 100%;
  }
  .nc-demo-body {
    min-height: 315px;
    padding: 20px;
  }
  .nc-finding-meta {
    font-size: 11px;
  }
  .nc-code-sample {
    font-size: 12px;
  }
  .nc-finding-note {
    font-size: 12px;
  }
  .nc-ecosystems {
    align-items: flex-start;
    flex-direction: column;
    gap: 15px;
  }
  .nc-ecosystems > div {
    justify-content: flex-start;
    gap: 15px 26px;
    font-size: 12px;
  }
  .nc-section-intro {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .nc-section-intro > p {
    max-width: 500px;
  }
  .nc-principles,
  .nc-guides {
    padding: 48px 0;
  }
  .nc-benefits {
    gap: 24px;
  }
  .nc-benefits h3 {
    font-size: 15px;
  }
  .nc-patterns {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 28px;
  }
  .nc-patterns-copy > p:not(.nc-eyebrow) {
    max-width: 500px;
  }
  .nc-guides-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
  }
  .nc-guides-heading h2 {
    font-size: 29px;
  }
  .nc-bottom-cta {
    padding-top: 30px;
  }
  .nc-bottom-cta h2 {
    font-size: 19px;
  }
  .nc-bottom-cta .nc-spark {
    display: none;
  }
}
@media (max-width: 480px) {
  .nc-home {
    padding: 0 20px;
  }
  h1 {
    font-size: 44px;
    letter-spacing: -2.2px;
  }
  .nc-lead {
    font-size: 15px;
  }
  .nc-sublead {
    font-size: 13px;
  }
  .nc-actions {
    gap: 18px;
  }
  .nc-button {
    min-height: 44px;
    padding: 10px 15px;
    gap: 17px;
    font-size: 13px;
  }
  .nc-text-link {
    font-size: 12px;
  }
  .nc-install {
    gap: 7px;
    padding: 10px;
  }
  .nc-install code {
    font-size: 11px;
  }
  .nc-install button {
    padding: 3px 6px;
    font-size: 11px;
  }
  .nc-meta {
    font-size: 11px;
    gap: 7px;
  }
  .nc-demo-filename {
    font-size: 11px;
  }
  .nc-demo-body {
    padding: 17px 13px;
  }
  .nc-demo-command {
    font-size: 12px;
  }
  .nc-finding {
    padding: 11px 10px;
  }
  .nc-finding-meta {
    gap: 6px;
    font-size: 10px;
  }
  .nc-code-sample {
    font-size: 11px;
  }
  .nc-finding-note {
    font-size: 11px;
  }
  .nc-finding-line {
    font-size: 10px;
  }
  .nc-demo-footer {
    padding: 10px 12px;
    font-size: 10px;
  }
  .nc-benefits,
  .nc-guide-grid {
    grid-template-columns: 1fr;
  }
  .nc-benefits {
    gap: 26px;
  }
  .nc-benefits h3 {
    font-size: 18px;
  }
  .nc-benefits p {
    font-size: 13px;
    max-width: 330px;
  }
  .nc-benefits a {
    font-size: 13px;
  }
  .nc-step-number {
    margin-bottom: 12px;
  }
  h2 {
    font-size: 31px;
  }
  .nc-patterns {
    padding: 24px 20px;
  }
  .nc-pattern-list strong {
    font-size: 12px;
  }
  .nc-pattern-list a div > span {
    font-size: 11px;
  }
  .nc-pattern-footnote {
    font-size: 10px;
  }
  .nc-guide {
    padding: 22px;
  }
  .nc-guide p {
    font-size: 13px;
  }
  .nc-bottom-cta {
    align-items: flex-start;
    flex-direction: column;
    gap: 23px;
  }
  .nc-bottom-cta h2 {
    font-size: 22px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition: none !important;
  }
}
</style>
