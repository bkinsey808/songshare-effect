import { Effect } from "effect";

import { apiTagSearchPath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

/**
 * Searches the current user's tag library for slugs matching the query.
 * Used for autocomplete in the TagInput component.
 *
 * @param query - Search string (matched with ILIKE %query%)
 * @returns An Effect resolving to an array of matching tag slugs (empty on error).
 */
export default function searchTagsEffect(query: string): Effect.Effect<string[]> {
	return Effect.gen(function* searchTagsGen($) {
		const url = `${apiTagSearchPath}?q=${encodeURIComponent(query)}`;

		const response = yield* $(
			Effect.tryPromise({
				try: () => fetch(url, { credentials: "include" }),
				catch: () => new Error("fetch failed"),
			}),
		);

		if (!response.ok) {
			return [];
		}

		const raw: unknown = yield* $(
			Effect.tryPromise({
				try: () => response.json() as Promise<unknown>,
				catch: () => new Error("json parse failed"),
			}),
		);

		if (!isRecord(raw) || !Array.isArray(raw["tags"])) {
			return [];
		}

		return (raw["tags"] as unknown[]).filter((item): item is string => isString(item));
	}).pipe(Effect.catchAll(() => Effect.succeed([])));
}
