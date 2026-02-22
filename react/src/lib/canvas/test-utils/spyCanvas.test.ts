import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import spyImport, { type SpyLike } from "@/react/lib/test-utils/spy-import/spyImport";

import { spyResizeCanvasToDisplaySize, type ResizeSpy } from "./spyCanvas";

vi.mock("@/react/lib/test-utils/spy-import/spyImport");

describe("spyCanvas helpers", () => {
	it("forwards the call and returns the underlying spy", async () => {
		// stub the dynamic import with a simple function spy
		const fakeSpy = vi.fn();

		vi.resetAllMocks();
		vi.mocked(spyImport).mockResolvedValue(forceCast<SpyLike>(fakeSpy));

		const result = await spyResizeCanvasToDisplaySize();

		expect(result).toBe(forceCast<ResizeSpy>(fakeSpy));
		expect(spyImport).toHaveBeenCalledWith("@/react/lib/canvas/resizeCanvasToDisplaySize");
	});
});
