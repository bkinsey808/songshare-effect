import isRecord from "@/shared/type-guards/isRecord";

const FIRST_ROW_INDEX = 0;
const LAST_SEGMENT_INDEX = -1;

/**
 * Parses the last URL segment and returns it as an id.
 *
 * @param url URL string to parse.
 * @param label Label used in the error message for context.
 * @return Parsed id string.
 */
export function getIdFromEditUrl(url: string, label: string): string {
	const lastSegment = url.split("/").at(LAST_SEGMENT_INDEX);
	if (lastSegment === undefined || lastSegment.trim() === "") {
		throw new Error(`Could not determine ${label} id from edit URL: ${url}`);
	}
	return lastSegment;
}

/**
 * Extracts an id from a public table response payload.
 *
 * Accepts either a single-row object or an array and returns the field value.
 *
 * @param payload Parsed response payload.
 * @param key Key that holds the id value.
 * @return Id string when present, otherwise undefined.
 */
export function extractIdFromPublicRows(
	payload: unknown,
	key: string,
): string | undefined {
	if (isRecord(payload)) {
		const maybeId = payload[key];
		return typeof maybeId === "string" && maybeId !== "" ? maybeId : undefined;
	}

	if (!Array.isArray(payload)) {
		return undefined;
	}

	const rows: readonly unknown[] = payload;
	const firstRow = rows[FIRST_ROW_INDEX];
	if (!isRecord(firstRow)) {
		return undefined;
	}

	const maybeId = firstRow[key];
	return typeof maybeId === "string" && maybeId !== "" ? maybeId : undefined;
}
