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
    ["meta", { name: "theme-color", content: "#f4efe6" }],
  ],
  themeConfig: {
    logo: "/logo-wordmark.svg",
    siteTitle: false,
    nav: [
      { text: "Start here", link: "/getting-started" },
      { text: "Concepts", link: "/architecture" },
      { text: "Guides", link: "/cli" },
      { text: "Operations", link: "/ci" },
      { text: "Reference", link: "/patterns" },
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
          ],
        },
        {
          text: "Guides",
          items: [
            { text: "CLI", link: "/cli" },
            { text: "Project integration", link: "/project-integration" },
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
    socialLinks: [
      { icon: "github", link: "https://github.com/sayanmohsin/nice-code" },
    ],
    footer: {
      message: "Source-backed guardrails · MIT License",
      copyright: "© 2026 Nice Code contributors",
    },
  },
});
