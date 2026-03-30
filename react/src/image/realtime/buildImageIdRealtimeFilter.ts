const REALTIME_IN_FILTER_MAX = 100;
const REALTIME_IN_FILTER_START = 0;

/**
 * Build an `image_id=in.(...)` filter for Supabase realtime.
 *
 * @param imageIds - Image ids to include in the filter.
 * @returns PostgREST-style realtime filter string.
 */
export default function buildImageIdRealtimeFilter(imageIds: readonly string[]): string {
	const quoted = imageIds
		.slice(REALTIME_IN_FILTER_START, REALTIME_IN_FILTER_MAX)
		.map((id) => `"${String(id).replaceAll('"', String.raw`\"`)}"`)
		.join(",");

	return `image_id=in.(${quoted})`;
}
