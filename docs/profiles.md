# Profiles

Profiles describe the ecosystems and framework context relevant to a project: Rust, TypeScript, React, Go, Dart, Java, Spring Boot, Astro, Svelte, and others as they are detected.

Detection uses manifests, declared dependencies, framework configuration files, and Java source
within the selected project. Supported profiles include Rust, Go, Dart, Java, Spring Boot,
TypeScript, React, Astro, Svelte, NestJS, Next.js, and Vite. Web ecosystems also activate `web`.

A nonempty `profiles` list in `.nice-code.json` replaces the automatic list. The same effective
profiles control scoped rule execution and the report's `activeProfiles`; `detected` still shows
the raw discovery facts. Omitting `profiles` or setting an empty list uses automatic detection.
