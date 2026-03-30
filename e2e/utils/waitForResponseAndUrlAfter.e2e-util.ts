import type { Page, Response } from "@playwright/test";
import type { Effect } from "effect";
import fromPromise from "@/e2e/utils/fromPromise.e2e-util.ts";

type WaitOptions = { timeout?: number };
type WaitForResponseMatcher = Parameters<Page["waitForResponse"]> extends [infer Matcher, ...unknown[]]
	? Matcher
	: never;
type WaitForURLMatcher = Parameters<Page["waitForURL"]> extends [infer Matcher, ...unknown[]]
	? Matcher
	: never;

/**
 * Wait for both a network response and URL change triggered by an action.
 *
 * @param args - Page, matchers, triggering action, and optional wait settings.
 * @returns An Effect that resolves with the matched network response.
 */
export default function waitForResponseAndUrlAfter(args: {
	page: Page;
	responseMatcher: WaitForResponseMatcher;
	urlMatcher: WaitForURLMatcher;
	action: () => Promise<unknown>;
	responseOptions?: WaitOptions;
	urlOptions?: WaitOptions;
}): Effect.Effect<Response, Error> {
	return fromPromise(async () => {
		const responsePromise = args.page.waitForResponse(
			args.responseMatcher,
			args.responseOptions,
		);
		const urlPromise = args.page.waitForURL(args.urlMatcher, args.urlOptions);
		await args.action();
		const response = await responsePromise;
		await urlPromise;
		return response;
	});
}
