import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeChangeEvent } from "@/react/lib/test-utils/dom-events";

import useDateTimePickerCalendar from "./useDateTimePickerCalendar";

const FEB = 2;
const YEAR_2026 = 2026;
const DAY_7 = 7;
const DAY_3 = 3;
const DECEMBER = 12;
const YEAR_2025 = 2025;
const JANUARY = 1;
const YEAR_2027 = 2027;
const YEAR_2030 = 2030;

describe("useDateTimePickerCalendar", () => {
	it("initializes displayMonth/displayYear and selectedDateObj from selectedDate", () => {
		const onDateSelect = vi.fn();
		const { result } = renderHook(() => useDateTimePickerCalendar("2026/02/07", onDateSelect));

		expect(result.current.displayMonth).toBe(FEB);
		expect(result.current.displayYear).toBe(YEAR_2026);
		expect(result.current.selectedDateObj?.getDate()).toBe(DAY_7);
	});

	it("handleSelectDate calls onDateSelect with padded date", async () => {
		const onDateSelect = vi.fn();
		const { result } = renderHook(() => useDateTimePickerCalendar("2026/02/07", onDateSelect));

		result.current.handleSelectDate(DAY_3);

		await waitFor(() => {
			expect(onDateSelect).toHaveBeenCalledWith("2026/02/03");
		});
	});

	it("previous/next month wrap and adjust year correctly", async () => {
		const onDateSelect = vi.fn();
		const { result: r1 } = renderHook(() => useDateTimePickerCalendar("2026/01/10", onDateSelect));

		r1.current.handlePreviousMonth();
		await waitFor(() => {
			expect(r1.current.displayMonth).toBe(DECEMBER);
			expect(r1.current.displayYear).toBe(YEAR_2025);
		});

		const { result: r2 } = renderHook(() => useDateTimePickerCalendar("2026/12/10", onDateSelect));

		r2.current.handleNextMonth();
		await waitFor(() => {
			expect(r2.current.displayMonth).toBe(JANUARY);
			expect(r2.current.displayYear).toBe(YEAR_2027);
		});
	});

	it("handleYearChange updates the displayYear when valid", async () => {
		const onDateSelect = vi.fn();
		const { result } = renderHook(() => useDateTimePickerCalendar("2026/02/07", onDateSelect));

		result.current.handleYearChange(makeChangeEvent(String(YEAR_2030)));

		await waitFor(() => {
			expect(result.current.displayYear).toBe(YEAR_2030);
		});
	});
});
