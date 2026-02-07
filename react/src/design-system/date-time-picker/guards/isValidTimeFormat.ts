import {
	MAX_HOUR,
	MAX_MINUTE,
	MIN_HOUR,
	MIN_MINUTE,
} from "@/react/design-system/date-time-picker/date-time-picker-constants";

/**
 * Validates that a string matches the HH:mm format for times (24-hour).
 *
 * @param timeStr - String to validate
 * @returns True if the string is a valid time in HH:mm format
 */
export default function isValidTimeFormat(timeStr: string): boolean {
	const timeRegex = /^\d{2}:\d{2}$/;
	if (!timeRegex.test(timeStr)) {
		return false;
	}

	const [hoursStr, minutesStr] = timeStr.split(":");
	if (hoursStr === undefined || minutesStr === undefined) {
		return false;
	}

	const hours = Number(hoursStr);
	const minutes = Number(minutesStr);

	return hours >= MIN_HOUR && hours <= MAX_HOUR && minutes >= MIN_MINUTE && minutes <= MAX_MINUTE;
}
