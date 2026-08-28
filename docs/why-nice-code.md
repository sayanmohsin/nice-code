# Why Nice Code?

Compilers and linters are excellent at rules they can prove locally. Nice Code covers a smaller set of recurring engineering questions that often need context:

- Does this log carry enough operational context without exposing sensitive data?
- Are these asynchronous operations actually independent?
- Is this error being swallowed intentionally?
- Is a performance claim supported by a measurement?
- Does a persistence change preserve data integrity?

The project is designed for both human- and AI-written code. AI can repeat plausible mistakes; Nice Code provides a stable review prompt and evidence trail without asking an agent to load the entire repository. It complements native project tooling rather than replacing it.
