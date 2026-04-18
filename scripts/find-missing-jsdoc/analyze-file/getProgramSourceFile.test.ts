import path from "node:path";

import type { Program, SourceFile } from "typescript";
import { describe, expect, it } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import getProgramSourceFile from "./getProgramSourceFile";

describe("getProgramSourceFile", () => {
	it("finds matching source file by resolved path", () => {
		// Arrange
		const filePath = path.resolve("/tmp/foo.ts");
		const program = forceCast<Program>({
			getSourceFiles: () => [
				forceCast<SourceFile>({ fileName: filePath }),
				forceCast<SourceFile>({ fileName: "/other" }),
			],
		});

		// Act
		const result = getProgramSourceFile(program, filePath);

		// Assert
		expect(result).toBeDefined();
		expect(forceCast<SourceFile>(result).fileName).toBe(filePath);
	});
});
