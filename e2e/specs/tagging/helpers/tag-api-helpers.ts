import { expect, type Page } from "@playwright/test";
import { Effect } from "effect";

import { fromPromise } from "@/e2e/utils/effect-test-helpers";
import { apiTagAddToItemPath, apiTagRemoveFromItemPath } from "@/shared/paths";

type TagMutationAction = "add" | "remove";

type TagMutationOptions = {
	page: Page;
	itemId: string;
	itemType: "song" | "playlist" | "community" | "event" | "image";
	tagSlug: string;
	action: TagMutationAction;
};

/**
 * Mutates a tag via the tag API inside an authenticated browser session.
 *
 * @param options Parameters for the tag mutation request.
 * @return Effect that resolves when the API mutation succeeds.
 */
function mutateTagViaApi(options: TagMutationOptions): Effect.Effect<void, Error> {
	return Effect.gen(function* mutateTagViaApiEffect($) {
		const apiPath = options.action === "add" ? apiTagAddToItemPath : apiTagRemoveFromItemPath;
		const result = yield* $(
			fromPromise(() =>
				options.page.evaluate(
					async ({ path, item_id, item_type, tag_slug }) => {
						const response = await fetch(path, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							credentials: "include",
							body: JSON.stringify({
								item_id,
								item_type,
								tag_slug,
							}),
						});
						let body: unknown = undefined;
						try {
							body = await response.json();
						} catch {
							// ignore non-JSON response bodies in the test helper
						}
						return { ok: response.ok, status: response.status, body };
					},
					{
						path: apiPath,
						item_id: options.itemId,
						item_type: options.itemType,
						tag_slug: options.tagSlug,
					},
				),
			),
		);

		expect(result.ok, JSON.stringify(result.body)).toBe(true);
	});
}

export default mutateTagViaApi;
