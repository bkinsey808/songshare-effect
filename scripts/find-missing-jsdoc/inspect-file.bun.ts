#!/usr/bin/env bun
import { readFileSync } from "node:fs";

import { ZERO, ONE } from "@/shared/constants/shared-constants";

import hasPrecedingJsDoc from "./hasPrecedingJsDoc";

const ARG_FILE_INDEX = 2;
const DEFAULT_FILE = "api/src/user-library/addUserToLibrary.ts";
const PREVIEW_WINDOW = 6;
const filePath = process.argv[ARG_FILE_INDEX] ?? DEFAULT_FILE;
const src = readFileSync(filePath, "utf8");
const lines = src.split(/\r?\n/);
const text = src;

const patterns: { regex: RegExp; kind: string }[] = [
	{ regex: /^\s*export\s+function\s+([A-Za-z0-9_]+)\s*\(/gm, kind: "function" },
	{ regex: /^\s*export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\(/gm, kind: "function" },
	{ regex: /^\s*export\s+const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/gm, kind: "const-fn" },
	{ regex: /^\s*export\s+class\s+([A-Za-z0-9_]+)/gm, kind: "class" },
];

// Safe getter for the attached helper (no unsafe any assertions)
function isJsDocGetter(
	value: unknown,
): value is (lines: string[], lineIndex: number) => string | undefined {
	return typeof value === "function";
}

const descriptor = Object.getOwnPropertyDescriptor(hasPrecedingJsDoc, "getPrecedingJsDoc");
let getPrecedingJsDoc: ((lines: string[], lineIndex: number) => string | undefined) | undefined =
	undefined;
if (descriptor && isJsDocGetter(descriptor.value)) {
	getPrecedingJsDoc = descriptor.value;
}

// oxlint-disable-next-line no-console
console.warn("Inspecting", filePath);
for (const { regex, kind } of patterns) {
	while (true) {
		const match = regex.exec(text);
		if (!match) {
			break;
		}
		const idx = match.index;
		const lineNum = text.slice(ZERO, idx).split(/\r?\n/).length;
		const NAME_DEFAULT = "default";
		const NAME_IDX = 1;
		const name = match[NAME_IDX] ?? NAME_DEFAULT;
		const jsdocText = getPrecedingJsDoc?.(lines, lineNum);
		const hasJsdoc = jsdocText !== undefined;
		const hasReturns = typeof jsdocText === "string" ? /@returns?\b/i.test(jsdocText) : false;
		// oxlint-disable-next-line no-console
		console.warn(
			`- ${kind} ${name} at line ${lineNum}: jsdoc=${hasJsdoc} hasReturns=${hasReturns}`,
		);
		// Print nearby lines for debugging
		const startPreview = Math.max(ZERO, lineNum - PREVIEW_WINDOW);
		const endPreview = Math.min(lines.length, lineNum + ONE);
		for (let i = startPreview; i < endPreview; i += ONE) {
			// oxlint-disable-next-line no-console
			console.warn(`${i + ONE}: ${String(lines[i])}`);
		}
		if (typeof jsdocText === "string") {
			// oxlint-disable-next-line no-console
			console.warn(
				"--- JSDOC ---\n",
				jsdocText
					.split(/\r?\n/)
					.map((line) => `> ${line}`)
					.join("\n"),
			);
			// oxlint-disable-next-line no-console
			console.warn("--- END ---");
		}
	}
}
