import { describe, expect, it, vi } from "vitest";

import logResolvedWgslOnFailure from "./logResolvedWgslOnFailure";

const PREFIX = "[TypeGPU]";
const EXPECTED_UNAVAILABLE = "tgpu.resolve unavailable";

describe("logResolvedWgslOnFailure", () => {
	it("warns when tgpuLike has no resolve function", () => {
		const logger = { warn: vi.fn() };
		logResolvedWgslOnFailure({
			prefix: PREFIX,
			tgpuLike: {},
			entryPoints: [],
			logger,
		});
		expect(logger.warn).toHaveBeenCalledWith(
			expect.stringContaining(EXPECTED_UNAVAILABLE),
		);
	});

	it("warns when tgpuLike is null or not an object", () => {
		const logger = { warn: vi.fn() };
		logResolvedWgslOnFailure({
			prefix: PREFIX,
			tgpuLike: undefined,
			entryPoints: [],
			logger,
		});
		expect(logger.warn).toHaveBeenCalledWith(
			expect.stringContaining(EXPECTED_UNAVAILABLE),
		);
	});

	it("warns when resolve returns non-string", () => {
		const logger = { warn: vi.fn() };
		const NON_STRING_RESULT = 42;
		const tgpuLike = { resolve: (): number => NON_STRING_RESULT };
		logResolvedWgslOnFailure({
			prefix: PREFIX,
			tgpuLike,
			entryPoints: [],
			logger,
		});
		expect(logger.warn).toHaveBeenCalledWith(
			expect.stringContaining("returned a non-string result"),
		);
	});

	it("logs truncated WGSL when resolve returns string", () => {
		const logger = { warn: vi.fn() };
		const WGSL_SNIPPET = "fn main() {}";
		const tgpuLike = { resolve: (): string => WGSL_SNIPPET };
		logResolvedWgslOnFailure({
			prefix: PREFIX,
			tgpuLike,
			entryPoints: ["main"],
			logger,
		});
		expect(logger.warn).toHaveBeenCalledWith(
			expect.stringContaining("Resolved WGSL"),
		);
		expect(logger.warn).toHaveBeenCalledWith(
			expect.stringContaining(WGSL_SNIPPET),
		);
	});

	it("warns on resolve throw", () => {
		const logger = { warn: vi.fn() };
		const tgpuLike = {
			resolve: (): never => {
				throw new Error("resolve failed");
			},
		};
		logResolvedWgslOnFailure({
			prefix: PREFIX,
			tgpuLike,
			entryPoints: [],
			logger,
		});
		expect(logger.warn).toHaveBeenCalledWith(
			expect.stringContaining("Failed to resolve WGSL"),
			expect.any(Error),
		);
	});
});
