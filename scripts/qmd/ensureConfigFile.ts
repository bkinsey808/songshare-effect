import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const CONFIG_FILE_NAME = "index.yml";

/**
 * Create a repo-local qmd config file if it does not already exist.
 *
 * @param configDir - Directory where the config file should live.
 * @param repoRoot - Path to the repository root used when writing collection paths.
 * @returns void
 */
export default function ensureConfigFile(configDir: string, repoRoot: string): void {
  const configPath = resolve(configDir, CONFIG_FILE_NAME);
  if (existsSync(configPath)) {
    return;
  }

  const configContents = `collections:
  skills:
    path: ${repoRoot}/skills
    pattern: "**/*.md"
    context:
      "": Reusable task guidance skill files for AI coding agents — covers Hono, Effect-TS, React, Zustand, Supabase, Playwright, unit testing, linting, and more
  docs:
    path: ${repoRoot}/docs
    pattern: "**/*.md"
    context:
      "": Project documentation — architecture, coding rules, server patterns, auth system, AI system layout, deployment, and developer workflows
`;

  writeFileSync(configPath, configContents, "utf8");
}
