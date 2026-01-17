import { describe, expect, it, vi } from "vitest";

import closeAudioContextSafely from "./closeAudioContextSafely";

describe("closeAudioContextSafely", () => {
	it("calls close on the provided AudioContext", async () => {
		const mockContext = {
			close: vi.fn().mockResolvedValue(undefined),
		};

		await closeAudioContextSafely(mockContext);

		expect(mockContext.close).toHaveBeenCalled();
	});

	it("swallows errors thrown by close", async () => {
		const mockContext = {
			close: vi.fn().mockRejectedValue(new Error("Close failed")),
		};

		// Should not throw
		await expect(closeAudioContextSafely(mockContext)).resolves.toBeUndefined();

		expect(mockContext.close).toHaveBeenCalled();
	});
});
