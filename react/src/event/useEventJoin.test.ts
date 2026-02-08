import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";

import useEventJoin from "./useEventJoin";

vi.mock("@/react/auth/useCurrentUserId");

describe("useEventJoin", () => {
	it("calls joinEvent when user is authenticated", () => {
		const mockJoin = vi.fn();
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, joinEvent: mockJoin }));

		vi.mocked(useCurrentUserId).mockReturnValue("u1");

		const { result } = renderHook(() => useEventJoin());

		result.current("e1");

		expect(mockJoin).toHaveBeenCalledWith("e1");
	});

	it("does not call joinEvent when user is not authenticated", () => {
		const mockJoin = vi.fn();
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, joinEvent: mockJoin }));

		vi.mocked(useCurrentUserId).mockReturnValue(undefined);

		const { result } = renderHook(() => useEventJoin());

		result.current("e1");

		expect(mockJoin).not.toHaveBeenCalled();
	});

	it("does not call joinEvent when user ID is empty string", () => {
		const mockJoin = vi.fn();
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, joinEvent: mockJoin }));

		vi.mocked(useCurrentUserId).mockReturnValue("");

		const { result } = renderHook(() => useEventJoin());

		result.current("e1");

		expect(mockJoin).not.toHaveBeenCalled();
	});
});
