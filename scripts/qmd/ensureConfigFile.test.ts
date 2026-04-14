import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import ensureConfigFile from "./ensureConfigFile";

const PREFIX = "qmd-ensure-config-";
const CONFIG_NAME = "index.yml";

describe("ensureConfigFile", () => {
  it("does not overwrite an existing config file", () => {
    const tmp = mkdtempSync(join(tmpdir(), PREFIX));
    const configDir = join(tmp, "config");
    mkdirSync(configDir);
    const configPath = join(configDir, CONFIG_NAME);

    writeFileSync(configPath, "EXISTING_CONTENT", "utf8");

    try {
      ensureConfigFile(configDir, "/repo/root");
      const content = readFileSync(configPath, "utf8");
      expect(content).toBe("EXISTING_CONTENT");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("creates a config file containing repo paths when missing", () => {
    const tmp = mkdtempSync(join(tmpdir(), PREFIX));
    const configDir = join(tmp, "config");
    mkdirSync(configDir);
    const configPath = join(configDir, CONFIG_NAME);
    const repoRoot = "/my/repo/root";

    try {
      // ensure file does not exist yet
      expect(existsSync(configPath)).toBe(false);

      ensureConfigFile(configDir, repoRoot);

      expect(existsSync(configPath)).toBe(true);
      const content = readFileSync(configPath, "utf8");
      expect(content).toContain(`${repoRoot}/skills`);
      expect(content).toContain(`${repoRoot}/docs`);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
