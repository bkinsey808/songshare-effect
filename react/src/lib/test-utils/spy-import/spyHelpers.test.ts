import { describe, expect, it, vi } from "vitest";

import { importSpy, setMockRejectedValue, setMockResolvedValue } from "./spyHelpers";
import spyImport, { type SpyLike } from "./spyImport";

vi.mock("./spyImport");

describe("spyHelpers utilities", () => {
	const fakeSpy: SpyLike = {
		mockResolvedValue: vi.fn().mockReturnThis(),
		mockResolvedValueOnce: vi.fn().mockReturnThis(),
		mockRejectedValue: vi.fn().mockReturnThis(),
		mockRejectedValueOnce: vi.fn().mockReturnThis(),
		mockReturnValue: vi.fn().mockReturnThis(),
		mockImplementation: vi.fn(),
	};

	const MAGIC_NUMBER = 123;
	const OTHER_NUMBER = 42;

	function resetAndStub(): void {
		vi.resetAllMocks();
		vi.mocked(spyImport).mockResolvedValue(fakeSpy);
	}

	it("setMockResolvedValue forwards the value and uses default export name", async () => {
		resetAndStub();

		await setMockResolvedValue("/some/path", MAGIC_NUMBER);

		expect(spyImport).toHaveBeenCalledWith("/some/path", "default");
		expect(fakeSpy["mockResolvedValue"]).toHaveBeenCalledWith(MAGIC_NUMBER);
	});

	it("setMockResolvedValue respects a custom export name", async () => {
		resetAndStub();

		await setMockResolvedValue("/some/path", "ok", "named");

		expect(spyImport).toHaveBeenCalledWith("/some/path", "named");
		expect(fakeSpy["mockResolvedValue"]).toHaveBeenCalledWith("ok");
	});

	it("setMockRejectedValue forwards the value and uses default export name", async () => {
		resetAndStub();

		const err = new Error("fail");
		await setMockRejectedValue("/another", err);

		expect(spyImport).toHaveBeenCalledWith("/another", "default");
		expect(fakeSpy["mockRejectedValue"]).toHaveBeenCalledWith(err);
	});

	it("setMockRejectedValue respects a custom export name", async () => {
		resetAndStub();

		await setMockRejectedValue("/another", OTHER_NUMBER, "foo");

		expect(spyImport).toHaveBeenCalledWith("/another", "foo");
		expect(fakeSpy["mockRejectedValue"]).toHaveBeenCalledWith(OTHER_NUMBER);
	});

	it("importSpy simply returns whatever the underlying spyImport resolves to", async () => {
		resetAndStub();

		// runtime behavior is just proxying the value
		const result = await importSpy<SpyLike>("/module");
		expect(result).toBe(fakeSpy);
		expect(spyImport).toHaveBeenCalledWith("/module");
	});
});
