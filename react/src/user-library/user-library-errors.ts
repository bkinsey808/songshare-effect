import { Data } from "effect";

/**
 * Network error from user lookup API operations.
 * Indicates fetch failure, HTTP errors, or response parsing issues.
 */
// oxlint-disable-next-line new-cap
export class NetworkError extends Data.TaggedError("NetworkError") {
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
 */
// oxlint-disable-next-line new-cap
export class ParseError extends Data.TaggedError("ParseError") {
	constructor(override readonly message: string) {
		super();
	}
}
