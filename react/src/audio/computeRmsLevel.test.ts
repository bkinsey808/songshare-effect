import { describe, it, expect } from "vitest";

import computeRmsLevelFromTimeDomainBytes from "./computeRmsLevel";

const BUFFER_LEN = 2048;
const BYTE_MIDPOINT = 128;
const BYTE_MIN = 0;
const BYTE_MAX = 255;
const CLOSE_PRECISION = 6;
const HIGH_THRESHOLD = 0.9;
const ZERO = 0;
const TWO = 2;

describe("computeRmsLevelFromTimeDomainBytes", () => {
	it("returns 0 for silence (all bytes at midpoint)", () => {
		const bytes = new Uint8Array(BUFFER_LEN).fill(BYTE_MIDPOINT);
		expect(computeRmsLevelFromTimeDomainBytes(bytes)).toBeCloseTo(ZERO, CLOSE_PRECISION);
	});

	it("returns near 1 for max amplitude", () => {
		const bytes = new Uint8Array(BUFFER_LEN);
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = i % TWO === ZERO ? BYTE_MIN : BYTE_MAX; // alternate min/max
		}
		expect(computeRmsLevelFromTimeDomainBytes(bytes)).toBeGreaterThan(HIGH_THRESHOLD);
	});
});
