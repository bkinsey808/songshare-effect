import { FLAT_INTERVAL_MAP, ROOT_INTERVAL } from "@/react/music/intervals/interval-constants";

/**
 * Converts flat intervals in a comma-separated spelling to their enharmonic
 * sharp equivalents when contextually clearer.
 *
 * Switches to sharp when BOTH conditions hold:
 *  - The natural of the same scale degree is already present, AND
 *  - The natural of the lower scale degree is NOT present.
 *
 * The root (1) is treated as always present, so b2 never converts to #1.
 *
 * @param spelling - Comma-separated interval spelling, e.g. "b5,5"
 * @returns Spelling with context-aware accidentals, e.g. "#4,5"
 *
 * @example
 * preferSharpIntervals("b5,5")     // → "#4,5"
 * preferSharpIntervals("4,b5,5")   // → "4,b5,5"
 * preferSharpIntervals("b3,5")     // → "b3,5"
 */
export default function preferSharpIntervals(spelling: string): string {
	if (spelling === "") {
		return "";
	}

	const intervals = spelling.split(",").map((part) => part.trim());
	const intervalSet = new Set(intervals);
	intervalSet.add(ROOT_INTERVAL);

	return intervals
		.map((interval) => {
			const entry = FLAT_INTERVAL_MAP[interval];
			if (entry === undefined) {
				return interval;
			}
			const { sameNatural, lowerNatural, sharpEquiv } = entry;
			if (intervalSet.has(sameNatural) && !intervalSet.has(lowerNatural)) {
				return sharpEquiv;
			}
			return interval;
		})
		.join(",");
}
