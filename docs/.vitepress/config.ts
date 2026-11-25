import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Nice Code",
  description:
    "Source-backed engineering guardrails for human- and AI-written code.",
  lang: "en-US",
  base: "/nice-code/",
  cleanUrls: true,
  head: [
    ["link", { rel: "icon", href: "/nice-code/favicon.svg" }],
    ["meta", { name: "theme-color", content: "#faf8f4" }],
  ],
  themeConfig: {
    logo: {
      light: "/logo-wordmark.svg",
      dark: "/logo-wordmark-dark.svg",
      alt: "Nice Code",
    },
    siteTitle: false,
    nav: [
      { text: "Get started", link: "/getting-started" },
      { text: "CLI", link: "/cli" },
      { text: "Patterns", link: "/patterns" },
      { text: "CI", link: "/ci" },
      { text: "Sources", link: "/sources" },
    ],
    sidebar: {
      "/": [
        {
          text: "Start here",
          items: [
            { text: "Overview", link: "/" },
            { text: "Getting started", link: "/getting-started" },
            { text: "Why Nice Code?", link: "/why-nice-code" },
            { text: "Use cases", link: "/use-cases" },
            { text: "FAQ", link: "/faq" },
          ],
        },
        {
          text: "Concepts",
          items: [
            { text: "Architecture", link: "/architecture" },
            { text: "Findings and statuses", link: "/findings" },
            { text: "Profiles", link: "/profiles" },
            { text: "Pattern lifecycle", link: "/lifecycle" },
            { text: "Sources", link: "/sources" },
            { text: "Knowledge and project rules", link: "/knowledge" },
          ],
        },
        {
          text: "Guides",
          items: [
            { text: "CLI", link: "/cli" },
            { text: "Project integration", link: "/project-integration" },
            { text: "Skills", link: "/skills" },
            { text: "Agent integration", link: "/agent-integration" },
            { text: "Configuration", link: "/configuration" },
            { text: "Baselines", link: "/baselines" },
            { text: "Output formats", link: "/output-formats" },
            { text: "Native tools", link: "/native-tools" },
          ],
        },
        {
          text: "Operations",
          items: [
            { text: "CI", link: "/ci" },
            { text: "Releasing", link: "/releasing" },
            { text: "Audits", link: "/audits" },
            { text: "Metrics", link: "/metrics" },
            { text: "Troubleshooting", link: "/troubleshooting" },
          ],
        },
        {
          text: "Reference",
          items: [
            { text: "Pattern catalog", link: "/patterns" },
            { text: "Quick reference", link: "/reference" },
            { text: "Contributing", link: "/contributing" },
            { text: "Roadmap", link: "/roadmap" },
          ],
        },
      ],
    },
    search: { provider: "local" },
    editLink: {
      pattern: "https://github.com/sayanmohsin/nice-code/edit/main/docs/:path",
      text: "Improve this page on GitHub",
    },
    outline: { level: [2, 3], label: "On this page" },
    socialLinks: [
      { icon: "github", link: "https://github.com/sayanmohsin/nice-code" },
    ],
    footer: {
      message: "A little more context. A more thoughtful review.",
      copyright: "© 2026 Nice Code contributors",
    },
  },
});
