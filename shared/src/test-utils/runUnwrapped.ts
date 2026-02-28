/* oxlint-disable no-magic-numbers, no-null, throw-error, prefer-function-declaration */
/* eslint-disable @typescript-eslint/no-throw-literal, @typescript-eslint/only-throw-error */
import { Effect } from "effect";

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

const NOT_FOUND = -1;
const SLICE_OFFSET = 1;

function tryParseJSONFromString(str: string): unknown {
	const trimmed = str.trim();
	try {
		return JSON.parse(trimmed);
	} catch {
		const first = trimmed.indexOf("{");
		const last = trimmed.lastIndexOf("}");
		if (first !== NOT_FOUND && last !== NOT_FOUND && last > first) {
			const sub = trimmed.slice(first, last + SLICE_OFFSET);
			try {
				return JSON.parse(sub);
			} catch {
				return undefined;
			}
		}
		return undefined;
	}
}

/**
 * Run an Effect and unwrap FiberFailure stringified payloads when present.
 * Returns the effect result or throws the original or parsed payload.
 */
export default async function runUnwrapped(
	effect: Effect.Effect<unknown, unknown>,
): Promise<unknown> {
	try {
		return await Effect.runPromise(effect);
	} catch (rawError) {
		// Helper: try parsing JSON from a string. Some runtimes wrap the
		// serialized payload inside additional text (e.g. "(FiberFailure) Error: {...}")
		// so attempt progressively looser extraction strategies.
		// Use the top-level parser which returns `undefined` when parsing fails.
		const tryParseFromString = tryParseJSONFromString;

		// If the runtime threw an Error-like object whose `message` is a
		// JSON-serialized payload (observed as FiberFailure in some runtimes),
		// parse and rethrow the parsed value immediately.
		if (isObject(rawError) && "message" in rawError) {
			const maybeMsg = (rawError as { message?: unknown }).message;
			if (typeof maybeMsg === "string") {
				const parsed = tryParseFromString(maybeMsg);
				if (parsed !== undefined) {
					throw parsed;
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
			const parsed = tryParseFromString(candidate);
			if (parsed !== undefined) {
				throw parsed;
			}
		}

		// If candidate is an Error-like object with a `message` string, try parsing it
		if (isObject(candidate) && "message" in candidate) {
			const maybeMessage = candidate["message"];
			if (typeof maybeMessage === "string") {
				const parsed = tryParseFromString(maybeMessage);
				if (parsed !== undefined) {
					throw parsed;
				}
			}
		}

		// Otherwise rethrow the candidate (or the original raw error)
		throw candidate;
	}
}
