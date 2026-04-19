const ANNOTATION_KEY_SLICE = 10;

/**
 * Build a stable React key for a segment that avoids using the raw array index.
 *
 * @param position - Character offset of the segment within its line
 * @param annotation - Floating annotation string, or undefined for plain segments
 * @returns A string suitable for use as a React key
 */
export default function buildSegmentKey(
	position: number,
	annotation: string | undefined,
): string {
	return `${String(position)}-${annotation?.slice(ANNOTATION_KEY_SLICE) ?? "plain"}`;
}
