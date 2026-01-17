import { describe, expect, it } from "vitest";

import computeRmsLevelFromTimeDomainBytes from "./computeRmsLevel";

describe("computeRmsLevelFromTimeDomainBytes", () => {
	const BUFFER_SIZE = 10;
	const MAX_BYTE = 255;
	const MIN_BYTE = 0;
	const EXPECTED_ZERO = 0;
	const EXPECTED_ONE = 1;

	const ZERO = 0;
	const ONE = 1;

	it("returns 1 for maximum amplitude square wave (0s and 255s)", () => {
		const pattern: [number, number] = [MAX_BYTE, MIN_BYTE];
		const squareWave = new Uint8Array(BUFFER_SIZE);

		const [highByte, lowByte] = pattern;

		// Square wave: samples alternate between maximum and minimum values (e.g. 255, 0).
		// Why we use a square wave in this test:
		// - deterministic extreme amplitudes exercise normalization and numeric stability
		// - known normalized pair (+1, -1) yields an exact RMS = 1 (easy to assert)
		// - alternating indices also help catch indexing/off-by-one bugs when filling buffers
		for (let i = ZERO; i < BUFFER_SIZE; i += ONE + ONE) {
			squareWave[i] = highByte;
		}
		for (let i = ONE; i < BUFFER_SIZE; i += ONE + ONE) {
			squareWave[i] = lowByte;
		}

		const level = computeRmsLevelFromTimeDomainBytes(squareWave);
		// Root Mean Square of [1, -1] is sqrt((1^2 + (-1)^2) / 2) = sqrt(1) = 1
		expect(level).toBeCloseTo(EXPECTED_ONE);
	});

	it("returns 0 for an empty buffer", () => {
		const empty = new Uint8Array(ZERO);
		const level = computeRmsLevelFromTimeDomainBytes(empty);
		expect(level).toBe(EXPECTED_ZERO);
	});

	it("handles partial volume correctly", () => {
		// A buffer where normalized values are all 0.5 (amplitude 64 centered at 128)
		// 128 + 64 = 192
		const HALF_AMP_BYTE = 192;
		const EXPECTED_HALF = 0.5;
		const buffer = new Uint8Array(BUFFER_SIZE).fill(HALF_AMP_BYTE);
		const level = computeRmsLevelFromTimeDomainBytes(buffer);
		// Mean squares = (0.5^2 * 10) / 10 = 0.25
		// RMS = sqrt(0.25) = 0.5
		expect(level).toBeCloseTo(EXPECTED_HALF);
	});
});
