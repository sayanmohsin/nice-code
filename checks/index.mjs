import { checks as asyncChecks } from "./async.mjs";
import { checks as errorChecks } from "./errors.mjs";
import { checks as loggingChecks } from "./logging.mjs";
import { checks as performanceChecks } from "./performance.mjs";
import { checks as securityChecks } from "./security.mjs";
import { checks as testingChecks } from "./testing.mjs";

export const checks = [
  ...loggingChecks,
  ...asyncChecks,
  ...errorChecks,
  ...securityChecks,
  ...testingChecks,
  ...performanceChecks,
];
