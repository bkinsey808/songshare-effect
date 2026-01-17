import { describe, expect, it } from "vitest";

import computeRmsLevelFromTimeDomainBytes from "./computeRmsLevel";

describe("computeRmsLevelFromTimeDomainBytes", () => {
	const BUFFER_SIZE = 10;
	const SILENCE_BYTE = 128;
	const MAX_BYTE = 255;
	const MIN_BYTE = 0;
	const EXPECTED_ZERO = 0;
	const EXPECTED_ONE = 1;
	const TWO = 2;
	const ZERO = 0;

	it("returns 0 for silence", () => {
		const silence = new Uint8Array(BUFFER_SIZE).fill(SILENCE_BYTE);
		const level = computeRmsLevelFromTimeDomainBytes(silence);
		expect(level).toBe(EXPECTED_ZERO);
	});

	it("returns 1 for maximum amplitude square wave (0s and 255s)", () => {
		const squareWave = new Uint8Array(BUFFER_SIZE);
		for (let i = 0; i < BUFFER_SIZE; i++) {
			squareWave[i] = i % TWO === ZERO ? MAX_BYTE : MIN_BYTE;
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
