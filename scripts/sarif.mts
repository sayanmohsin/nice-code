export function toSarif(report: any) {
  const rules = [
    ...new Map(
      (report.findings ?? []).map((item: any) => [
        item.id,
        {
          id: item.id,
          name: item.title,
          shortDescription: { text: item.title },
          helpUri: item.source,
        },
      ]),
    ).values(),
  ];
  const results = (report.findings ?? []).map((item: any) => ({
    ruleId: item.id,
    level:
      item.status === "FAIL"
        ? "error"
        : item.status === "WARN"
          ? "warning"
          : "note",
    message: { text: item.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: item.file },
          region: { startLine: item.line },
        },
      },
    ],
    properties: {
      status: item.status,
      severity: item.severity,
      category: item.category,
    },
  }));
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "Nice Code",
            informationUri: "https://github.com/sayanmohsin/nice-code",
            rules,
          },
        },
        results,
        properties: {
          project: report.project,
          mode: report.mode,
          nativeTools: report.nativeTools ?? report.tools ?? [],
          exit: report.exit ?? { blocked: false, reasons: [] },
        },
      },
    ],
  };
}
