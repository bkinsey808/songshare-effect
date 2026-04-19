import type { AnnotatedSegment } from "./AnnotatedSegment.type";
import buildSegmentKey from "./buildSegmentKey";

/**
 * Build stable React keys for segments based on cumulative character position.
 *
 * @param segments - Annotated segments for a single line
 * @returns Array of stable key strings, one per segment
 */
export default function buildSegmentKeys(segments: readonly AnnotatedSegment[]): string[] {
	const keys: string[] = [];
	let offset = 0;
	for (const segment of segments) {
		keys.push(buildSegmentKey(offset, segment.annotation));
		offset += segment.text.length;
	}
	return keys;
}
