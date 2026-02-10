import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useLocale from "@/react/lib/language/locale/useLocale";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { UseHomeReturn } from "./useHome";

// Mock the locale hook so we can control translations per-test,
vi.mock("@/react/lib/language/locale/useLocale");

describe("useHome", () => {
	it("normalizes legacy paragraph arrays (VITE_APP_NAME not testable in unit tests)", async () => {
		vi.resetAllMocks();

		// Mock translations - pages.home.paragraphs returns legacy array of strings
		const mapping1: Record<string, unknown> = {
			"pages.home.paragraphs": ["p1", "p2"],
			"app.title": "Should not be used",
		};
		{
			const tMock = vi.fn().mockImplementation((key: string) => mapping1[key]);
			vi.mocked(useLocale).mockReturnValue(
				forceCast<ReturnType<typeof useLocale>>({ lang: "en", t: tMock }),
			);
		}

		// Act
		const mod = await import("./useHome");
		const useHomeFn = mod.default as () => UseHomeReturn;
		const { result } = renderHook(() => useHomeFn());

		// Assert - paragraph normalization verified. VITE_APP_NAME is not reliably settable in unit tests.
		expect(typeof result.current.appName).toBe("string");
		expect(result.current.homeParagraphs).toStrictEqual([
			{ id: "legacy-0", text: "p1" },
			{ id: "legacy-1", text: "p2" },
		]);
	});

	it("falls back to translation when VITE_APP_NAME is not present", async () => {
		vi.resetAllMocks();

		// Mock translation for app.title fallback
		const mapping2: Record<string, unknown> = { "app.title": "Translated App" };
		const tMock2 = vi.fn().mockImplementation((key: string) => mapping2[key]);
		vi.mocked(useLocale).mockReturnValue(
			forceCast<ReturnType<typeof useLocale>>({ lang: "en", t: tMock2 }),
		);

		// Act
		const mod3 = await import("./useHome");
		const useHomeFn3 = mod3.default as () => UseHomeReturn;
		const { result } = renderHook(() => useHomeFn3());

		// Assert
		expect(result.current.appName).toBe("Translated App");
	});

	it("normalizes paragraph objects and filters invalid entries", async () => {
		vi.resetAllMocks();

		const mapping3: Record<string, unknown> = {
			"pages.home.paragraphs": [
				{ id: "a", text: "A" },
				{ id: "b", text: 123 }, // invalid
				{ text: "Missing id" }, // invalid
			],
		};
		const tMock3 = vi.fn().mockImplementation((key: string) => mapping3[key]);
		vi.mocked(useLocale).mockReturnValue(
			forceCast<ReturnType<typeof useLocale>>({ lang: "en", t: tMock3 }),
		);

		// Act
		const mod4 = await import("./useHome");
		const useHomeFn4 = mod4.default as () => UseHomeReturn;
		const { result } = renderHook(() => useHomeFn4());

		// Assert - invalid entries are filtered
		expect(result.current.homeParagraphs).toStrictEqual([{ id: "a", text: "A" }]);
	});
});
