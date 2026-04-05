import { isSongKey } from "@/shared/song/songKeyOptions";

import isRomanDegree from "./isRomanDegree";
import type { ParsedChordToken } from "./ParsedChordToken.type";

/**
 * Parses the body of a bracketed chord token into its root and shape parts.
 *
 * @param tokenBody - Token contents without surrounding brackets
 * @returns Parsed chord token data when the root is recognized
 */
export default function parseChordTokenBody(tokenBody: string): ParsedChordToken | undefined {
	const trimmedBody = tokenBody.trim();
	if (trimmedBody === "") {
		return undefined;
	}

	const [rawRoot, ...rest] = trimmedBody.split(/\s+/g);
	if (!isSongKey(rawRoot) && !isRomanDegree(rawRoot)) {
		return undefined;
	}

	const shapeCode = rest.join(" ").trim();

	if (isSongKey(rawRoot)) {
		return {
			root: rawRoot,
			rootType: "absolute",
			shapeCode,
		};
	}

	return {
		root: rawRoot,
		rootType: "roman",
		shapeCode,
	};
}
