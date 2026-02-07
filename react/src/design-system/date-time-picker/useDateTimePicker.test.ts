import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeChangeEvent } from "@/react/test-utils/dom-events";

import useDateTimePicker from "./useDateTimePicker";

describe("useDateTimePicker", () => {
	it("parses date and time parts from value", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() => useDateTimePicker("2026/02/07 12:34", onChange));

		expect(result.current.datePart).toBe("2026/02/07");
		expect(result.current.timePart).toBe("12:34");
	});

	it("handleChange calls onChange with raw input", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() => useDateTimePicker(undefined, onChange));

		result.current.handleChange(makeChangeEvent("foo"));

		expect(onChange).toHaveBeenCalledWith("foo");
	});

	it("handleDateSelect preserves time when present", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() => useDateTimePicker("2026/02/07 12:34", onChange));

		result.current.handleDateSelect("2026/03/08");

		expect(onChange).toHaveBeenCalledWith("2026/03/08 12:34");
	});

	it("handleDateSelect sets just the date when no time present", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() => useDateTimePicker("2026/02/07", onChange));

		result.current.handleDateSelect("2026/03/08");

		expect(onChange).toHaveBeenCalledWith("2026/03/08");
	});

	it("handleTimeSelect replaces or appends time when value present", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() => useDateTimePicker("2026/02/07", onChange));

		result.current.handleTimeSelect("09:00");

		expect(onChange).toHaveBeenCalledWith("2026/02/07 09:00");
	});
});
