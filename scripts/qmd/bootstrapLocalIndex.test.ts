import { Effect } from "effect";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import bootstrapLocalIndex from "./bootstrapLocalIndex";

const PREFIX = "qmd-bootstrap-";
const QMD_BIN = "/usr/local/bin/qmd";

describe("bootstrapLocalIndex", () => {
  const NONE = 0;
  const ONE = 1;

  it("is a no-op when the local index already exists", async () => {
    const tmp = mkdtempSync(join(tmpdir(), PREFIX));
    try {
      const RunProcessModule = await import("./runProcess");
      const spy = vi
        .spyOn(RunProcessModule, "default")
        .mockImplementation(() => Effect.sync(() => ({ exitCode: 0, output: "" })));

      const indexPath = join(tmp, "index.yml");
      writeFileSync(indexPath, "LOCAL", "utf8");

      await Effect.runPromise(
        bootstrapLocalIndex({
          command: "search",
          indexPath,
          globalIndexPath: join(tmp, "global.yml"),
          qmdBin: QMD_BIN,
        }),
      );

      expect(readFileSync(indexPath, "utf8")).toBe("LOCAL");
      expect(spy).toHaveBeenCalledTimes(NONE);
      spy.mockRestore();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("copies global index into place when present and different", async () => {
    const tmp = mkdtempSync(join(tmpdir(), PREFIX));
    try {
      const RunProcessModule = await import("./runProcess");
      const spy = vi
        .spyOn(RunProcessModule, "default")
        .mockImplementation(() => Effect.sync(() => ({ exitCode: 0, output: "" })));

      const globalPath = join(tmp, "global.yml");
      const indexPath = join(tmp, "index.yml");
      writeFileSync(globalPath, "GLOBAL_CONTENT", "utf8");

      await Effect.runPromise(
        bootstrapLocalIndex({
          command: "ls",
          indexPath,
          globalIndexPath: globalPath,
          qmdBin: QMD_BIN,
        }),
      );

      expect(existsSync(indexPath)).toBe(true);
      expect(readFileSync(indexPath, "utf8")).toBe("GLOBAL_CONTENT");
      expect(spy).toHaveBeenCalledTimes(NONE);
      spy.mockRestore();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("runs the qmd update when no index exists and command requires bootstrapping", async () => {
    const tmp = mkdtempSync(join(tmpdir(), PREFIX));
    try {
      const RunProcessModule = await import("./runProcess");
      const spy = vi
        .spyOn(RunProcessModule, "default")
        .mockImplementation(() => Effect.sync(() => ({ exitCode: 0, output: "" })));

      const indexPath = join(tmp, "index.yml");
      const globalPath = join(tmp, "global.yml");

      await Effect.runPromise(
        bootstrapLocalIndex({
          command: "update", // not in BOOTSTRAP_COMMANDS
          indexPath,
          globalIndexPath: globalPath,
          qmdBin: QMD_BIN,
        }),
      );

      // command 'update' should NOT trigger bootstrapping because it's not in the set
      expect(spy).toHaveBeenCalledTimes(NONE);

      // now try a bootstrap command
      await Effect.runPromise(
        bootstrapLocalIndex({
          command: "search",
          indexPath,
          globalIndexPath: globalPath,
          qmdBin: QMD_BIN,
        }),
      );

      expect(spy).toHaveBeenCalledTimes(ONE);
      expect(spy).toHaveBeenCalledWith([QMD_BIN, "update"], { suppressOutput: true });
      spy.mockRestore();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
