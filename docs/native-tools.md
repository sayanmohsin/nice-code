# Native tools

Nice Code complements tools that already understand an ecosystem:

| Ecosystem            | Native tools remain authoritative for            |
| -------------------- | ------------------------------------------------ |
| Rust                 | compiler, rustfmt, Clippy                        |
| TypeScript and React | TypeScript, Biome, ESLint, framework rules       |
| Go                   | gofmt, vet, static analysis                      |
| Dart and Flutter     | formatter and analyzer                           |
| Web                  | configured accessibility and performance tooling |

Native-tool failures are reported separately from Nice Code findings. Missing dependencies should be explicit and should not be disguised as a custom-rule failure.
