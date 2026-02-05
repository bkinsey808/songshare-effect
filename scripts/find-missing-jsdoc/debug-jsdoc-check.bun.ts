#!/usr/bin/env bun
import { readFileSync } from "node:fs";

import { ZERO } from "@/shared/constants/shared-constants";

import hasPrecedingJsDoc from "./hasPrecedingJsDoc";

const ARG_FILE_INDEX = 2;
const DEFAULT_FILE = "api/src/user-library/addUserToLibrary.ts";
const file = process.argv[ARG_FILE_INDEX] ?? DEFAULT_FILE;
const src = readFileSync(file, "utf8");
const lines = src.split(/\r?\n/);

function findExportedFunctions(
	text: string,
): { name: string; kind: string; idx: number; line: number }[] {
	const patterns = [
		{ regex: /^\s*export\s+function\s+([A-Za-z0-9_]+)\s*\(/gm, kind: "function" },
		{ regex: /^\s*export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\(/gm, kind: "function" },
		{ regex: /^\s*export\s+const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/gm, kind: "const-fn" },
		{ regex: /^\s*export\s+class\s+([A-Za-z0-9_]+)/gm, kind: "class" },
	];
	const found = [] as { name: string; kind: string; idx: number; line: number }[];
	for (const { regex, kind } of patterns) {
		while (true) {
			const match = regex.exec(text);
			if (!match) {
				break;
			}
			const idx = match.index;
			const line = text.slice(ZERO, idx).split(/\r?\n/).length;
			const NAME_DEFAULT = "default";
			const NAME_IDX = 1;
			found.push({ name: match[NAME_IDX] ?? NAME_DEFAULT, kind, idx, line });
		}
	}
	return found;
}

const text = src;
const found = findExportedFunctions(text);
console.warn("Found exports:");

function isPrecedingJsDocGetter(
	value: unknown,
): value is (lines: string[], lineIndex: number) => string | undefined {
	return typeof value === "function";
}

for (const foundExport of found) {
	console.warn(foundExport);
	const descriptor = Object.getOwnPropertyDescriptor(hasPrecedingJsDoc, "getPrecedingJsDoc");
	if (descriptor && isPrecedingJsDocGetter(descriptor.value)) {
		const jsdoc = descriptor.value?.(lines, foundExport.line);
		console.warn("jsdoc present:", typeof jsdoc === "string");
		if (typeof jsdoc === "string") {
			console.warn(
				jsdoc
					.split(/\r?\n/)
					.map((line) => `> ${line}`)
					.join("\n"),
			);
		}
	}
}
