import isValidDateTimeFormat from "./guards/isValidDateTimeFormat";

export type ParsedDateTime = Readonly<{
	year: number;
	month: number;
	day: number;
	hours: number | undefined;
	minutes: number | undefined;
}>;

/**
 * Parses a YYYY/MM/DD HH:mm format string into its components.
 *
 * @param dateTimeStr - String in YYYY/MM/DD or YYYY/MM/DD HH:mm format
 * @returns Object containing year, month, day, hours (optional), and minutes (optional)
 * @throws Error if the format is invalid
 */
export default function parseDateTime(dateTimeStr: string): ParsedDateTime {
	if (!isValidDateTimeFormat(dateTimeStr)) {
		throw new Error(
			`Invalid date/time format: "${dateTimeStr}". Expected YYYY/MM/DD or YYYY/MM/DD HH:mm`,
		);
	}

	const [datePart, timePart] = dateTimeStr.split(" ");

	if (datePart === undefined) {
		throw new Error("Missing date part");
	}

	const [yearStr, monthStr, dayStr] = datePart.split("/");
	if (yearStr === undefined || monthStr === undefined || dayStr === undefined) {
		throw new Error("Invalid date format");
	}

	const year = Number(yearStr);
	const month = Number(monthStr);
	const day = Number(dayStr);

	let hours: number | undefined = undefined;
	let minutes: number | undefined = undefined;

	if (timePart !== undefined) {
		const [hoursStr, minutesStr] = timePart.split(":");
		if (hoursStr === undefined || minutesStr === undefined) {
			throw new Error("Invalid time format");
		}
		hours = Number(hoursStr);
		minutes = Number(minutesStr);
	}

	return { year, month, day, hours, minutes };
}
