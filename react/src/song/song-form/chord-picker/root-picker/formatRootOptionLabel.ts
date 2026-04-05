/**
 * Formats root option labels with Unicode accidentals.
 *
 * @param label - Root option label to format
 * @returns Display-ready root label
 */
export default function formatRootOptionLabel(label: string): string {
	return label
		.replaceAll(/(^|[ ])#/g, "$1♯")
		.replaceAll(/(^|[ ])b(?=[IV]+)/g, "$1♭")
		.replaceAll(/([A-G])#/g, "$1♯")
		.replaceAll(/([A-G])b/g, "$1♭");
}
