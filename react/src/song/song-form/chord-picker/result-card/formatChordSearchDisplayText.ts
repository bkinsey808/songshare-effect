/**
 * Formats chord search result text with Unicode accidentals for note names and intervals.
 *
 * @param value - Raw search result text to format
 * @returns Search result text with Unicode sharp and flat symbols
 */
export default function formatChordSearchDisplayText(value: string): string {
	return value
		.replaceAll(/([A-G])#/g, "$1♯")
		.replaceAll(/([A-G])b/g, "$1♭")
		.replaceAll(/(^|[,( /])#(?=\d)/g, "$1♯")
		.replaceAll(/(^|[,( /])b(?=\d)/g, "$1♭");
}
