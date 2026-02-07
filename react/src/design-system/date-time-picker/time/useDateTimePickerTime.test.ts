import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeChangeEvent } from "@/react/test-utils/dom-events";

import useDateTimePickerTime from "./useDateTimePickerTime";

describe("useDateTimePickerTime", () => {
	it("initializes hours and minutes from selectedTime", () => {
		const onTimeSelect = vi.fn();
		const { result } = renderHook(() => useDateTimePickerTime("08:15", onTimeSelect));

		expect(result.current.hours).toBe("08");
		expect(result.current.minutes).toBe("15");
	});

	it("handleHoursChange updates hours and calls onTimeSelect when length complete", async () => {
		const onTimeSelect = vi.fn();
		const { result } = renderHook(() => useDateTimePickerTime("00:30", onTimeSelect));

		result.current.handleHoursChange(makeChangeEvent("09"));

		await waitFor(() => {
			expect(result.current.hours).toBe("09");
			expect(onTimeSelect).toHaveBeenCalledWith("09:30");
		});
	});

	it("handleMinutesChange updates minutes and calls onTimeSelect when length complete", async () => {
		const onTimeSelect = vi.fn();
		const { result } = renderHook(() => useDateTimePickerTime("07:00", onTimeSelect));

		result.current.handleMinutesChange(makeChangeEvent("45"));

		await waitFor(() => {
			expect(result.current.minutes).toBe("45");
			expect(onTimeSelect).toHaveBeenCalledWith("07:45");
		});
	});

	it("does not call onTimeSelect for partial segments", async () => {
		const onTimeSelect = vi.fn();
		const { result } = renderHook(() => useDateTimePickerTime("", onTimeSelect));

		result.current.handleHoursChange(makeChangeEvent("1"));

		await waitFor(() => {
			expect(onTimeSelect).not.toHaveBeenCalled();
		});
	});
});
