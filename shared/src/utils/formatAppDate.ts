/**
 * App-wide date/time formatting:
 * - Dates: YYYY/DD/MM (e.g. 2026/19/01 for 19 January 2026).
 * - Times: 24-hour / military time (e.g. 14:30:05 for 2:30:05 PM).
 */

const PAD_LENGTH = 2;
const MONTH_OFFSET = 1; // JavaScript getMonth() is 0-based; add 1 for display.

function pad2(num: number): string {
	return String(num).padStart(PAD_LENGTH, "0");
}

/**
 * Format a date as YYYY/DD/MM.
 */
export default function formatAppDate(date: Date | string): string {
	const value = typeof date === "string" ? new Date(date) : date;
	const year = value.getFullYear();
	const day = pad2(value.getDate());
	const month = pad2(value.getMonth() + MONTH_OFFSET);
	return `${year}/${day}/${month}`;
}

/**
 * Format a date and time as YYYY/DD/MM HH:mm:ss in 24-hour (military) time.
 * Hours are 00–23; no AM/PM.
 */
export function formatAppDateTime(date: Date | string): string {
	const value = typeof date === "string" ? new Date(date) : date;
	const datePart = formatAppDate(value);
	const hours = pad2(value.getHours()); // 0–23, 24-hour
	const minutes = pad2(value.getMinutes());
	const seconds = pad2(value.getSeconds());
	return `${datePart} ${hours}:${minutes}:${seconds}`;
}
