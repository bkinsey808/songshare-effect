import type { Page, Response } from "@playwright/test";
import type { Effect } from "effect";
import fromPromise from "@/e2e/utils/fromPromise.e2e-util.ts";

type WaitOptions = { timeout?: number };
type WaitForResponseMatcher = Parameters<Page["waitForResponse"]> extends [infer Matcher, ...unknown[]]
	? Matcher
	: never;

export default function waitForResponseAfter(args: {
	page: Page;
	responseMatcher: WaitForResponseMatcher;
	action: () => Promise<unknown>;
	options?: WaitOptions;
}): Effect.Effect<Response, Error> {
	return fromPromise(async () => {
		const responsePromise = args.page.waitForResponse(args.responseMatcher, args.options);
		await args.action();
		return responsePromise;
	});
}
