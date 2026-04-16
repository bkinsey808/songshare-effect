import { Effect } from "effect";

import isObject from "../type-guards/isObject";
import toError from "../utils/toError";
import tryParseJsonFromString from "../utils/tryParseJsonFromString";

/**
 * Run an Effect and unwrap FiberFailure stringified payloads when present.
 * Returns the effect result or throws the original or parsed payload.
 *
 * @param effect - The effect to run and unwrap
 * @returns Result of the effect
 */
export default async function runUnwrapped(
	effect: Effect.Effect<unknown, unknown>,
): Promise<unknown> {
	/**
	 * Throw an Error constructed from a parsed payload, optionally copying
	 * non-message properties onto the Error instance for better test assertions.
	 *
	 * @param parsed - Parsed payload (object or other) that should be rethrown
	 * @param cause - Optional original cause value used when constructing the Error
	 * @returns never
	 */
	function throwParsed(parsed: unknown, cause?: unknown): never {
		const err = toError(parsed, cause);
		if (isObject(parsed)) {
			// Build a small plain object of properties to copy (excluding
			// `message`) so we can assign them to the Error in one typed
			// operation.
			const parsedRecord = parsed;
			const copy: Record<string, unknown> = {};
			for (const key in parsedRecord) {
				if (key !== "message") {
					copy[key] = parsedRecord[key];
				}
			}

			// Assign copied properties onto the Error instance. Use a narrow
			// eslint-disable for the local cast only.
			for (const [key, value] of Object.entries(copy)) {
				Object.defineProperty(err, key, {
					value: value,
					configurable: true,
					writable: true,
					enumerable: true,
				});
			}

			// If the parsed payload includes a human-facing `message` string,
			// copy it onto the Error.message so tests and callers observing
			// `message` see the intended short message rather than a JSON blob.
			const maybeMessage = parsedRecord["message"];
			if (typeof maybeMessage === "string") {
				Object.defineProperty(err, "message", {
					value: maybeMessage,
					configurable: true,
					writable: true,
				});
			}
		}
		throw err;
	}

	try {
		return await Effect.runPromise(effect);
	} catch (rawError) {
		// If the runtime threw an Error-like object whose `message` is a
		// JSON-serialized payload (observed as FiberFailure in some runtimes),
		// parse and rethrow the parsed value immediately.
		// If the runtime threw an Error-like object whose `message` is a
		// JSON-serialized payload (observed as FiberFailure in some runtimes),
		// parse and rethrow the parsed value immediately.
		if (isObject(rawError) && "message" in rawError) {
			const maybeMsg = (rawError as { message?: unknown }).message;
			if (typeof maybeMsg === "string") {
				const parsed = tryParseJsonFromString(maybeMsg);
				if (parsed !== undefined) {
					throwParsed(parsed, maybeMsg);
				}
			}
		}

		// Prefer inner failure when runtimes wrap errors in `{ cause: { failure: ... } }`
		let candidate: unknown = rawError;
		if (isObject(rawError) && "cause" in rawError) {
			const { cause } = rawError as { cause?: unknown };
			if (isObject(cause) && "failure" in cause) {
				candidate = cause["failure"];
			} else {
				candidate = cause;
			}
		}

		// If candidate is a JSON string, try to parse and throw the parsed value
		if (typeof candidate === "string") {
			const parsed = tryParseJsonFromString(candidate);
			if (parsed !== undefined) {
				throwParsed(parsed, candidate);
			}
		}

		// If candidate is an Error-like object with a `message` string, try parsing it
		if (isObject(candidate) && "message" in candidate) {
			const maybeMessage = candidate["message"];
			if (typeof maybeMessage === "string") {
				const parsed = tryParseJsonFromString(maybeMessage);
				if (parsed !== undefined) {
					throwParsed(parsed, maybeMessage);
				}
			}
		}

		// Otherwise rethrow the candidate (or the original raw error)
		throw toError(candidate, rawError);
	}
}
