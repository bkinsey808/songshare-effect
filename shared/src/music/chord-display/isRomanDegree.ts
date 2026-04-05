import type { RomanDegree } from "./RomanDegree.type";
import romanDegrees from "./romanDegrees";

const romanDegreeSet = new Set<string>(romanDegrees);

/**
 * Narrows unknown input to a supported roman-degree root token.
 *
 * @param value - Unknown value to check
 * @returns Whether the value is a supported roman degree
 */
export default function isRomanDegree(value: unknown): value is RomanDegree {
	return typeof value === "string" && romanDegreeSet.has(value);
}
