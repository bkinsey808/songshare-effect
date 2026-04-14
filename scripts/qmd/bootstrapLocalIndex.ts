import { Effect } from "effect";
import { copyFileSync, existsSync } from "node:fs";
import runProcess from "./runProcess";

// Commands that require initializing/updating the local qmd index.
const BOOTSTRAP_COMMANDS = new Set(["search", "vsearch", "query", "get", "ls", "status"]);

/**
 * Ensure a local QMD index exists for the given command.
 *
 * If a local index already exists this is a no-op. If a global index is
 * available and differs from the requested `indexPath`, it will be copied to
 * the local path. If the command requires bootstrapping, the QMD binary is
 * invoked to update/create the index.
 *
 * @param command - The command name used to determine whether bootstrapping is needed.
 * @param indexPath - Path to the local index file to create or verify.
 * @param globalIndexPath - Path to a shared/global index file that can be copied into place.
 * @param qmdBin - Path to the `qmd` binary used to run update commands.
 * @returns An `Effect` that completes when bootstrapping is done.
 */
export default function bootstrapLocalIndex(options: {
  readonly command: string;
  readonly indexPath: string;
  readonly globalIndexPath: string;
  readonly qmdBin: string;
}): Effect.Effect<void, Error> {
  return Effect.gen(function* bootstrapLocalIndexGen() {
    if (existsSync(options.indexPath)) {
      return;
    }

    if (options.globalIndexPath !== options.indexPath && existsSync(options.globalIndexPath)) {
      copyFileSync(options.globalIndexPath, options.indexPath);
      return;
    }

    if (!BOOTSTRAP_COMMANDS.has(options.command)) {
      return;
    }

    yield* runProcess([options.qmdBin, "update"], { suppressOutput: true });
  });
}
