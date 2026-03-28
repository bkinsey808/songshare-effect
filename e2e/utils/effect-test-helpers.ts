import {
	expect,
	type BrowserContext,
	type Locator,
	type Page,
	type Response,
} from "@playwright/test";
import { Effect, type Scope } from "effect";

type LocatorExpectOptions = { timeout?: number };
type WaitOptions = { timeout?: number };
type WaitForResponseMatcher = Parameters<Page["waitForResponse"]> extends [infer Matcher, ...unknown[]]
	? Matcher
	: never;
type WaitForURLMatcher = Parameters<Page["waitForURL"]> extends [infer Matcher, ...unknown[]]
	? Matcher
	: never;

/**
 * Normalizes unknown thrown values into Error instances.
 *
 * @param error Thrown value from a failed async operation.
 * @return Error instance that preserves the original message when possible.
 */
function toError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error));
}

/**
 * Wraps a Promise-producing thunk into an Effect with Error failures.
 *
 * @param thunk Lazy async operation to run when the effect is executed.
 * @return Effect that resolves to the thunk result or fails with an Error.
 */
export function fromPromise<TValue>(
	thunk: () => Promise<TValue>,
): Effect.Effect<TValue, Error> {
	return Effect.tryPromise({
		try: thunk,
		catch: toError,
	});
}

/**
 * Wraps a Promise-producing thunk into an Effect that discards the result.
 *
 * @param thunk Lazy async operation to run when the effect is executed.
 * @return Effect that resolves to void or fails with an Error.
 */
export function fromPromiseVoid(
	thunk: () => Promise<unknown>,
): Effect.Effect<void, Error> {
	return Effect.asVoid(fromPromise(thunk));
}

/**
 * Wraps an expect assertion into an Effect for generator composition.
 *
 * @param thunk Lazy assertion to run when the effect is executed.
 * @return Effect that resolves when the assertion completes.
 */
export function expectEffect(
	thunk: () => Promise<unknown>,
): Effect.Effect<void, Error> {
	return fromPromiseVoid(thunk);
}

/**
 * Clicks a locator as an Effect.
 *
 * @param locator Playwright locator to click.
 * @return Effect that resolves once the click completes.
 */
export function clickEffect(locator: Locator): Effect.Effect<void, Error> {
	return fromPromiseVoid(() => locator.click());
}

/**
 * Fills a locator with the provided value.
 *
 * @param locator Playwright locator to fill.
 * @param value Value to type into the locator.
 * @return Effect that resolves once fill completes.
 */
export function fillEffect(locator: Locator, value: string): Effect.Effect<void, Error> {
	return fromPromiseVoid(() => locator.fill(value));
}

/**
 * Presses a key within a locator.
 *
 * @param locator Playwright locator to press the key within.
 * @param key Key string passed to Playwright's press API.
 * @return Effect that resolves once the key press completes.
 */
export function pressEffect(locator: Locator, key: string): Effect.Effect<void, Error> {
	return fromPromiseVoid(() => locator.press(key));
}

/**
 * Asserts that a locator becomes visible.
 *
 * @param locator Playwright locator to assert on.
 * @param options Optional Playwright expect options.
 * @return Effect that resolves when the assertion passes.
 */
export function expectVisibleEffect(
	locator: Locator,
	options?: LocatorExpectOptions,
): Effect.Effect<void, Error> {
	return expectEffect(() => expect(locator).toBeVisible(options));
}

/**
 * Asserts that a locator becomes hidden.
 *
 * @param locator Playwright locator to assert on.
 * @param options Optional Playwright expect options.
 * @return Effect that resolves when the assertion passes.
 */
export function expectHiddenEffect(
	locator: Locator,
	options?: LocatorExpectOptions,
): Effect.Effect<void, Error> {
	return expectEffect(() => expect(locator).not.toBeVisible(options));
}

/**
 * Waits for a response that matches the given predicate after running an action.
 *
 * @param page Playwright page to wait on.
 * @param responseMatcher Response matcher passed to Playwright.
 * @param action Action that triggers the response.
 * @param options Optional Playwright waitForResponse options.
 * @return Effect that resolves with the matching response.
 */
export function waitForResponseAfter(args: {
	page: Page;
	responseMatcher: WaitForResponseMatcher;
	action: () => Promise<unknown>;
	options?: WaitOptions;
}): Effect.Effect<Response, Error> {
	return fromPromise<Response>(async () => {
		const responsePromise = args.page.waitForResponse(args.responseMatcher, args.options);
		await args.action();
		return responsePromise;
	});
}

/**
 * Waits for both a response and a URL change after running an action.
 *
 * @param page Playwright page to wait on.
 * @param responseMatcher Response matcher passed to Playwright.
 * @param urlMatcher URL matcher passed to Playwright.
 * @param action Action that triggers the response and navigation.
 * @param options Optional response and URL wait options.
 * @return Effect that resolves with the matching response after URL settles.
 */
export function waitForResponseAndURLAfter(args: {
	page: Page;
	responseMatcher: WaitForResponseMatcher;
	urlMatcher: WaitForURLMatcher;
	action: () => Promise<unknown>;
	responseOptions?: WaitOptions;
	urlOptions?: WaitOptions;
}): Effect.Effect<Response, Error> {
	return fromPromise<Response>(async () => {
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

/**
 * Executes an Effect and returns a Promise for interop with Playwright tests.
 *
 * @param effect Effect to execute.
 * @return Promise that resolves with the effect success value.
 */
export function runEffect<TValue>(effect: Effect.Effect<TValue, Error>): Promise<TValue> {
	return Effect.runPromise(effect);
}

/**
 * Acquires a browser context and closes it when the scope is released.
 *
 * @param acquire Lazily creates a browser context.
 * @return Scoped Effect that yields the browser context.
 */
export function acquireBrowserContext(
	acquire: () => Promise<BrowserContext>,
): Effect.Effect<BrowserContext, Error, Scope.Scope> {
	return Effect.acquireRelease(
		fromPromise(acquire),
		(ctx) => Effect.ignore(fromPromiseVoid(() => ctx.close())),
	);
}

/**
 * Acquires a new page from a context and closes it when the scope is released.
 *
 * @param ctx Browser context that will create the page.
 * @return Scoped Effect that yields the page.
 */
export function acquirePage(
	ctx: BrowserContext,
): Effect.Effect<Page, Error, Scope.Scope> {
	return Effect.acquireRelease(
		fromPromise(() => ctx.newPage()),
		(page) => Effect.ignore(fromPromiseVoid(() => page.close())),
	);
}

/**
 * Acquires a pair of browser contexts and closes them when the scope is released.
 *
 * @param acquire Lazily creates the sender/recipient contexts.
 * @return Scoped Effect that yields both contexts.
 */
export function acquireTwoUserContexts<
	TContexts extends { senderCtx: BrowserContext; recipientCtx: BrowserContext },
>(acquire: () => Promise<TContexts>): Effect.Effect<TContexts, Error, Scope.Scope> {
	return Effect.acquireRelease(
		fromPromise(acquire),
		({ senderCtx, recipientCtx }) =>
			Effect.ignore(
				fromPromiseVoid(async () => {
					await senderCtx.close();
					await recipientCtx.close();
				}),
			),
	);
}
