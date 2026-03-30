import type { Page } from "@playwright/test";
import { Effect } from "effect";

import clickEffect from "@/e2e/utils/clickEffect.e2e-util.ts";
import expectHiddenEffect from "@/e2e/utils/expectHiddenEffect.e2e-util.ts";
import expectVisibleEffect from "@/e2e/utils/expectVisibleEffect.e2e-util.ts";
import fillEffect from "@/e2e/utils/fillEffect.e2e-util.ts";
import pressEffect from "@/e2e/utils/pressEffect.e2e-util.ts";

type TagEditOptions = {
	page: Page;
	tagSlug: string;
	timeoutMs: number;
	placeholder?: string;
};

const DEFAULT_TAG_PLACEHOLDER = "Add tags\u2026";

/**
 * Adds a tag in the edit UI and waits for the remove button to appear.
 *
 * @param options - Tag edit options for the current page.
 * @returns Effect that resolves once the tag chip is visible.
 */
export function addTagInEditUi(options: TagEditOptions): Effect.Effect<void, Error> {
	return Effect.gen(function* addTagInEditUiEffect($) {
		const placeholder = options.placeholder ?? DEFAULT_TAG_PLACEHOLDER;
		const tagInput = options.page.getByPlaceholder(placeholder);
		yield* $(fillEffect(tagInput, options.tagSlug));
		yield* $(pressEffect(tagInput, "Enter"));
		yield* $(
			expectVisibleEffect(options.page.getByLabel(`Remove tag ${options.tagSlug}`), {
				timeout: options.timeoutMs,
			}),
		);
	});
}

/**
 * Removes a tag in the edit UI and waits for the remove button to disappear.
 *
 * @param options - Tag edit options for the current page.
 * @returns Effect that resolves once the tag chip is removed.
 */
export function removeTagInEditUi(options: TagEditOptions): Effect.Effect<void, Error> {
	return Effect.gen(function* removeTagInEditUiEffect($) {
		const removeButton = options.page.getByLabel(`Remove tag ${options.tagSlug}`);
		yield* $(expectVisibleEffect(removeButton, { timeout: options.timeoutMs }));
		yield* $(clickEffect(removeButton));
		yield* $(expectHiddenEffect(removeButton, { timeout: options.timeoutMs }));
	});
}

/**
 * Asserts that the tag chip is visible in the edit UI.
 *
 * @param options - Tag edit options for the current page.
 * @returns Effect that resolves once the tag chip is visible.
 */
export function expectTagInEditUi(options: TagEditOptions): Effect.Effect<void, Error> {
	return Effect.gen(function* expectTagInEditUiEffect($) {
		yield* $(
			expectVisibleEffect(options.page.getByLabel(`Remove tag ${options.tagSlug}`), {
				timeout: options.timeoutMs,
			}),
		);
	});
}

/**
 * Asserts that the tag chip is not visible in the edit UI.
 *
 * @param options - Tag edit options for the current page.
 * @returns Effect that resolves once the tag chip is hidden.
 */
export function expectTagNotInEditUi(options: TagEditOptions): Effect.Effect<void, Error> {
	return Effect.gen(function* expectTagNotInEditUiEffect($) {
		yield* $(
			expectHiddenEffect(options.page.getByLabel(`Remove tag ${options.tagSlug}`), {
				timeout: options.timeoutMs,
			}),
		);
	});
}
