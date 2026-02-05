#!/usr/bin/env bun
/**
 * scripts/debug-analyze.bun.ts
 *
 * Quick Bun script to run `analyzeFile` on a small test snippet and print
 * the resulting issues. Designed to run with `bun run` or directly when
 * executable.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import analyzeFile from "./analyzeFile";

const contents = [
	"// helper",
	"/** This is foo */",
	"export function foo() {}",
	"",
	"export function bar() {}",
	"",
	"/** default doc */",
	"export default function baz() {}",
	"",
	"export const qux = () => {}",
	"",
	"/** Does something",
	" * @returns void */",
	"export function withReturns() {}",
	"",
	"export class MyClass {}",
].join("\n");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "debug-analyze-"));
const file = path.join(tmpDir, "t.ts");
fs.writeFileSync(file, contents, "utf8");

try {
	const issues = analyzeFile(file);
	const INDENT = 2;
	// eslint-disable-next-line no-console
	console.log("issues:", JSON.stringify(issues, undefined, INDENT));
	// exit 0 to indicate success
	const EXIT_OK = 0;
	process.exit(EXIT_OK);
} catch (error) {
	// eslint-disable-next-line no-console
	console.error("ERR running analyzeFile:", error);
	const EXIT_ERROR = 1;
	process.exit(EXIT_ERROR);
} finally {
	try {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	} catch {
		// ignore cleanup errors
	}
}
