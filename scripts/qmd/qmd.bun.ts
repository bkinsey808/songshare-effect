#!/usr/bin/env bun
import { resolve } from "node:path";

import { Effect } from "effect";
import runQmd from "./runQmd";

const repoRoot = resolve(import.meta.dir, "../..");
const ARGS_OFFSET = 2;
const args = Bun.argv.slice(ARGS_OFFSET);

const exitCode = await Effect.runPromise(runQmd(args, { repoRoot }));
process.exit(exitCode);
