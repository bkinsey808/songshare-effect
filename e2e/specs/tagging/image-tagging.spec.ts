import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";
import { Effect } from "effect";

import mutateTagViaApi from "@/e2e/specs/tagging/helpers/mutateTagViaApi.e2e-util.ts";
import {
	addTagInEditUi,
	expectTagInEditUi,
	expectTagNotInEditUi,
	removeTagInEditUi,
} from "@/e2e/specs/tagging/helpers/tag-edit-helpers.ts";
import {
	captureConsole,
	expectTagBadgeHidden,
	expectTagBadgeVisible,
	openViewerPage,
	waitForTagRealtimeReady,
} from "@/e2e/specs/tagging/helpers/tagging-e2e-helpers.ts";
import { extractIdFromPublicRows } from "@/e2e/specs/tagging/helpers/tagging-id-helpers.ts";
import acquireBrowserContext from "@/e2e/utils/acquireBrowserContext.e2e-util.ts";
import acquirePage from "@/e2e/utils/acquirePage.e2e-util.ts";
import acquireTwoUserContexts from "@/e2e/utils/acquireTwoUserContexts.e2e-util.ts";
import clickEffect from "@/e2e/utils/clickEffect.e2e-util.ts";
import expectVisibleEffect from "@/e2e/utils/expectVisibleEffect.e2e-util.ts";
import fillEffect from "@/e2e/utils/fillEffect.e2e-util.ts";
import filterExpectedErrors from "@/e2e/utils/filterExpectedErrors.e2e-util.ts";
import fromPromise from "@/e2e/utils/fromPromise.e2e-util.ts";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";
import runEffect from "@/e2e/utils/runEffect.e2e-util.ts";
import setupErrorTracking from "@/e2e/utils/setupErrorTracking.e2e-util.ts";
import waitForResponseAfter from "@/e2e/utils/waitForResponseAfter.e2e-util.ts";
import waitForResponseAndUrlAfter from "@/e2e/utils/waitForResponseAndUrlAfter.e2e-util.ts";
import { apiImageDeletePath, apiImageUploadPath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";

import createTwoUserContexts from "@/e2e/specs/sharing/helpers/createTwoUserContexts.e2e-util.ts";
import newSenderContext from "@/e2e/specs/sharing/helpers/newSenderContext.e2e-util.ts";
import {
	BASE_URL,
	INVITE_SUCCESS_TIMEOUT_MS,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	NO_ERRORS,
	REALTIME_WAIT_MS,
	missingBothSessions,
} from "../sharing/helpers/sharing-constants.e2e-util.ts";

test.describe.configure({ mode: "serial" });

test.slow();

test.use({
	actionTimeout: 60_000,
	navigationTimeout: 60_000,
});

const CANVAS_SIZE = 100;
const DATA_URL_SEPARATOR_INDEX = 1;
const BYTE_OFFSET_DEFAULT = 0;
const FILL_RECT_START = 0;
const LOOP_STEP = 1;
const LAST_SEGMENT_INDEX = -1;
const TEST_TAG_SLUG = "e2e-cross-user-tag";

/**
 * Uploads a temporary test image and returns its slug.
 *
 * @param ownerPage Owner page authenticated to upload images.
 * @return Effect that resolves with the uploaded image slug.
 */
function uploadTestImage(ownerPage: Page): Effect.Effect<string, Error> {
	return Effect.gen(function* uploadTestImageEffect($) {
		const dataUrl = yield* $(
			fromPromise(() =>
				ownerPage.evaluate(
					({ canvasSize, fillRectStart }) => {
						const canvasEl = document.createElement("canvas");
						canvasEl.width = canvasSize;
						canvasEl.height = canvasSize;
						const ctx = canvasEl.getContext("2d");
						if (ctx !== null) {
							ctx.fillStyle = "#FF0000";
							ctx.fillRect(fillRectStart, fillRectStart, canvasSize, canvasSize);
						}
						return canvasEl.toDataURL("image/png");
					},
					{ canvasSize: CANVAS_SIZE, fillRectStart: FILL_RECT_START },
				),
			),
		);

		const dataParts = dataUrl.split(",");
		const encodedData = dataParts[DATA_URL_SEPARATOR_INDEX];
		if (encodedData === undefined) {
			return yield* $(Effect.fail(new Error("Invalid canvas data URL")));
		}

		const binaryString = atob(encodedData);
		const bytes = new Uint8Array(binaryString.length);
		for (let index = 0; index < binaryString.length; index += LOOP_STEP) {
			const codePoint = binaryString.codePointAt(index);
			bytes[index] = codePoint ?? BYTE_OFFSET_DEFAULT;
		}

		const tempFile = join(tmpdir(), `test-image-${Date.now()}.png`);
		writeFileSync(tempFile, Buffer.from(bytes));

		yield* $(fromPromiseVoid(() => ownerPage.goto(`${BASE_URL}/en/dashboard/image-upload`, { waitUntil: "load" })));

		const testImageName = `test-image-${Date.now()}`;
		yield* $(fillEffect(ownerPage.getByLabel("Image Name"), testImageName));
		yield* $(fillEffect(ownerPage.getByLabel("Description"), "Test image for E2E tagging tests"));
		yield* $(fillEffect(ownerPage.getByLabel("Alt Text"), "Test image"));
		yield* $(fromPromiseVoid(() => ownerPage.locator('input[type="file"]').setInputFiles(tempFile)));

		const uploadResponse = yield* $(
			waitForResponseAfter({
				page: ownerPage,
				responseMatcher: apiImageUploadPath,
				action: () => ownerPage.getByRole("button", { name: "Upload" }).click(),
				options: { timeout: INVITE_SUCCESS_TIMEOUT_MS },
			}),
		);
		const uploadJson: unknown = yield* $(fromPromise(() => uploadResponse.json()));
		if (!isRecord(uploadJson)) {
			return yield* $(
				Effect.fail(new TypeError(`Failed to read uploaded image payload: ${JSON.stringify(uploadJson)}`)),
			);
		}

		const uploadData = uploadJson;
		const imageData = uploadData["data"];
		if (!isRecord(imageData)) {
			return yield* $(
				Effect.fail(new Error(`Failed to read uploaded image payload: ${JSON.stringify(uploadData)}`)),
			);
		}

		const imageSlug = imageData["image_slug"];
		if (typeof imageSlug !== "string" || imageSlug === "") {
			return yield* $(
				Effect.fail(
					new Error(`Failed to get image slug from upload response: ${JSON.stringify(uploadData)}`),
				),
			);
		}

		return imageSlug;
	});
}

/**
 * Best-effort cleanup helper that deletes a test image by slug-derived id.
 *
 * @param ownerPage Owner page authenticated to delete images.
 * @param imageSlug Uploaded test image slug.
 * @return Effect that resolves when cleanup attempt completes.
 */
function deleteTestImage(ownerPage: Page, imageSlug: string): Effect.Effect<void, Error> {
	return Effect.gen(function* deleteTestImageEffect($) {
		try {
			const imageId = imageSlug.split("-").at(LAST_SEGMENT_INDEX);
			if (imageId === undefined || imageId === "") {
				return;
			}

			yield* $(
				fromPromiseVoid(() =>
					ownerPage.request.post(new URL(apiImageDeletePath, BASE_URL).toString(), {
						data: { image_id: imageId },
					}),
				),
			);
		} catch {
			// Cleanup failure is non-critical.
		}
	});
}

/**
 * Opens the owner image page and navigates to edit mode.
 *
 * Returns the resolved image id used by tag APIs.
 *
 * @param ownerPage Owner page authenticated to edit images.
 * @param imageSlug Image slug to open and edit.
 * @return Effect that resolves with the target image id.
 */
function navigateToImageEditPage(ownerPage: Page, imageSlug: string): Effect.Effect<string, Error> {
	return Effect.gen(function* navigateToImageEditPageEffect($) {
		const imageEditResponse = yield* $(
			waitForResponseAfter({
				page: ownerPage,
				responseMatcher: (response) =>
					response.url().includes("/image_public") &&
					response.url().includes(imageSlug) &&
					response.request().method() === "GET",
				action: () => ownerPage.goto(`${BASE_URL}/en/image/${imageSlug}`, { waitUntil: "load" }),
				options: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
			}),
		);

		const editButton = ownerPage.getByRole("button", { name: "Edit" });
		yield* $(expectVisibleEffect(editButton, { timeout: MANAGE_PAGE_READY_TIMEOUT_MS }));
		yield* $(clickEffect(editButton));

		yield* $(
			expectVisibleEffect(ownerPage.getByPlaceholder("Add tags\u2026"), {
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);

		const imageRows: unknown = yield* $(fromPromise(() => imageEditResponse.json()));
		const imageId = extractIdFromPublicRows(imageRows, "image_id");
		if (typeof imageId !== "string" || imageId === "") {
			return yield* $(Effect.fail(new Error(`Could not determine image id for slug: ${imageSlug}`)));
		}

		return imageId;
	});
}


/**
 * Adds the test tag through the edit UI and saves the image.
 *
 * @param ownerPage Owner page currently on the image edit screen.
 * @param imageSlug Image slug used to verify return navigation.
 * @return Effect that resolves after save succeeds and navigation completes.
 */
function addTagAndSaveViaUi(ownerPage: Page, imageSlug: string): Effect.Effect<void, Error> {
	return Effect.gen(function* addImageTagAndSaveViaUiEffect($) {
		yield* $(
			addTagInEditUi({
				page: ownerPage,
				tagSlug: TEST_TAG_SLUG,
				timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);

		const saveResponse = yield* $(
			waitForResponseAndUrlAfter({
				page: ownerPage,
				responseMatcher: /\/api\/images\/update/,
				urlMatcher: new RegExp(`/en/image/${imageSlug}$`),
				action: () => ownerPage.getByRole("button", { name: "Save Changes" }).click(),
				responseOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
				urlOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
			}),
		);
		expect(saveResponse.ok()).toBe(true);
	});
}

/**
 * Removes the test tag through the edit UI and saves the image.
 *
 * @param ownerPage Owner page currently on the image edit screen.
 * @param imageSlug Image slug used to verify return navigation.
 * @return Effect that resolves after save succeeds and navigation completes.
 */
function removeTagAndSaveViaUi(ownerPage: Page, imageSlug: string): Effect.Effect<void, Error> {
	return Effect.gen(function* removeImageTagAndSaveViaUiEffect($) {
		yield* $(
			removeTagInEditUi({
				page: ownerPage,
				tagSlug: TEST_TAG_SLUG,
				timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);

		const saveResponse = yield* $(
			waitForResponseAndUrlAfter({
				page: ownerPage,
				responseMatcher: /\/api\/images\/update/,
				urlMatcher: new RegExp(`/en/image/${imageSlug}$`),
				action: () => ownerPage.getByRole("button", { name: "Save Changes" }).click(),
				responseOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
				urlOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
			}),
		);
		expect(saveResponse.ok()).toBe(true);
	});
}

/**
 * Waits until the viewer has a ready image tag realtime subscription.
 *
 * @param viewerPage Viewer page on the image details route.
 * @param viewerConsole Captured console lines from the viewer page.
 * @return Effect that resolves when realtime subscription readiness is observed.
 */
function waitForImageTagRealtimeReady(
	viewerPage: Page,
	viewerConsole: readonly string[],
): Effect.Effect<void, Error> {
	return waitForTagRealtimeReady({
		page: viewerPage,
		viewerConsole,
		channelLabel: "image_tag",
		timeoutMs: REALTIME_WAIT_MS,
		headingTimeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
	});
}

test.describe("Image Tagging: Real-Time Cross-User Visibility", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");

	let imageSlugForTest = "";

	test.beforeEach(async ({ browser }) => {
		await runEffect(
			Effect.scoped(
				Effect.gen(function* imageBeforeEachEffect($) {
					const ownerCtx = yield* $(acquireBrowserContext(() => newSenderContext(browser)));
					const ownerPage = yield* $(acquirePage(ownerCtx));
					imageSlugForTest = yield* $(uploadTestImage(ownerPage));
				}),
			),
		);
	});

	test.afterEach(async ({ browser }) => {
		if (imageSlugForTest === "") {
			return;
		}

		await runEffect(
			Effect.scoped(
				Effect.gen(function* imageAfterEachEffect($) {
					const ownerCtx = yield* $(acquireBrowserContext(() => newSenderContext(browser)));
					const ownerPage = yield* $(acquirePage(ownerCtx));
					yield* $(deleteTestImage(ownerPage, imageSlugForTest));
				}),
			),
		);
	});

	test("tags appear and disappear on the viewer's open image page without refresh", async ({
		browser,
	}) => {
		await runEffect(
			Effect.scoped(
				Effect.gen(function* imageRealtimeEffect($) {
					const contexts = yield* $(acquireTwoUserContexts(() => createTwoUserContexts(browser)));
					const ownerPage = yield* $(acquirePage(contexts.senderCtx));
					const viewerPage = yield* $(acquirePage(contexts.recipientCtx));
					const errors = setupErrorTracking(viewerPage);

					const viewerConsole = captureConsole(viewerPage);

					yield* $(
						openViewerPage({
							page: viewerPage,
							url: `${BASE_URL}/en/image/${imageSlugForTest}`,
							timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
						}),
					);
					yield* $(waitForImageTagRealtimeReady(viewerPage, viewerConsole));

					const imageId = yield* $(navigateToImageEditPage(ownerPage, imageSlugForTest));
					yield* $(
						mutateTagViaApi({
							page: ownerPage,
							itemId: imageId,
							itemType: "image",
							tagSlug: TEST_TAG_SLUG,
							action: "add",
						}),
					);

					yield* $(expectTagBadgeVisible(viewerPage, TEST_TAG_SLUG, REALTIME_WAIT_MS));

					yield* $(
						mutateTagViaApi({
							page: ownerPage,
							itemId: imageId,
							itemType: "image",
							tagSlug: TEST_TAG_SLUG,
							action: "remove",
						}),
					);

					yield* $(expectTagBadgeHidden(viewerPage, TEST_TAG_SLUG, REALTIME_WAIT_MS));

					const unexpectedErrors = filterExpectedErrors(errors.consoleErrors);
					expect(unexpectedErrors).toHaveLength(NO_ERRORS);
				}),
			),
		);
	});

	test("owner can add and remove a tag in the image edit UI and the change persists", async ({
		browser,
	}) => {
		await runEffect(
			Effect.scoped(
				Effect.gen(function* imageUiEffect($) {
					const ownerCtx = yield* $(acquireBrowserContext(() => newSenderContext(browser)));
					const ownerPage = yield* $(acquirePage(ownerCtx));
					yield* $(navigateToImageEditPage(ownerPage, imageSlugForTest));
					yield* $(addTagAndSaveViaUi(ownerPage, imageSlugForTest));

					yield* $(navigateToImageEditPage(ownerPage, imageSlugForTest));
					yield* $(
						expectTagInEditUi({
							page: ownerPage,
							tagSlug: TEST_TAG_SLUG,
							timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
						}),
					);

					yield* $(removeTagAndSaveViaUi(ownerPage, imageSlugForTest));

					yield* $(navigateToImageEditPage(ownerPage, imageSlugForTest));
					yield* $(
						expectTagNotInEditUi({
							page: ownerPage,
							tagSlug: TEST_TAG_SLUG,
							timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
						}),
					);
				}),
			),
		);
	});
});
