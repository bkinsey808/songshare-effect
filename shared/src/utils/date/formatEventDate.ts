const SPACE_SEPARATOR = " ";
const DATE_COMPONENT_SEPARATOR = "/";
const TIME_COMPONENT_SEPARATOR = ":";
const DEFAULT_TIME = "00:00";
const EXPECTED_DATE_PARTS = 3;
const EXPECTED_TIME_PARTS = 2;
const MONTH_ZERO_OFFSET = 1;
const DATE_RADIX = 10;
const PAD_WIDTH = 2;
const PAD_CHAR = "0";
const MIN_MONTH = 1;
const MAX_MONTH = 12;
const MIN_DAY = 1;
const MAX_DAY = 31;
const MIN_HOUR = 0;
const MAX_HOUR = 23;
const MIN_MINUTE = 0;
const MAX_MINUTE = 59;

/**
 * Validate that parsed date components represent a valid date.
 * Checks that month, day, hour, minute are within valid ranges and that the date itself is valid.
 *
 * @param components - Object containing year, month (1-12), day (1-31), hours (0-23), minutes (0-59)
 * @returns true if all components are within valid ranges and form a valid date
 */
function isValidDateComponents(components: {
	year: number;
	month: number;
	day: number;
	hours: number;
	minutes: number;
}): boolean {
	const { year, month, day, hours, minutes } = components;

	// Check ranges
	if (month < MIN_MONTH || month > MAX_MONTH) {
		return false;
	}
	if (day < MIN_DAY || day > MAX_DAY) {
		return false;
	}
	if (hours < MIN_HOUR || hours > MAX_HOUR) {
		return false;
	}
	if (minutes < MIN_MINUTE || minutes > MAX_MINUTE) {
		return false;
	}

	// Create a date and verify it matches what we expected (catches overflow cases like Feb 30)
	const testDate = new Date(year, month - MONTH_ZERO_OFFSET, day, hours, minutes);
	return (
		testDate.getFullYear() === year &&
		testDate.getMonth() === month - MONTH_ZERO_OFFSET &&
		testDate.getDate() === day
	);
}

/**
 * Convert client-side local time format (YYYY/MM/DD HH:mm) to UTC ISO 8601 timestamp.
 *
 * The user enters a date/time in their LOCAL timezone. This function:
 * 1. Parses YYYY/MM/DD HH:mm as a local date/time
 * 2. Creates a Date object (which converts local to UTC automatically)
 * 3. Returns ISO 8601 UTC string suitable for database storage
 *
 * Example: User in UTC-5 enters "2026/01/19 14:30" (2:30 PM local) → Returns "2026-01-19T19:30:00.000Z" (7:30 PM UTC)
 *
 * @param dateStr - Date string in YYYY/MM/DD or YYYY/MM/DD HH:mm format (local time)
 * @returns ISO 8601 UTC timestamp for database, or undefined if empty/invalid
 */
export function clientLocalDateToUtcTimestamp(
	dateStr: string | null | undefined,
): string | undefined {
	if (dateStr === undefined || dateStr === null || dateStr === "") {
		return undefined;
	}

	const parts = dateStr.split(SPACE_SEPARATOR);
	const [datePart, timePart = DEFAULT_TIME] = parts;

	if (datePart === undefined || datePart === "") {
		return undefined;
	}

	const dateComponents = datePart.split(DATE_COMPONENT_SEPARATOR);
	if (dateComponents.length !== EXPECTED_DATE_PARTS) {
		return undefined;
	}

	const [yearStr, monthStr, dayStr] = dateComponents;

	if (
		yearStr === undefined ||
		yearStr === "" ||
		monthStr === undefined ||
		monthStr === "" ||
		dayStr === undefined ||
		dayStr === ""
	) {
		return undefined;
	}

	const year = Number.parseInt(yearStr, DATE_RADIX);
	const month = Number.parseInt(monthStr, DATE_RADIX);
	const day = Number.parseInt(dayStr, DATE_RADIX);

	const timeComponents = timePart.split(TIME_COMPONENT_SEPARATOR);
	if (timeComponents.length !== EXPECTED_TIME_PARTS) {
		return undefined;
	}

	const [hoursStr, minutesStr] = timeComponents;

	if (hoursStr === undefined || hoursStr === "" || minutesStr === undefined || minutesStr === "") {
		return undefined;
	}

	const hours = Number.parseInt(hoursStr, DATE_RADIX);
	const minutes = Number.parseInt(minutesStr, DATE_RADIX);

	// Validate all components are within valid ranges and form a valid date
	if (
		!isValidDateComponents({
			year,
			month,
			day,
			hours,
			minutes,
		})
	) {
		return undefined;
	}

	// Create a Date object with local time components
	// JavaScript automatically converts this to UTC when calling toISOString()
	const localDate = new Date(year, month - MONTH_ZERO_OFFSET, day, hours, minutes);

	// Convert to ISO 8601 UTC string
	return localDate.toISOString();
}

/**
 * Convert UTC ISO timestamp from database to client-side local time format (YYYY/MM/DD HH:mm).
 *
 * The database stores all dates as UTC. This function:
 * 1. Parses the UTC ISO timestamp
 * 2. Extracts the LOCAL time components using Date methods
 * 3. Formats as YYYY/MM/DD HH:mm for display
 *
 * Example: Database has "2026-01-19T19:30:00Z" (7:30 PM UTC) → User in UTC-5 sees "2026/01/19 14:30" (2:30 PM local)
 *
 * @param utcIsoTimestamp - UTC ISO 8601 timestamp from database
 * @returns Formatted date string in YYYY/MM/DD HH:mm format (local time), or empty string if invalid
 */
export function utcTimestampToClientLocalDate(utcIsoTimestamp: string | null | undefined): string {
	if (utcIsoTimestamp === undefined || utcIsoTimestamp === null || utcIsoTimestamp === "") {
		return "";
	}

	try {
		// Parse UTC timestamp - Date constructor automatically recognizes ISO format
		const utcDate = new Date(utcIsoTimestamp);

		// Check if the date is valid
		if (Number.isNaN(utcDate.getTime())) {
			return "";
		}

		// Only accept full ISO 8601 timestamps (with T and Z)
		// This filters out partial dates like "2026-01-01"
		if (!utcIsoTimestamp.includes("T")) {
			return "";
		}

		// Extract local time components
		// getFullYear(), getMonth(), getDate(), getHours(), getMinutes() return LOCAL time
		const year = utcDate.getFullYear();
		const month = String(utcDate.getMonth() + MONTH_ZERO_OFFSET).padStart(PAD_WIDTH, PAD_CHAR);
		const day = String(utcDate.getDate()).padStart(PAD_WIDTH, PAD_CHAR);
		const hours = String(utcDate.getHours()).padStart(PAD_WIDTH, PAD_CHAR);
		const minutes = String(utcDate.getMinutes()).padStart(PAD_WIDTH, PAD_CHAR);

		// Format as YYYY/MM/DD HH:mm
		return `${year}/${month}/${day} ${hours}:${minutes}`;
	} catch {
		return "";
	}
}
