import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";

import useEventLeave from "./useEventLeave";

vi.mock("@/react/auth/useCurrentUserId");

describe("useEventLeave", () => {
	it("calls leaveEvent when user is authenticated", () => {
		const mockLeave = vi.fn();
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, leaveEvent: mockLeave }));

		vi.mocked(useCurrentUserId).mockReturnValue("u1");

		const { result } = renderHook(() => useEventLeave());

		result.current("e1");

		expect(mockLeave).toHaveBeenCalledWith("e1", "u1");
	});

	it("does not call leaveEvent when user is not authenticated", () => {
		const mockLeave = vi.fn();
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, leaveEvent: mockLeave }));

		vi.mocked(useCurrentUserId).mockReturnValue(undefined);

		const { result } = renderHook(() => useEventLeave());

		result.current("e1");

		expect(mockLeave).not.toHaveBeenCalled();
	});

	it("does not call leaveEvent when user ID is empty string", () => {
		const mockLeave = vi.fn();
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, leaveEvent: mockLeave }));

		vi.mocked(useCurrentUserId).mockReturnValue("");

		const { result } = renderHook(() => useEventLeave());

		result.current("e1");

		expect(mockLeave).not.toHaveBeenCalled();
	});
});
