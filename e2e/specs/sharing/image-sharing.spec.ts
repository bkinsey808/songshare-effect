import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import clearAllPendingPeerShares from "@/e2e/specs/sharing/helpers/clearAllPendingPeerShares.e2e-util.ts";
import createTwoUserContexts from "@/e2e/specs/sharing/helpers/createTwoUserContexts.e2e-util.ts";
import newRecipientContext from "@/e2e/specs/sharing/helpers/newRecipientContext.e2e-util.ts";
import newSenderContext from "@/e2e/specs/sharing/helpers/newSenderContext.e2e-util.ts";
import openReceivedPendingShares from "@/e2e/specs/sharing/helpers/openReceivedPendingShares.e2e-util.ts";
import selectUserInSearch from "@/e2e/specs/sharing/helpers/selectUserInSearch.e2e-util.ts";
import filterExpectedErrors from "@/e2e/utils/filterExpectedErrors.e2e-util.ts";
import setupErrorTracking from "@/e2e/utils/setupErrorTracking.e2e-util.ts";

import {
	BASE_URL,
	INVITE_SUCCESS_TIMEOUT_MS,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	NO_ERRORS,
	REALTIME_WAIT_MS,
	SHARE_CREATE_TIMEOUT_MS,
	missingBothSessions,
	missingUser2Username,
	testUser2Username,
} from "./helpers/sharing-constants.e2e-util.ts";

// These tests use real shared accounts on staging/local DB and MUST NOT run in parallel
// across multiple workers. Even with 'serial' mode, different browser projects
// will collide. RUN WITH: --workers=1
test.describe.configure({ mode: "serial" });

test.slow();

test.use({
	actionTimeout: 60_000,
	navigationTimeout: 60_000,
});

// ── Image Upload and Delete Helpers ────────────────────────────────────────────

const CANVAS_SIZE = 100;
const DATA_URL_SEPARATOR_INDEX = 1;
const BYTE_OFFSET_DEFAULT = 0;

type UploadedImage = Readonly<{
	imageId: string;
	imageSlug: string;
}>;

/**
 * Creates a test image and uploads it via the image upload page.
 * Returns the slug of the created image for use in subsequent tests.
 *
 * @param userPage - Authenticated page context of the user uploading
 * @returns Slug of the uploaded image
 */
async function uploadTestImage(userPage: Page): Promise<UploadedImage> {
	// Create a test image using canvas and convert to PNG data URL
	const dataUrl = await userPage.evaluate(
		({ canvasSize }) => {
			const canvasEl = document.createElement("canvas");
			canvasEl.width = canvasSize;
			canvasEl.height = canvasSize;
			const ctx = canvasEl.getContext("2d");
			if (ctx) {
				ctx.fillStyle = "#FF0000";
				/* oxlint-disable-next-line no-magic-numbers */
				ctx.fillRect(0, 0, canvasSize, canvasSize);
			}
			return canvasEl.toDataURL("image/png");
		},
		{ canvasSize: CANVAS_SIZE },
	);

	// Convert data URL to Buffer and write to temp file
	const dataParts = dataUrl.split(",");
	const encodedData = dataParts[DATA_URL_SEPARATOR_INDEX];
	if (encodedData === undefined) {
		throw new Error("Invalid canvas data URL");
	}
	const binaryString = atob(encodedData);
	const bytes = new Uint8Array(binaryString.length);
	/* oxlint-disable-next-line no-magic-numbers */
	for (let i = 0; i < binaryString.length; i += 1) {
		const codePoint = binaryString.codePointAt(i);
		bytes[i] = codePoint ?? BYTE_OFFSET_DEFAULT;
	}
	const tempFile = join(tmpdir(), `test-image-${Date.now()}.png`);
	writeFileSync(tempFile, Buffer.from(bytes));

	// Navigate to the image upload page
	await userPage.goto(`${BASE_URL}/en/dashboard/image-upload`, { waitUntil: "load" });

	// Fill in the image name
	const testImageName = `test-image-${Date.now()}`;
	await userPage.getByLabel("Image Name").fill(testImageName);

	// Fill in the description
	await userPage.getByLabel("Description").fill("Test image for E2E sharing tests");

	// Fill in alt text
	await userPage.getByLabel("Alt Text").fill("Test image");

	// Set the file input using Playwright's setInputFiles method
	const fileInput = userPage.locator('input[type="file"]');
	await fileInput.setInputFiles(tempFile);

	// Submit the form
	const uploadBtn = userPage.getByRole("button", { name: "Upload" });
	const uploadResponse = userPage.waitForResponse(/\/api\/images\/upload/, {
		timeout: INVITE_SUCCESS_TIMEOUT_MS,
	});
	await uploadBtn.click();
	const uploadResp = await uploadResponse;

	// Parse response to get slug
	/* oxlint-disable no-unsafe-type-assertion */
	const uploadData = (await uploadResp.json()) as Record<string, unknown>;
	// The API returns the image data nested under `data` key: { success: true, data: { image_slug, ... } }
	const imageData = uploadData["data"] as Record<string, unknown> | undefined;
	const imageSlug = imageData?.["image_slug"] as string | undefined;
	const imageId = imageData?.["image_id"] as string | undefined;
	/* oxlint-enable no-unsafe-type-assertion */
	if (imageSlug === undefined || imageSlug === "") {
		throw new Error(
			`Failed to get image slug from upload response. Status: ${uploadResp.status()}, Data: ${JSON.stringify(uploadData)}`,
		);
	}
	if (imageId === undefined || imageId === "") {
		throw new Error(
			`Failed to get image id from upload response. Status: ${uploadResp.status()}, Data: ${JSON.stringify(uploadData)}`,
		);
	}

	return { imageId, imageSlug };
}

/**
 * Deletes a test image by making a direct API call.
 *
 * Note: We use the API directly instead of navigating to the page and clicking
 * because of occasional timing issues with loading image data in fresh contexts.
 *
 * This function catches deletion errors and logs them rather than failing the test,
 * since deletion is a cleanup operation and failure shouldn't cause test failure.
 *
 * @param userPage - Authenticated page context of the image owner
 * @param imageSlug - Slug of the image to delete (image ID can be extracted from slug)
 */
async function deleteTestImage(userPage: Page, imageId: string): Promise<void> {
	try {
		if (imageId === "") {
			return;
		}

		// Make a POST request to delete the image via API
		await userPage.request.post(new URL("/api/images/delete", BASE_URL).toString(), {
			data: { image_id: imageId },
		});
	} catch {
		// Cleanup failure is non-critical; swallow silently.
	}
}

// ── P2P Image Share ─────────────────────────────────────────────────────────────

test.describe("P2P Image Share", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingUser2Username, "Skipped: set E2E_TEST_USER2_USERNAME");

	let imageForTest: UploadedImage = { imageId: "", imageSlug: "" };

	test.beforeEach(async ({ browser }) => {
		// Create a fresh test image owned by the sender (user1)
		const senderCtx = await newSenderContext(browser);
		const senderPage = await senderCtx.newPage();
		try {
			imageForTest = await uploadTestImage(senderPage);
		} finally {
			await senderCtx.close();
		}

		// Clear pending shares for the recipient
		const recipientCtx = await newRecipientContext(browser);
		const recipientPage = await recipientCtx.newPage();
		try {
			await clearAllPendingPeerShares(recipientPage);
		} finally {
			await recipientCtx.close();
		}
	});

	test.afterEach(async ({ browser }) => {
		// Clean up: delete the test image
		if (imageForTest.imageId !== "") {
			const senderCtx = await newSenderContext(browser);
			const senderPage = await senderCtx.newPage();
			try {
				await deleteTestImage(senderPage, imageForTest.imageId);
			} finally {
				await senderCtx.close();
			}
		}
	});

	test("sender shares an image and recipient accepts it", async ({ browser }) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const senderPage = await senderCtx.newPage();
			const recipientPage = await recipientCtx.newPage();
			const senderErrors = setupErrorTracking(senderPage);
			const errors = setupErrorTracking(recipientPage);

			// Sender: open the image page and share it
			await senderPage.goto(`${BASE_URL}/en/image/${imageForTest.imageSlug}`, {
				waitUntil: "load",
			});
			const shareBtn = senderPage.getByRole("button", { name: "Share" }).first();
			await expect(shareBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
			const imageAcceptShareP = senderPage.waitForResponse(/\/api\/shares\/create/, {
				timeout: SHARE_CREATE_TIMEOUT_MS,
			});
			await shareBtn.click();
			await selectUserInSearch(senderPage, "Share with user", testUser2Username);
			// Confirm the share was persisted before checking the recipient side.
			const imageAcceptShareResponse = await imageAcceptShareP;
			expect(imageAcceptShareResponse.ok()).toBe(true);

			// Recipient: navigate to dashboard and accept the share
			await openReceivedPendingShares(recipientPage);
			const acceptButton = recipientPage
				.getByRole("button", { name: "Accept", exact: true })
				.first();
			await expect(acceptButton).toBeVisible({ timeout: REALTIME_WAIT_MS });
			const pendingRow = acceptButton.locator(
				"xpath=ancestor::div[.//button[normalize-space()='Accept'] and (.//a or .//span[contains(@class,'font-medium')])][1]",
			);
			const sharedItemNameLocator = pendingRow.locator("a.font-medium, p.font-medium").first();
			await expect(sharedItemNameLocator).toBeVisible({ timeout: REALTIME_WAIT_MS });
			const sharedItemNameRaw = await sharedItemNameLocator.textContent();
			const sharedItemName = sharedItemNameRaw?.trim();
			expect(sharedItemName).not.toBeUndefined();
			expect(sharedItemName).not.toBeNull();
			expect(sharedItemName).not.toBe("");
			const sharedItemNameText = String(sharedItemName);
			const imageAcceptP = recipientPage.waitForResponse(/\/api\/shares\/update-status/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await acceptButton.click();
			const imageAcceptResponse = await imageAcceptP;
			expect(imageAcceptResponse.ok()).toBe(true);
			await recipientPage.reload({ waitUntil: "load" });
			await openReceivedPendingShares(recipientPage);

			// Accepted item should no longer present an Accept action in pending view.
			const pendingAcceptForItem = recipientPage
				.locator("div")
				.filter({ hasText: sharedItemNameText })
				.getByRole("button", { name: "Accept", exact: true })
				.first();
			await expect(pendingAcceptForItem).not.toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});

			const unexpectedSenderErrors = filterExpectedErrors(senderErrors.consoleErrors);
			const unexpectedErrors = filterExpectedErrors(errors.consoleErrors);
			expect(unexpectedSenderErrors).toHaveLength(NO_ERRORS);
			expect(unexpectedErrors).toHaveLength(NO_ERRORS);
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});

	test("sender shares an image and recipient declines it", async ({ browser }) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const senderPage = await senderCtx.newPage();
			const recipientPage = await recipientCtx.newPage();
			const senderErrors = setupErrorTracking(senderPage);

			// Sender: share the image
			await senderPage.goto(`${BASE_URL}/en/image/${imageForTest.imageSlug}`, {
				waitUntil: "load",
			});
			const shareBtn = senderPage.getByRole("button", { name: "Share" }).first();
			await expect(shareBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
			const imageDeclineShareP = senderPage.waitForResponse(/\/api\/shares\/create/, {
				timeout: SHARE_CREATE_TIMEOUT_MS,
			});
			await shareBtn.click();
			await selectUserInSearch(senderPage, "Share with user", testUser2Username);
			const imageDeclineShareResponse = await imageDeclineShareP;
			expect(imageDeclineShareResponse.ok()).toBe(true);

			// Recipient: decline the share
			await openReceivedPendingShares(recipientPage);
			const declineButton = recipientPage
				.getByRole("button", { name: "Decline", exact: true })
				.first();
			await expect(declineButton).toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
			const pendingRow = declineButton.locator(
				"xpath=ancestor::div[.//button[normalize-space()='Decline'] and (.//a or .//span[contains(@class,'font-medium')])][1]",
			);
			const sharedItemNameLocator = pendingRow.locator("a.font-medium, p.font-medium").first();
			await expect(sharedItemNameLocator).toBeVisible({ timeout: REALTIME_WAIT_MS });
			const sharedItemNameRaw = await sharedItemNameLocator.textContent();
			const sharedItemName = sharedItemNameRaw?.trim();
			expect(sharedItemName).not.toBeUndefined();
			expect(sharedItemName).not.toBeNull();
			expect(sharedItemName).not.toBe("");
			const sharedItemNameText = String(sharedItemName);
			const imageDeclineP = recipientPage.waitForResponse(/\/api\/shares\/update-status/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await declineButton.click();
			const imageDeclineResponse = await imageDeclineP;
			expect(imageDeclineResponse.ok()).toBe(true);
			await recipientPage.reload({ waitUntil: "load" });
			await openReceivedPendingShares(recipientPage);

			const pendingDeclineForItem = recipientPage
				.locator("div")
				.filter({ hasText: sharedItemNameText })
				.getByRole("button", { name: "Decline", exact: true })
				.first();
			await expect(pendingDeclineForItem).not.toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});

			const unexpectedSenderErrors = filterExpectedErrors(senderErrors.consoleErrors);
			expect(unexpectedSenderErrors).toHaveLength(NO_ERRORS);
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});

	test("sender shares an image, recipient accepts it, then removes it from library", async ({
		browser,
	}) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const senderPage = await senderCtx.newPage();
			const recipientPage = await recipientCtx.newPage();
			const senderErrors = setupErrorTracking(senderPage);
			const errors = setupErrorTracking(recipientPage);

			// Sender: open the image page and share it
			await senderPage.goto(`${BASE_URL}/en/image/${imageForTest.imageSlug}`, {
				waitUntil: "load",
			});
			const shareBtn = senderPage.getByRole("button", { name: "Share" }).first();
			await expect(shareBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
			const imageShareP = senderPage.waitForResponse(/\/api\/shares\/create/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await shareBtn.click();
			await selectUserInSearch(senderPage, "Share with user", testUser2Username);
			const imageShareResponse = await imageShareP;
			expect(imageShareResponse.ok()).toBe(true);

			// Recipient: accept the share from the dashboard
			await openReceivedPendingShares(recipientPage);
			const acceptButton = recipientPage
				.getByRole("button", { name: "Accept", exact: true })
				.first();
			await expect(acceptButton).toBeVisible({ timeout: REALTIME_WAIT_MS });
			const imageAcceptP = recipientPage.waitForResponse(/\/api\/shares\/update-status/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await acceptButton.click();
			const imageAcceptResponse = await imageAcceptP;
			const imageAcceptBody = await imageAcceptResponse.text().catch(() => "(unreadable)");
			expect(
				imageAcceptResponse.ok(),
				`Share accept API error — status ${String(imageAcceptResponse.status())}: ${imageAcceptBody}`,
			).toBe(true);
			// The app uses optimistic updates: clicking Accept immediately removes the
			// item from the pending list in the UI. Verify it is gone on the current
			// page rather than reloading, which avoids a staging DB propagation race
			// where shares/list can briefly return a stale "pending" status.
			await expect(acceptButton).not.toBeVisible({ timeout: REALTIME_WAIT_MS });

			// Recipient: navigate to the image page and remove it from library
			await recipientPage.goto(`${BASE_URL}/en/image/${imageForTest.imageSlug}`, {
				waitUntil: "load",
			});
			const imageRemoveP = recipientPage.waitForResponse(/\/api\/image-library\/remove/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await expect(recipientPage.getByRole("button", { name: "Remove from library" })).toBeVisible({
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			});
			await recipientPage.getByRole("button", { name: "Remove from library" }).click();
			const imageRemoveResponse = await imageRemoveP;
			const imageRemoveBody = await imageRemoveResponse.text().catch(() => "(unreadable)");
			expect(
				imageRemoveResponse.ok(),
				`Image library remove API error — status ${String(imageRemoveResponse.status())}: ${imageRemoveBody}`,
			).toBe(true);

			// "Remove from library" button should be replaced by "Add to library"
			await expect(recipientPage.getByRole("button", { name: "Add to library" })).toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});

			const unexpectedSenderErrors = filterExpectedErrors(senderErrors.consoleErrors);
			const unexpectedErrors = filterExpectedErrors(errors.consoleErrors);
			expect(unexpectedSenderErrors).toHaveLength(NO_ERRORS);
			expect(unexpectedErrors).toHaveLength(NO_ERRORS);
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});
});
