/** Replaces ASCII accidentals with Unicode: b→♭, #→♯. */
export default function toUnicodeAccidentals(value: string): string {
	return value.replaceAll("b", "♭").replaceAll("#", "♯");
}
