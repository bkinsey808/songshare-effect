import { MAX_PARTS } from "@/react/design-system/date-time-picker/date-time-picker-constants";

import isValidDateFormat from "./isValidDateFormat";
import isValidTimeFormat from "./isValidTimeFormat";

/**
 * Validates that a string matches YYYY/MM/DD HH:mm format or is a valid partial input.
 *
 * Allows complete format (YYYY/MM/DD HH:mm) or just date (YYYY/MM/DD).
 *
 * @param dateTimeStr - String to validate
 * @returns True if the string is valid or partially valid (contains just date)
 */
export default function isValidDateTimeFormat(dateTimeStr: string): boolean {
	if (dateTimeStr === "") {
		return true; // Empty is always valid
	}

	const [datePart, timePart] = dateTimeStr.split(" ");

	// Check date part
	if (datePart === undefined) {
		return false;
	}
	if (!isValidDateFormat(datePart)) {
		return false;
	}

	// If there's more than 2 parts (date + time), it's invalid
	const parts = dateTimeStr.split(" ");
	if (parts.length > MAX_PARTS) {
		return false;
	}

	// If there's a time part, validate it
	if (timePart !== undefined) {
		return isValidTimeFormat(timePart);
	}

	// Just date is valid
	return true;
}
