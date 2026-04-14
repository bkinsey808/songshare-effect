#!/usr/bin/env bun
import { resolve } from "node:path";

import runQmd from "./runQmd";

const repoRoot = resolve(import.meta.dir, "../..");
const ARGS_OFFSET = 2;
const args = Bun.argv.slice(ARGS_OFFSET);

const exitCode = await runQmd(args, { repoRoot });
process.exit(exitCode);
