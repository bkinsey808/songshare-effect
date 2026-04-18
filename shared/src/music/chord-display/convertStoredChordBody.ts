import type { SongKey } from "@/shared/song/songKeyOptions";

import formatStoredChordToken from "./formatStoredChordToken";
import normalizeStoredChordBody from "./normalizeStoredChordBody";
import parseChordTokenBody from "./parseChordTokenBody";

/**
 * Re-encodes a stored chord body relative to a new song key.
 *
 * @param storedChordBody - Raw stored chord body such as `G 7` or `V 7`
 * @param songKey - The song key to relativize against, or `""` for no key
 * @returns Canonical stored chord body without brackets
 */
export default function convertStoredChordBody(
	storedChordBody: string,
	songKey: SongKey | "",
): string {
	const normalizedChordBody = normalizeStoredChordBody(storedChordBody);
	if (normalizedChordBody === undefined) {
		return storedChordBody;
	}

	const parsedToken = parseChordTokenBody(normalizedChordBody);
	if (parsedToken === undefined || parsedToken.rootType === "roman") {
		return normalizedChordBody;
	}

	const storedChordToken = formatStoredChordToken({
		root: parsedToken.root,
		rootType: "absolute",
		shapeCode: parsedToken.shapeCode,
		songKey,
	});

	return normalizeStoredChordBody(storedChordToken) ?? normalizedChordBody;
}
