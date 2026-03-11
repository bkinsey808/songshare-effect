import { cleanup, render, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useSchedule from "./useSchedule";

describe("useSchedule — renderHook", () => {
	it("returns a schedule function", () => {
		const { result } = renderHook(() => useSchedule());
		expect(typeof result.current).toBe("function");
	});

	it("runs scheduled callback on microtask queue", async () => {
		const callback = vi.fn();
		const { result } = renderHook(() => useSchedule());
		result.current(callback);

		expect(callback).not.toHaveBeenCalled();

		const EXPECTED_CALL_COUNT = 1;
		await waitFor(() => {
			expect(callback).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);
		});
	});

	it("does not run callback after unmount", async () => {
		const callback = vi.fn();
		const { result, unmount } = renderHook(() => useSchedule());
		result.current(callback);
		unmount();

		await waitFor(() => {
			expect(callback).not.toHaveBeenCalled();
		});
	});
});

describe("useSchedule — Harness", () => {
	it("harness schedules callback", async () => {
		cleanup();
		const callback = vi.fn();

		function Harness(): ReactElement {
			const schedule = useSchedule();
			return (
				<button
					type="button"
					data-testid="trigger"
					onClick={() => {
					schedule(callback);
				}}
				>
					Schedule
				</button>
			);
		}

		const { getByTestId } = render(<Harness />);
		getByTestId("trigger").click();

		await waitFor(() => {
			expect(callback).toHaveBeenCalledWith();
		});
	});
});
