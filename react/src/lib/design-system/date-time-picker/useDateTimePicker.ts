import type { ChangeEvent } from "react";

/**
 * Encapsulates parsing and handlers for the date/time picker value.
 *
 * @param value - Current value in "YYYY/MM/DD HH:mm" format, empty string, or undefined
 * @param onChange - Callback invoked when the full value should change
 * @returns handlers and parsed date/time parts for the picker
 */
export default function useDateTimePicker(
	value: string | undefined,
	onChange: (value: string) => void,
): {
	handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
	handleDateSelect: (date: string) => void;
	handleTimeSelect: (time: string) => void;
	datePart?: string | undefined;
	timePart?: string | undefined;
} {
	const TIME_SEPARATOR_FULL = " ";
	const DATE_INDEX = 0;
	const TIME_INDEX = 1;

	/**
	 * Forward raw input changes to the parent picker value handler.
	 *
	 * @param event - Change event from an input element
	 * @returns void
	 */
	function handleChange(event: ChangeEvent<HTMLInputElement>): void {
		onChange(event.target.value);
	}

	/**
	 * When a date is selected, preserve any existing time portion and emit
	 * the combined value to the parent via `onChange`.
	 *
	 * @param date - Selected date string in YYYY/MM/DD format
	 * @returns void
	 */
	function handleDateSelect(date: string): void {
		// Preserve the time if it exists, otherwise use just the date
		if (value !== undefined && value !== "" && value.includes(TIME_SEPARATOR_FULL)) {
			const [, timePart] = value.split(TIME_SEPARATOR_FULL);
			onChange(`${date}${TIME_SEPARATOR_FULL}${timePart}`);
		} else {
			onChange(date);
		}
	}

	/**
	 * When a time is selected, preserve the date portion and emit the
	 * combined value to the parent via `onChange`.
	 *
	 * @param time - Selected time string in HH:mm format
	 * @returns void
	 */
	function handleTimeSelect(time: string): void {
		// Extract the date part from the current value
		if (value !== undefined && value !== "") {
			const [datePart] = value.split(TIME_SEPARATOR_FULL);
			onChange(`${datePart}${TIME_SEPARATOR_FULL}${time}`);
		}
	}

	const parts = value !== undefined && value !== "" ? value.split(TIME_SEPARATOR_FULL) : [];
	const datePart = parts.length > DATE_INDEX ? parts[DATE_INDEX] : undefined;
	const timePart = parts.length > TIME_INDEX ? parts[TIME_INDEX] : undefined;

	return { handleChange, handleDateSelect, handleTimeSelect, datePart, timePart };
}
