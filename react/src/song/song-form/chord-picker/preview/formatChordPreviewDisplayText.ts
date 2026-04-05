/**
 * Formats chord preview text with Unicode accidentals for note names, roman degrees, and intervals.
 *
 * @param value - Raw preview text to format
 * @returns Preview text with Unicode sharp and flat symbols
 */
export default function formatChordPreviewDisplayText(value: string): string {
	return value
		.replaceAll(/([A-G])#/g, "$1♯")
		.replaceAll(/([A-G])b/g, "$1♭")
		.replaceAll(/(^|[[,( /])#(?=[IV]+)/g, "$1♯")
		.replaceAll(/(^|[[,( /])b(?=[IV]+)/g, "$1♭")
		.replaceAll(/(^|[,( /])#(?=\d)/g, "$1♯")
		.replaceAll(/(^|[,( /])b(?=\d)/g, "$1♭");
}
