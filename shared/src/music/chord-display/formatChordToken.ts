import type { ParsedChordToken } from "./ParsedChordToken.type";

/**
 * Reassembles parsed chord token data back into the bracketed storage format.
 *
 * @param token - Parsed chord token to serialize
 * @returns Bracketed chord token string
 */
export default function formatChordToken(token: ParsedChordToken): string {
	return token.shapeCode === "" ? `[${token.root}]` : `[${token.root} ${token.shapeCode}]`;
}
