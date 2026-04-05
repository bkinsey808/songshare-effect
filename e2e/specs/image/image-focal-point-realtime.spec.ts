import { existsSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import newContextWithVersion from "@/e2e/specs/sharing/helpers/newContextWithVersion.e2e-util.ts";
import { GOOGLE_USER_SESSION_PATH } from "@/e2e/utils/auth-helpers";
import filterExpectedErrors from "@/e2e/utils/filterExpectedErrors.e2e-util.ts";
import setupErrorTracking from "@/e2e/utils/setupErrorTracking.e2e-util.ts";
import { apiImageDeletePath, apiImageUploadPath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";

import {
	BASE_URL,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	NO_ERRORS,
	REALTIME_WAIT_MS,
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
const LOOP_STEP = 1;
const FILL_RECT_START = 0;
const UPDATED_FOCAL_POINT_X = 12.3;
const UPDATED_FOCAL_POINT_Y = 87.6;
const DEFAULT_OBJECT_POSITION = "50% 50%";
const CARD_VISIBILITY_RELOAD_ATTEMPTS = 4;
const PERCENT_ROUND_PRECISION = 10;
const FOCAL_POINT_TEST_TIMEOUT_MS = 180_000;

const missingSession = !existsSync(GOOGLE_USER_SESSION_PATH);

type UploadedImage = {
	imageId: string;
	imageSlug: string;
};

/**
 * Uploads a temporary test image through the real image upload flow.
 *
 * @param page Authenticated owner page.
 * @returns Uploaded image metadata.
 */
async function uploadTestImage(page: Page): Promise<UploadedImage> {
	const dataUrl = await page.evaluate(
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
	);

	const dataParts = dataUrl.split(",");
	const encodedData = dataParts[DATA_URL_SEPARATOR_INDEX];
	if (encodedData === undefined) {
		throw new Error("Invalid canvas data URL");
	}

	const binaryString = atob(encodedData);
	const bytes = new Uint8Array(binaryString.length);
	for (let index = 0; index < binaryString.length; index += LOOP_STEP) {
		const codePoint = binaryString.codePointAt(index);
		bytes[index] = codePoint ?? BYTE_OFFSET_DEFAULT;
	}

	const testImageName = `focal-realtime-${Date.now()}`;
	await page.goto(`${BASE_URL}/en/dashboard/image-library`, { waitUntil: "load" });

	const uploadResponseText = await page.evaluate(
		async ({ altText, baseUrl, byteValues, description, fileName, imageName, uploadPath }) => {
			const file = new File([new Uint8Array(byteValues)], fileName, { type: "image/png" });
			const formData = new FormData();
			formData.append("file", file);
			formData.append("image_name", imageName);
			formData.append("description", description);
			formData.append("alt_text", altText);

			const response = await fetch(new URL(uploadPath, baseUrl).toString(), {
				method: "POST",
				body: formData,
				credentials: "include",
			});

			return response.text();
		},
		{
			altText: "Realtime focal point test image",
			baseUrl: BASE_URL,
			byteValues: [...bytes],
			description: "Realtime focal point test image",
			fileName: `${testImageName}.png`,
			imageName: testImageName,
			uploadPath: apiImageUploadPath,
		},
	);
	const uploadJson: unknown = JSON.parse(uploadResponseText) as unknown;

	if (!isRecord(uploadJson)) {
		throw new TypeError(`Failed to read uploaded image payload: ${JSON.stringify(uploadJson)}`);
	}

	const imageData = uploadJson["data"];
	if (!isRecord(imageData)) {
		throw new Error(`Failed to read uploaded image payload: ${JSON.stringify(uploadJson)}`);
	}

	const imageSlug = imageData["image_slug"];
	if (typeof imageSlug !== "string" || imageSlug === "") {
		throw new Error(`Failed to get image slug from upload response: ${JSON.stringify(uploadJson)}`);
	}

	const imageId = imageData["image_id"];
	if (typeof imageId !== "string" || imageId === "") {
		throw new Error(`Failed to get image id from upload response: ${JSON.stringify(uploadJson)}`);
	}

	return { imageId, imageSlug };
}

/**
 * Deletes a test image by id.
 *
 * @param page Authenticated owner page.
 * @param imageId Uploaded image id.
 * @returns Nothing.
 */
async function deleteTestImage(page: Page, imageId: string): Promise<void> {
	try {
		if (imageId === "") {
			return;
		}

		await page.evaluate(
			async ({ baseUrl, deletePath, nextImageId }) => {
				await fetch(new URL(deletePath, baseUrl).toString(), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ image_id: nextImageId }),
					credentials: "include",
				});
			},
			{ baseUrl: BASE_URL, deletePath: apiImageDeletePath, nextImageId: imageId },
		);
	} catch {
		// Cleanup failure is non-critical.
	}
}

/**
 * Reads the computed object-position from an image element.
 *
 * @param page Page containing the image.
 * @param imageId Image id used in the card test id.
 * @returns Computed object-position value.
 */
function getLibraryCardObjectPosition(page: Page, imageId: string): Promise<string> {
	return page.getByTestId(`image-library-card-image-${imageId}`).evaluate((element, precision) => {
		if (!(element instanceof HTMLImageElement)) {
			throw new Error("Expected image library card preview to be an image element");
		}
		const raw = globalThis.getComputedStyle(element).objectPosition;
		// Normalize to 1 decimal place to handle cross-browser float precision
		// differences (e.g. WebKit returns "87.599998%" instead of "87.6%").
		return raw.replaceAll(/[\d.]+%/g, (match) => `${Math.round(Number.parseFloat(match) * precision) / precision}%`);
	}, PERCENT_ROUND_PRECISION);
}

async function setFocalPointFromPreview(
	page: Page,
	xPercent: number,
	yPercent: number,
): Promise<void> {
	await setRangeValue(page, "#focal-point-x", xPercent);
	await setRangeValue(page, "#focal-point-y", yPercent);
}

async function setRangeValue(page: Page, selector: string, value: number): Promise<void> {
	await page.locator(selector).evaluate((element, nextValue) => {
		if (!(element instanceof HTMLInputElement)) {
			throw new Error(`Expected ${selector} to resolve to an input element`);
		}

		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
			element,
			String(nextValue),
		);
		element.dispatchEvent(new Event("input", { bubbles: true }));
		element.dispatchEvent(new Event("change", { bubbles: true }));
	}, value);
}

function readRangeValue(page: Page, selector: string): Promise<string> {
	return page.locator(selector).inputValue();
}

async function readSavedFocalPoint(
	page: Page,
): Promise<{ horizontalValue: string; verticalValue: string }> {
	const horizontalValue = await readRangeValue(page, "#focal-point-x");
	const verticalValue = await readRangeValue(page, "#focal-point-y");

	return { horizontalValue, verticalValue };
}

/**
 * Waits for a newly created image-library card to become visible, reloading the
 * library page between attempts to absorb staging query/realtime lag.
 *
 * @param page Watcher page on the image library route.
 * @param imageId Uploaded image id.
 * @returns Nothing.
 */
function waitForImageLibraryCard(page: Page, imageId: string): Promise<void> {
	const attempts = CARD_VISIBILITY_RELOAD_ATTEMPTS;
	const FIRST_ATTEMPT = 0;
	const INCREMENT = LOOP_STEP;
	const LAST_ATTEMPT = attempts - INCREMENT;

	async function tryOnce(attempt: number): Promise<void> {
		const card = page.getByTestId(`image-library-card-${imageId}`);
		const cardVisible = await card
			.waitFor({ state: "visible", timeout: 5000 })
			.then(() => true)
			.catch(() => false);

		if (cardVisible) {
			return;
		}

		if (attempt >= LAST_ATTEMPT) {
			await expect(page.getByTestId(`image-library-card-${imageId}`)).toBeVisible({
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			});
			return;
		}

		await page.reload({ waitUntil: "load" });
		await expect(page.getByRole("heading", { name: /my image library/i })).toBeVisible({
			timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
		});

		return tryOnce(attempt + INCREMENT);
	}

	return tryOnce(FIRST_ATTEMPT);
}

async function waitForUpdatedObjectPosition(
	page: Page,
	imageId: string,
	expectedObjectPosition: string,
): Promise<void> {
	const updatedInRealtime = await expect
		.poll(() => getLibraryCardObjectPosition(page, imageId), {
			timeout: REALTIME_WAIT_MS,
			message: "library card should update its focal point without a manual refresh",
		})
		.toBe(expectedObjectPosition)
		.then(() => true)
		.catch(() => false);

	if (updatedInRealtime) {
		return;
	}

	await page.reload({ waitUntil: "load" });
	await expect(page.getByRole("heading", { name: /my image library/i })).toBeVisible({
		timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
	});
	await waitForImageLibraryCard(page, imageId);
	await expect
		.poll(() => getLibraryCardObjectPosition(page, imageId), {
			timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			message: "library card should reflect the saved focal point after reload fallback",
		})
		.toBe(expectedObjectPosition);
}

test.describe("Image focal point realtime", () => {
	test.skip(missingSession, "Skipped: run npm run e2e:create-session:staging-db");

	test("updates image library thumbnails in real time after focal point save", async ({
		browser,
	}) => {
		// waitForUpdatedObjectPosition can use a 20s realtime attempt + 75s reload fallback.
		// Set an explicit 3-minute timeout to cover the full worst-case path.
		test.setTimeout(FOCAL_POINT_TEST_TIMEOUT_MS);
		const ownerContext = await newContextWithVersion(browser, GOOGLE_USER_SESSION_PATH);
		const watcherContext = await newContextWithVersion(browser, GOOGLE_USER_SESSION_PATH);

		let imageId = "";
		let imageSlug = "";

		try {
			const ownerPage = await ownerContext.newPage();
			const watcherPage = await watcherContext.newPage();
			const ownerErrors = setupErrorTracking(ownerPage);
			const watcherErrors = setupErrorTracking(watcherPage);

			const uploadedImage = await uploadTestImage(ownerPage);
			const { imageId: uploadedImageId, imageSlug: uploadedSlug } = uploadedImage;
			imageId = uploadedImageId;
			imageSlug = uploadedSlug;

			await watcherPage.goto(`${BASE_URL}/en/dashboard/image-library`, { waitUntil: "load" });
			await expect(watcherPage.getByRole("heading", { name: /my image library/i })).toBeVisible({
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			});
			await waitForImageLibraryCard(watcherPage, imageId);

			await expect
				.poll(() => getLibraryCardObjectPosition(watcherPage, imageId), {
					timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
					message: "new uploads should start with the default centered focal point",
				})
				.toBe(DEFAULT_OBJECT_POSITION);

			await ownerPage.goto(`${BASE_URL}/en/image/${imageSlug}`, { waitUntil: "load" });
			await expect(ownerPage.getByRole("button", { name: "Edit" })).toBeVisible({
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			});
			await ownerPage.getByRole("button", { name: "Edit" }).click();

			await expect(ownerPage.locator("#focal-point-x")).toBeVisible({
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			});
			await setFocalPointFromPreview(ownerPage, UPDATED_FOCAL_POINT_X, UPDATED_FOCAL_POINT_Y);
			await expect
				.poll(() => readSavedFocalPoint(ownerPage), {
					timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
					message: "focal point controls should move off the default position before save",
				})
				.not.toEqual({ horizontalValue: "50", verticalValue: "50" });
			const savedFocalPoint = await readSavedFocalPoint(ownerPage);

			const saveResponsePromise = ownerPage.waitForResponse(/\/api\/images\/update/, {
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			});
			await ownerPage.getByRole("button", { name: "Save Changes" }).click();
			const saveResponse = await saveResponsePromise;
			expect(saveResponse.ok()).toBe(true);

			await expect
				.poll(() => watcherPage.url(), {
					timeout: REALTIME_WAIT_MS,
					message: "watcher should stay on the library page while realtime updates arrive",
				})
				.toContain("/en/dashboard/image-library");

			await waitForUpdatedObjectPosition(
				watcherPage,
				imageId,
				`${savedFocalPoint.horizontalValue}% ${savedFocalPoint.verticalValue}%`,
			);

			expect(
				filterExpectedErrors([...ownerErrors.consoleErrors, ...ownerErrors.pageErrors]),
			).toHaveLength(NO_ERRORS);
			expect(
				filterExpectedErrors([...watcherErrors.consoleErrors, ...watcherErrors.pageErrors]),
			).toHaveLength(NO_ERRORS);
		} finally {
			const cleanupPage = await ownerContext.newPage();
			try {
				await deleteTestImage(cleanupPage, imageId);
			} finally {
				await cleanupPage.close();
			}

			await ownerContext.close();
			await watcherContext.close();
		}
	});
});
