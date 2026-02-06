import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { awaitAppStoreHydration } from "@/react/app-store/hydration";
import useAppStoreHydrated from "@/react/app-store/useAppStoreHydrated";

import useHydration from "./useHydration";

vi.mock("@/react/app-store/useAppStoreHydrated");
vi.mock("@/react/app-store/hydration");

const mockedUseAppStoreHydrated = vi.mocked(useAppStoreHydrated);
const mockedAwaitAppStoreHydration = vi.mocked(awaitAppStoreHydration);

const ONCE = 1;

describe("useHydration", () => {
	it("should call useAppStoreHydrated on render", () => {
		mockedUseAppStoreHydrated.mockClear();
		mockedUseAppStoreHydrated.mockReturnValue({ isHydrated: false });

		renderHook(() => useHydration());

		expect(mockedUseAppStoreHydrated).toHaveBeenCalledTimes(ONCE);
	});

	it("should return isHydrated as true when store hydrated", () => {
		mockedUseAppStoreHydrated.mockClear();
		mockedUseAppStoreHydrated.mockReturnValue({ isHydrated: true });

		const { result } = renderHook(() => useHydration());

		expect(result.current.isHydrated).toBe(true);
	});

	it("should return isHydrated as false when store not hydrated", () => {
		mockedUseAppStoreHydrated.mockClear();
		mockedUseAppStoreHydrated.mockReturnValue({ isHydrated: false });

		const { result } = renderHook(() => useHydration());

		expect(result.current.isHydrated).toBe(false);
	});

	it("should return awaitHydration function from hydration module", () => {
		mockedUseAppStoreHydrated.mockClear();
		mockedUseAppStoreHydrated.mockReturnValue({ isHydrated: true });

		const { result } = renderHook(() => useHydration());

		expect(result.current.awaitHydration).toBe(mockedAwaitAppStoreHydration);
	});

	it("should return stable reference to awaitHydration across renders", () => {
		mockedUseAppStoreHydrated.mockClear();
		mockedUseAppStoreHydrated.mockReturnValue({ isHydrated: true });

		const { result, rerender } = renderHook(() => useHydration());
		const firstReference = result.current.awaitHydration;

		rerender();

		expect(result.current.awaitHydration).toBe(firstReference);
	});
});
