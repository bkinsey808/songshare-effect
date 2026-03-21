import { Data } from "effect";

/**
 * Network error from user lookup API operations.
 * Indicates fetch failure, HTTP errors, or response parsing issues.
 * @returns N/A (TaggedError constructor)
 */
export class NetworkError extends Data.TaggedError("NetworkError") { // oxlint-disable-line new-cap
	constructor(
		override readonly message: string,
		readonly statusCode?: number,
	) {
		super();
	}
}

/**
 * Parse error from user lookup API operations.
 * Indicates invalid response format or schema validation failures.
 * @returns N/A (TaggedError constructor)
 */
export class ParseError extends Data.TaggedError("ParseError") { // oxlint-disable-line new-cap
	constructor(override readonly message: string) {
		super();
	}
}
