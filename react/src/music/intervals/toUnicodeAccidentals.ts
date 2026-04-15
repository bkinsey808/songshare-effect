/**
 * Replace ASCII accidentals in a token with their Unicode equivalents.
 *
 * @param value - The string to transform (may contain `b` or `#`).
 * @returns The transformed string with Unicode accidentals (`♭`, `♯`).
 */
export default function toUnicodeAccidentals(value: string): string {
	return value.replaceAll("b", "♭").replaceAll("#", "♯");
}
