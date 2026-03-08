import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import countLines from "./countLines";

function makeTemp(name: string): string {
	return path.join(os.tmpdir(), `${name}-${Date.now()}-${Math.random()}.txt`);
}

const EXPECT_TWO_LINES = 2;
const EXPECT_THREE_LINES = 3;
const EXPECT_ONE_LINE = 1;

describe("countLines", () => {
	it("counts Unix newlines without trailing newline", () => {
		const file = makeTemp("unix-no-trailing");
		fs.writeFileSync(file, "a\nb", "utf8");
		try {
			expect(countLines(file)).toBe(EXPECT_TWO_LINES);
		} finally {
			fs.unlinkSync(file);
		}
	});

	it("counts a trailing newline as an extra empty line", () => {
		const file = makeTemp("trailing-newline");
		fs.writeFileSync(file, "a\nb\n", "utf8");
		try {
			expect(countLines(file)).toBe(EXPECT_THREE_LINES);
		} finally {
			fs.unlinkSync(file);
		}
	});

	it("treats an empty file as a single empty line (implementation detail)", () => {
		const file = makeTemp("empty-file");
		fs.writeFileSync(file, "", "utf8");
		try {
			expect(countLines(file)).toBe(EXPECT_ONE_LINE);
		} finally {
			fs.unlinkSync(file);
		}
	});

	it("handles CRLF line endings correctly", () => {
		const file = makeTemp("crlf");
		fs.writeFileSync(file, "a\r\nb\r\nc", "utf8");
		try {
			expect(countLines(file)).toBe(EXPECT_THREE_LINES);
		} finally {
			fs.unlinkSync(file);
		}
	});
});
