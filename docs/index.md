---
layout: home
title: Nice Code — Review code with evidence
description: Lightweight source-backed guardrails for human- and AI-written code.
hero:
  name: Nice Code
  text: Review code with evidence.
  tagline: Lightweight guardrails for recurring engineering mistakes — local, agent-friendly, and CI-ready.
  actions:
    - theme: brand
      text: Get started →
      link: /getting-started
    - theme: alt
      text: View the CLI
      link: /cli
    - theme: alt
      text: Browse patterns
      link: /patterns
features:
  - icon: ✓
    title: Changed-file first
    details: Keep everyday review fast. Run full scans when you need an audit or baseline.
  - icon: ◈
    title: Traceable patterns
    details: Adapt guidance from public sources and keep attribution beside every pattern.
  - icon: →
    title: Agent-friendly output
    details: Give coding agents compact, stable findings instead of a wall of context.
  - icon: ⌘
    title: Works with your tools
    details: Complement TypeScript, Rust, Go, Dart, framework tooling, and CI.
---

<div class="nice-code-flow" aria-label="Nice Code workflow">
  <div>Public guidance</div><div>Patterns + sources</div><div>Custom checks + native tools</div><div>Local, commit, or CI review</div>
</div>

<div class="nice-code-terminal">
  <div><span class="prompt">$</span> npx nice-code --changed --project .</div>
  <div><span class="pass">PASS</span> 0 new findings · 18 files checked</div>
  <div><span class="review">REVIEW</span> AP-ASYNC-001 src/load.ts:42 · verify independent awaits</div>
</div>

## A practical review layer

Nice Code catches recurring issues that deserve engineering judgment: missing operational context, suspicious async work, weak error handling, unsafe persistence changes, secret exposure, and unsupported performance claims.

It complements compilers, formatters, linters, tests, and tools such as SonarQube. It does not replace them, and a text-based check cannot prove an architectural decision by itself.

## Choose a starting path

| If you are…                      | Start here                                  |
| -------------------------------- | ------------------------------------------- |
| Trying Nice Code in a repository | [Getting started](/getting-started)         |
| Adding it to a project           | [Project integration](/project-integration) |
| Wiring it to an agent            | [Agent integration](/agent-integration)     |
| Adding it to CI                  | [CI](/ci)                                   |
| Reviewing scan output            | [Findings and statuses](/findings)          |
| Improving the patterns           | [Pattern lifecycle](/lifecycle)             |

Use the smallest check that answers the current question. Changed-file checks are the default; full scans, baselines, metrics, and monthly audits are explicit tools for understanding change over time.
