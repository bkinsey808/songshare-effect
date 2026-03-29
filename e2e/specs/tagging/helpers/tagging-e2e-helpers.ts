import { expect, type Locator, type Page } from "@playwright/test";
import { Effect } from "effect";

import expectEffect from "@/e2e/utils/expectEffect.e2e-util.ts";
import expectHiddenEffect from "@/e2e/utils/expectHiddenEffect.e2e-util.ts";
import expectVisibleEffect from "@/e2e/utils/expectVisibleEffect.e2e-util.ts";

type TagRealtimeReadyOptions = {
	page: Page;
	viewerConsole: readonly string[];
	channelLabel: string;
	timeoutMs: number;
	headingTimeoutMs: number;
};

const GOTO_OPTIONS_INDEX = 1;
type GotoOptions = NonNullable<Parameters<Page["goto"]>[typeof GOTO_OPTIONS_INDEX]>;
type OpenViewerPageOptions = {
	page: Page;
	url: string;
	timeoutMs: number;
	waitUntil?: GotoOptions["waitUntil"];
};

const DEFAULT_WAIT_UNTIL: NonNullable<OpenViewerPageOptions["waitUntil"]> = "load";

/**
 * Captures console messages from a page in a simple string array.
 *
 * @param page Page to attach the console listener to.
 * @return Array that is appended to as console events fire.
 */
export function captureConsole(page: Page): string[] {
	const entries: string[] = [];
	page.on("console", (msg) => {
		entries.push(`[${msg.type()}] ${msg.text()}`);
	});
	return entries;
}

/**
 * Returns the tag badge locator for a given tag slug.
 *
 * @param page Page that renders the tag badge.
 * @param tagSlug Tag slug rendered in the aria-label.
 * @return Locator for the tag badge.
 */
export function tagBadgeLocator(page: Page, tagSlug: string): Locator {
	return page.getByLabel(`View tag ${tagSlug}`);
}

/**
 * Asserts that a tag badge is visible on a viewer page.
 *
 * @param page Viewer page that renders the tag badge.
 * @param tagSlug Tag slug rendered in the aria-label.
 * @param timeoutMs Optional timeout override.
 * @return Effect that resolves once the badge is visible.
 */
export function expectTagBadgeVisible(
	page: Page,
	tagSlug: string,
	timeoutMs?: number,
): Effect.Effect<void, Error> {
	const options = timeoutMs === undefined ? undefined : { timeout: timeoutMs };
	return expectVisibleEffect(tagBadgeLocator(page, tagSlug), options);
}

/**
 * Asserts that a tag badge is hidden on a viewer page.
 *
 * @param page Viewer page that renders the tag badge.
 * @param tagSlug Tag slug rendered in the aria-label.
 * @param timeoutMs Optional timeout override.
 * @return Effect that resolves once the badge is hidden.
 */
export function expectTagBadgeHidden(
	page: Page,
	tagSlug: string,
	timeoutMs?: number,
): Effect.Effect<void, Error> {
	const options = timeoutMs === undefined ? undefined : { timeout: timeoutMs };
	return expectHiddenEffect(tagBadgeLocator(page, tagSlug), options);
}

/**
 * Waits until the realtime subscription for the tag channel is ready.
 *
 * @param options Parameters for the realtime readiness check.
 * @return Effect that resolves when the subscription readiness is observed.
 */
export function waitForTagRealtimeReady(
	options: TagRealtimeReadyOptions,
): Effect.Effect<void, Error> {
	return Effect.gen(function* waitForTagRealtimeReadyEffect($) {
		yield* $(
			expectEffect(() =>
				expect
					.poll(
						() =>
							options.viewerConsole.some(
								(entry) =>
									entry.includes(
										`[${options.channelLabel}] Subscription status changed: status=SUBSCRIBED`,
									) || entry.includes(`[${options.channelLabel}] event received:`),
							),
						{
							timeout: options.timeoutMs,
							message: `viewer ${options.channelLabel} realtime subscription should be ready before mutating tags`,
						},
					)
					.toBe(true),
			),
		);

		yield* $(
			expectVisibleEffect(options.page.getByRole("heading").first(), {
				timeout: options.headingTimeoutMs,
			}),
		);
	});
}

/**
 * Opens a viewer page and waits for the primary heading to be visible.
 *
 * @param options Navigation and timeout options.
 * @return Effect that resolves once the page is loaded and ready.
 */
export function openViewerPage(
	options: OpenViewerPageOptions,
): Effect.Effect<void, Error> {
	return Effect.gen(function* openViewerPageEffect($) {
		const waitUntil = options.waitUntil ?? DEFAULT_WAIT_UNTIL;
		yield* $(Effect.tryPromise({
			try: () => options.page.goto(options.url, { waitUntil }),
			catch: (error) => (error instanceof Error ? error : new Error(String(error))),
		}));
		yield* $(
			expectVisibleEffect(options.page.getByRole("heading").first(), {
				timeout: options.timeoutMs,
			}),
		);
	});
}
