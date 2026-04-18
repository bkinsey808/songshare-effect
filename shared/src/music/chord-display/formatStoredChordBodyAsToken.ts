import normalizeStoredChordBody from "./normalizeStoredChordBody";

/**
 * Wraps a stored chord body in bracket notation for insertion into lyrics.
 *
 * @param storedChordBody - Raw stored chord body such as `V M`
 * @returns Bracketed chord token such as `[V M]`
 */
export default function formatStoredChordBodyAsToken(storedChordBody: string): string {
	const normalizedChordBody = normalizeStoredChordBody(storedChordBody);
	return normalizedChordBody === undefined ? storedChordBody : `[${normalizedChordBody}]`;
}
