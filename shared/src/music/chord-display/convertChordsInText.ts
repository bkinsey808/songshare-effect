import type { SongKey } from "@/shared/song/songKeyOptions";

import formatStoredChordToken from "./formatStoredChordToken";
import parseChordTokenBody from "./parseChordTokenBody";

const TOKEN_BODY_CAPTURE_GROUP_INDEX = 1;

/**
 * Re-encodes a single bracketed chord token relative to a new song key.
 *
 * Absolute-root tokens (e.g. `[G 7]`) are converted to their Roman-degree
 * equivalents (e.g. `[V 7]`) when `songKey` is a valid key. Roman-degree
 * tokens are returned unchanged because they are already key-relative.
 *
 * @param token - A full bracketed chord token such as `[G 7]` or `[V 7]`
 * @param songKey - The song key to relativize against, or `""` for no key
 * @returns The canonical chord token for storage
 */
export function convertChordToken(token: string, songKey: SongKey | ""): string {
	const match = /^\[(.+)\]$/.exec(token);
	const tokenBody = match?.[TOKEN_BODY_CAPTURE_GROUP_INDEX];
	if (tokenBody === undefined) {
		return token;
	}
	const parsed = parseChordTokenBody(tokenBody);
	if (parsed === undefined || parsed.rootType === "roman") {
		return token;
	}
	return formatStoredChordToken({
		root: parsed.root,
		rootType: "absolute",
		shapeCode: parsed.shapeCode,
		songKey,
	});
}

/**
 * Re-encodes all bracketed chord tokens in a text string relative to a new song key.
 *
 * Applies `convertChordToken` to every `[token]` pattern found. Tokens with
 * Roman-degree roots are left unchanged. Non-chord bracket patterns that fail
 * parsing are also left unchanged.
 *
 * @param text - Arbitrary text that may contain chord tokens (e.g. lyrics)
 * @param songKey - The song key to relativize against, or `""` for no key
 * @returns Text with all absolute chord tokens re-encoded as Roman-degree tokens
 */
export function convertChordsInText(text: string, songKey: SongKey | ""): string {
	return text.replaceAll(/\[([^\]]+)\]/g, (match: string, tokenBody: string) => {
		const parsed = parseChordTokenBody(tokenBody);
		if (parsed === undefined || parsed.rootType === "roman") {
			return match;
		}
		return formatStoredChordToken({
			root: parsed.root,
			rootType: "absolute",
			shapeCode: parsed.shapeCode,
			songKey,
		});
	});
}
