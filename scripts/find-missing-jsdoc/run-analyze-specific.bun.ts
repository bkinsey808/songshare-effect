#!/usr/bin/env bun
import analyzeFile from "./analyzeFile";
import { EXIT_ERROR } from "./constants";

const DEFAULT_FILE = "api/src/user-library/addUserToLibrary.ts";
const INDENT = 2;

const ARG_FILE_INDEX = 2;
const file = process.argv[ARG_FILE_INDEX] ?? DEFAULT_FILE;
try {
	const issues = analyzeFile(file);
	// oxlint-disable-next-line no-console
	console.warn(JSON.stringify(issues, undefined, INDENT));
} catch (error: unknown) {
	// oxlint-disable-next-line no-console
	console.error("ERR", error);
	process.exit(EXIT_ERROR);
}
