import parseChordTokenBody from "@/shared/music/chord-display/parseChordTokenBody";
import type { ParsedChordToken } from "@/shared/music/chord-display/ParsedChordToken.type";

const TOKEN_BODY_START_INDEX = 1;
const TOKEN_BODY_END_OFFSET = -1;

/**
 * Parses the stored chord token only when it has the expected bracketed format.
 *
 * @param initialChordToken - Existing chord token from the editor
 * @returns Parsed chord token details when the input is valid
 */
export default function parseInitialSciToken(
	initialChordToken: string | undefined,
): ParsedChordToken | undefined {
	if (initialChordToken === undefined) {
		return undefined;
	}

	if (!initialChordToken.startsWith("[") || !initialChordToken.endsWith("]")) {
		return undefined;
	}

	return parseChordTokenBody(
		initialChordToken.slice(TOKEN_BODY_START_INDEX, TOKEN_BODY_END_OFFSET),
	);
}
