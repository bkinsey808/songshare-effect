import parseChordTokenBody from "./parseChordTokenBody";

const TOKEN_BODY_CAPTURE_GROUP_INDEX = 1;

/**
 * Normalizes a stored chord value to its canonical body form without brackets.
 *
 * Accepts either legacy bracketed tokens like `[V M]` or raw stored bodies
 * like `V M`.
 *
 * @param value - Candidate stored chord value
 * @returns Canonical chord body without brackets, or undefined when invalid
 */
export default function normalizeStoredChordBody(value: string): string | undefined {
	const trimmedValue = value.trim();
	if (trimmedValue === "") {
		return undefined;
	}

	const tokenBody =
		/^\[([^[\]]+?)\]$/.exec(trimmedValue)?.[TOKEN_BODY_CAPTURE_GROUP_INDEX] ?? trimmedValue;
	const parsedToken = parseChordTokenBody(tokenBody);
	if (parsedToken === undefined) {
		return undefined;
	}

	return parsedToken.shapeCode === ""
		? parsedToken.root
		: `${parsedToken.root} ${parsedToken.shapeCode}`;
}
