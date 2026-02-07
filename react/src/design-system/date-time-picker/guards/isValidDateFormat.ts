/**
 * Validates that a string matches the YYYY/MM/DD format for dates.
 *
 * @param dateStr - String to validate
 * @returns True if the string is a valid date in YYYY/MM/DD format
 */
import {
	MIN_MONTH,
	MAX_MONTH,
	MIN_DAY,
	MAX_DAY,
	MONTH_OFFSET,
} from "@/react/design-system/date-time-picker/date-time-picker-constants";

export default function isValidDateFormat(dateStr: string): boolean {
	const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
	if (!dateRegex.test(dateStr)) {
		return false;
	}

	const [yearStr, monthStr, dayStr] = dateStr.split("/");
	if (yearStr === undefined || monthStr === undefined || dayStr === undefined) {
		return false;
	}

	const year = Number(yearStr);
	const month = Number(monthStr);
	const day = Number(dayStr);

	// Check valid month and day ranges
	if (month < MIN_MONTH || month > MAX_MONTH || day < MIN_DAY || day > MAX_DAY) {
		return false;
	}

	// Check if the date actually exists (handles Feb 29 in leap years)
	// Use numeric constructor to avoid timezone parsing issues
	const date = new Date(year, month - MONTH_OFFSET, day);
	return (
		date.getFullYear() === year &&
		date.getMonth() + MONTH_OFFSET === month &&
		date.getDate() === day
	);
}
