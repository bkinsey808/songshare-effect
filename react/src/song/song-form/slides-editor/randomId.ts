/**
 * Generate a random ID for slides
 */
export default function randomId(): string {
	const RADIX = 36;
	const ID_SLICE_START = 2;
	const ID_SLICE_END = 10;

	return (
		Math.random().toString(RADIX).slice(ID_SLICE_START, ID_SLICE_END) + Date.now().toString(RADIX)
	);
}
