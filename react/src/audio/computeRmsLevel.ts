import clamp01 from "@/react/audio/clamp01";

const BYTE_MIDPOINT = 128;
const BYTE_SCALE = 128;
export default function computeRmsLevelFromTimeDomainBytes(bytes: Uint8Array): number {
	let sumSquares = 0;

	for (const sample of bytes) {
		const centered = sample - BYTE_MIDPOINT;
		const normalized = centered / BYTE_SCALE;
		sumSquares += normalized * normalized;
	}

	const meanSquares = sumSquares / bytes.length;
	const rms = Math.sqrt(meanSquares);
	return clamp01(rms);
}
