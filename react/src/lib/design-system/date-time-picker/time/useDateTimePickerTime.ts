import { useState, type ChangeEvent } from "react";

const HOUR_START = 0;
const HOUR_END = 2;
const MINUTE_START = 3;
const MINUTE_END = 5;
const TIME_SEPARATOR = ":";
const DEFAULT_TIME = "00";
const EXPECTED_SEGMENT_LENGTH = 2;

/**
 * Hook that encapsulates the state and handlers for the time portion of the
 * date/time picker (HH:mm).
 *
 * @param selectedTime - Optional current time in HH:mm format
 * @param onTimeSelect - Callback invoked with a full HH:mm when a segment is complete
 * @returns hours, minutes and change handlers for wiring inputs
 */
export default function useDateTimePickerTime(
	selectedTime: string | undefined,
	onTimeSelect: (time: string) => void,
): {
	hours: string;
	minutes: string;
	handleHoursChange: (event: ChangeEvent<HTMLInputElement>) => void;
	handleMinutesChange: (event: ChangeEvent<HTMLInputElement>) => void;
} {
	const [hours, setHours] = useState<string>(
		selectedTime !== undefined && selectedTime !== ""
			? selectedTime.slice(HOUR_START, HOUR_END)
			: DEFAULT_TIME,
	);
	const [minutes, setMinutes] = useState<string>(
		selectedTime !== undefined && selectedTime !== ""
			? selectedTime.slice(MINUTE_START, MINUTE_END)
			: DEFAULT_TIME,
	);

	function handleHoursChange(event: ChangeEvent<HTMLInputElement>): void {
		const value = event.target.value.slice(HOUR_START, EXPECTED_SEGMENT_LENGTH);
		setHours(value);
		if (value.length === EXPECTED_SEGMENT_LENGTH) {
			onTimeSelect(`${value}${TIME_SEPARATOR}${minutes}`);
		}
	}

	function handleMinutesChange(event: ChangeEvent<HTMLInputElement>): void {
		const value = event.target.value.slice(HOUR_START, EXPECTED_SEGMENT_LENGTH);
		setMinutes(value);
		if (value.length === EXPECTED_SEGMENT_LENGTH) {
			onTimeSelect(`${hours}${TIME_SEPARATOR}${value}`);
		}
	}

	return { hours, minutes, handleHoursChange, handleMinutesChange } as const;
}
