/**
 * App-wide date/time formatting:
 * - Dates: YYYY/MM/DD (e.g. 2026/01/19 for 19 January 2026).
 * - Times: 24-hour / military time (e.g. 14:30:05 for 2:30:05 PM).
 */

const PAD_LENGTH = 2;
const MONTH_OFFSET = 1; // JavaScript getMonth() is 0-based; add 1 for display.

function pad2(num: number): string {
	return String(num).padStart(PAD_LENGTH, "0");
}

/**
 * Format a date as YYYY/MM/DD.
 *
 * @param date - Date object or ISO date string
 * @returns Formatted date string in YYYY/MM/DD form
 */
export default function formatAppDate(date: Date | string): string {
	const value = typeof date === "string" ? new Date(date) : date;
	const year = value.getFullYear();
	const month = pad2(value.getMonth() + MONTH_OFFSET);
	const day = pad2(value.getDate());
	return `${year}/${month}/${day}`;
}

/**
 * Format a date and time as YYYY/MM/DD HH:mm:ss in 24-hour (military) time.
 * Hours are 00–23; no AM/PM.
 *
 * @param date - Date object or ISO date string
 * @returns Formatted date/time string in YYYY/MM/DD HH:mm:ss form
 */
export function formatAppDateTime(date: Date | string): string {
	const value = typeof date === "string" ? new Date(date) : date;
	const datePart = formatAppDate(value);
	const hours = pad2(value.getHours()); // 0–23, 24-hour
	const minutes = pad2(value.getMinutes());
	const seconds = pad2(value.getSeconds());
	return `${datePart} ${hours}:${minutes}:${seconds}`;
}

/**
 * Convert YYYY/MM/DD HH:mm string to HTML datetime-local format (YYYY-MM-DDTHH:mm).
 * Used for setting the value attribute of datetime-local input elements.
 *
 * @param dateTimeStr - Date time string in YYYY/MM/DD HH:mm format
 * @returns Date time string in YYYY-MM-DDTHH:mm format
 */
export function toDatetimeLocalFormat(dateTimeStr: string): string {
	if (!dateTimeStr) {
		return "";
	}
	// Input: "2026/01/19 14:30" → Output: "2026-01-19T14:30"
	return dateTimeStr.replaceAll("/", "-").replace(" ", "T");
}

/**
 * Convert HTML datetime-local format (YYYY-MM-DDTHH:mm) to YYYY/MM/DD HH:mm string.
 * Used for extracting value from datetime-local input elements.
 *
 * @param datetimeLocal - Date time string in YYYY-MM-DDTHH:mm format
 * @returns Date time string in YYYY/MM/DD HH:mm format
 */
export function fromDatetimeLocalFormat(datetimeLocal: string): string {
	if (!datetimeLocal) {
		return "";
	}
	// Input: "2026-01-19T14:30" → Output: "2026/01/19 14:30"
	const [datePart, timePart] = datetimeLocal.split("T");
	if (datePart === undefined || datePart === "") {
		return "";
	}
	const formattedDate = datePart.replaceAll("-", "/");
	const timeDisplay = timePart !== undefined && timePart !== "" ? timePart : "";
	return `${formattedDate} ${timeDisplay}`.trim();
}
