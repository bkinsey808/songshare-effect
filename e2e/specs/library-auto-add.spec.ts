import { Buffer } from "node:buffer";
import { existsSync } from "node:fs";

import { expect, test, type APIResponse, type Page } from "@playwright/test";
import { Effect } from "effect";

import {
	BASE_URL,
	MANAGE_PAGE_READY_TIMEOUT_MS,
} from "@/e2e/specs/sharing/helpers/sharing-constants.e2e-util.ts";
import { GOOGLE_USER_SESSION_PATH } from "@/e2e/utils/auth-helpers";
import fromPromise from "@/e2e/utils/fromPromise.e2e-util.ts";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";
import runEffect from "@/e2e/utils/runEffect.e2e-util.ts";
import {
	apiCommunitySavePath,
	apiEventSavePath,
	apiImageUploadPath,
	apiPlaylistSavePath,
	apiSongsSavePath,
	apiTagAddToItemPath,
} from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";

const missingSession = !existsSync(GOOGLE_USER_SESSION_PATH);

const PNG_PIXEL_BASE64 =
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z7h8AAAAASUVORK5CYII=";
const RADIX_BASE36 = 36;
const RANDOM_SLICE_START = 2;
const RANDOM_SLICE_END = 10;

/**
 * Creates a lowercase slug-safe suffix for this test run.
 *
 * @returns Unique suffix safe for slugs and names.
 */
function makeUniqueSuffix(): string {
	return `${Date.now()}-${Math.random().toString(RADIX_BASE36).slice(RANDOM_SLICE_START, RANDOM_SLICE_END)}`;
}

/**
 * Sends a JSON POST request and returns parsed response JSON.
 *
 * @param page Authenticated test page.
 * @param apiPath API endpoint path.
 * @param payload JSON payload.
 * @returns Parsed JSON body.
 */
function postJson(
	page: Page,
	apiPath: string,
	payload: Record<string, unknown>,
): Effect.Effect<unknown, Error> {
	return Effect.gen(function* postJsonEffect($) {
		const response = yield* $(
			fromPromise(() =>
				page.request.post(new URL(apiPath, BASE_URL).toString(), {
					data: payload,
				}),
			),
		);
		yield* $(assertOkResponse(response, apiPath));
		const responseText = yield* $(fromPromise(() => response.text()));
		return yield* $(
			Effect.try({
				try: () => {
					const parsed = JSON.parse(responseText) as unknown;
					if (isRecord(parsed) && parsed["success"] === false) {
						throw new Error(`${apiPath} returned success=false: ${responseText}`);
					}
					return parsed;
				},
				catch: (error) =>
					error instanceof Error
						? error
						: new Error(`Failed to parse JSON response from ${apiPath}`),
			}),
		);
	});
}

/**
 * Asserts an HTTP response succeeded.
 *
 * @param response API response.
 * @param label Human-readable request label.
 * @returns Effect that fails when status is not ok.
 */
function assertOkResponse(response: APIResponse, label: string): Effect.Effect<void, Error> {
	return Effect.gen(function* assertOkResponseEffect($) {
		if (response.ok()) {
			return;
		}
		const bodyText = yield* $(fromPromise(() => response.text()));
		return yield* $(
			Effect.fail(
				new Error(`${label} failed with status ${String(response.status())}: ${bodyText}`),
			),
		);
	});
}

/**
 * Extracts a nested record from API JSON payloads.
 *
 * @param payload Unknown API JSON payload.
 * @returns A record from either payload.data or payload itself.
 */
function extractDataRecord(payload: unknown): Record<string, unknown> {
	if (!isRecord(payload)) {
		throw new TypeError(`Expected object payload but got: ${JSON.stringify(payload)}`);
	}

	const maybeData = payload["data"];
	if (isRecord(maybeData)) {
		return maybeData;
	}

	return payload;
}

/**
 * Asserts that a library page shows text for a newly created item.
 *
 * @param page Authenticated test page.
 * @param libraryPath Dashboard library path under /en/dashboard.
 * @param visibleText Text expected to be visible in the library list.
 * @returns Effect that resolves once item is visible.
 */
function expectItemInLibrary(
	page: Page,
	libraryPath: string,
	visibleText: string,
): Effect.Effect<void, Error> {
	return Effect.gen(function* expectItemInLibraryEffect($) {
		yield* $(
			fromPromiseVoid(() =>
				page.goto(`${BASE_URL}/en/dashboard/${libraryPath}`, {
					waitUntil: "load",
				}),
			),
		);

		yield* $(
			fromPromiseVoid(() =>
				expect(page.getByText(visibleText, { exact: false })).toBeVisible({
					timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
				}),
			),
		);
	});
}

/**
 * Creates a song via API and returns song id.
 *
 * @param page Authenticated test page.
 * @param songName Song name.
 * @param songSlug Song slug.
 * @returns Created song id.
 */
function createSong(page: Page, songName: string, songSlug: string): Effect.Effect<string, Error> {
	return Effect.gen(function* createSongEffect($) {
		const payload = {
			song_name: songName,
			song_slug: songSlug,
			fields: ["lyrics"],
			slide_order: ["verse-1"],
			slides: {
				"verse-1": {
					slide_name: "Verse 1",
					field_data: {
						lyrics: "Auto-add E2E",
					},
				},
			},
		};
		const result = yield* $(postJson(page, apiSongsSavePath, payload));
		const data = extractDataRecord(result);
		const songId = data["song_id"];
		if (typeof songId !== "string" || songId === "") {
			return yield* $(Effect.fail(new Error(`Missing song_id: ${JSON.stringify(result)}`)));
		}
		return songId;
	});
}

/**
 * Creates a playlist via API.
 *
 * @param page Authenticated test page.
 * @param playlistName Playlist name.
 * @param playlistSlug Playlist slug.
 * @returns Effect that resolves when playlist is created.
 */
function createPlaylist(
	page: Page,
	playlistName: string,
	playlistSlug: string,
): Effect.Effect<void, Error> {
	return Effect.gen(function* createPlaylistEffect($) {
		yield* $(
			postJson(page, apiPlaylistSavePath, {
				playlist_name: playlistName,
				playlist_slug: playlistSlug,
				song_order: [],
			}),
		);
	});
}

/**
 * Creates an event via API.
 *
 * @param page Authenticated test page.
 * @param eventName Event name.
 * @param eventSlug Event slug.
 * @returns Effect that resolves when event is created.
 */
function createEvent(page: Page, eventName: string, eventSlug: string): Effect.Effect<void, Error> {
	return Effect.gen(function* createEventEffect($) {
		yield* $(
			postJson(page, apiEventSavePath, {
				event_name: eventName,
				event_slug: eventSlug,
				event_description: "Library auto-add E2E event",
				is_public: false,
			}),
		);
	});
}

/**
 * Creates a community via API.
 *
 * @param page Authenticated test page.
 * @param communityName Community name.
 * @param communitySlug Community slug.
 * @returns Effect that resolves when community is created.
 */
function createCommunity(
	page: Page,
	communityName: string,
	communitySlug: string,
): Effect.Effect<void, Error> {
	return Effect.gen(function* createCommunityEffect($) {
		yield* $(
			postJson(page, apiCommunitySavePath, {
				name: communityName,
				slug: communitySlug,
				description: "Library auto-add E2E community",
				is_public: false,
			}),
		);
	});
}

/**
 * Uploads an image via API.
 *
 * @param page Authenticated test page.
 * @param imageName Image name.
 * @returns Effect that resolves with the uploaded image slug.
 */
function uploadImage(page: Page, imageName: string): Effect.Effect<string, Error> {
	return Effect.gen(function* uploadImageEffect($) {
		const response = yield* $(
			fromPromise(() =>
				page.request.post(new URL(apiImageUploadPath, BASE_URL).toString(), {
					multipart: {
						image_name: imageName,
						description: "Library auto-add E2E image",
						alt_text: "Library auto-add E2E alt",
						file: {
							name: "pixel.png",
							mimeType: "image/png",
							buffer: Buffer.from(PNG_PIXEL_BASE64, "base64"),
						},
					},
				}),
			),
		);
		yield* $(assertOkResponse(response, apiImageUploadPath));

		const responseText = yield* $(fromPromise(() => response.text()));
		const parsed = yield* $(
			Effect.try({
				try: () => JSON.parse(responseText) as unknown,
				catch: (error) =>
					error instanceof Error
						? error
						: new Error(`Failed to parse upload response: ${responseText}`),
			}),
		);
		const data = extractDataRecord(parsed);
		const imageSlug = data["image_slug"];
		if (typeof imageSlug !== "string" || imageSlug === "") {
			return yield* $(
				Effect.fail(new Error(`Missing image_slug in upload response: ${responseText}`)),
			);
		}

		return imageSlug;
	});
}

/**
 * Creates a tag by adding it to an existing song.
 *
 * @param page Authenticated test page.
 * @param songId Song id to attach the tag to.
 * @param tagSlug Tag slug to create.
 * @returns Effect that resolves when tag add API succeeds.
 */
function createTagViaSong(page: Page, songId: string, tagSlug: string): Effect.Effect<void, Error> {
	return Effect.gen(function* createTagViaSongEffect($) {
		yield* $(
			postJson(page, apiTagAddToItemPath, {
				item_id: songId,
				item_type: "song",
				tag_slug: tagSlug,
			}),
		);
	});
}

test.describe("Library Auto-Add", () => {
	test.skip(missingSession, "Skipped: run npm run e2e:create-session:staging-db");
	test.use({ storageState: GOOGLE_USER_SESSION_PATH });

	test("creating a song auto-adds it to song library", async ({ page }) => {
		await runEffect(
			Effect.gen(function* songAutoAddEffect($) {
				const suffix = makeUniqueSuffix();
				const songName = `e2e song ${suffix}`;
				const songSlug = `e2e-song-${suffix}`;

				yield* $(createSong(page, songName, songSlug));
				yield* $(expectItemInLibrary(page, "song-library", songName));
			}),
		);
	});

	test("creating a playlist auto-adds it to playlist library", async ({ page }) => {
		await runEffect(
			Effect.gen(function* playlistAutoAddEffect($) {
				const suffix = makeUniqueSuffix();
				const playlistName = `e2e playlist ${suffix}`;
				const playlistSlug = `e2e-playlist-${suffix}`;

				yield* $(createPlaylist(page, playlistName, playlistSlug));
				yield* $(expectItemInLibrary(page, "playlist-library", playlistName));
			}),
		);
	});

	test("creating an image auto-adds it to image library", async ({ page }) => {
		test.slow();
		await runEffect(
			Effect.gen(function* imageAutoAddEffect($) {
				const suffix = makeUniqueSuffix();
				const imageName = `e2e image ${suffix}`;

				yield* $(uploadImage(page, imageName));
				yield* $(expectItemInLibrary(page, "image-library", imageName));
			}),
		);
	});

	test("creating an event auto-adds it to event library", async ({ page }) => {
		await runEffect(
			Effect.gen(function* eventAutoAddEffect($) {
				const suffix = makeUniqueSuffix();
				const eventName = `e2e event ${suffix}`;
				const eventSlug = `e2e-event-${suffix}`;

				yield* $(createEvent(page, eventName, eventSlug));
				yield* $(expectItemInLibrary(page, "event-library", eventName));
			}),
		);
	});

	test("creating a community auto-adds it to community library", async ({ page }) => {
		await runEffect(
			Effect.gen(function* communityAutoAddEffect($) {
				const suffix = makeUniqueSuffix();
				const communityName = `e2e community ${suffix}`;
				const communitySlug = `e2e-community-${suffix}`;

				yield* $(createCommunity(page, communityName, communitySlug));
				yield* $(expectItemInLibrary(page, "community-library", communityName));
			}),
		);
	});

	test("creating a tag auto-adds it to tag library", async ({ page }) => {
		await runEffect(
			Effect.gen(function* tagAutoAddEffect($) {
				const suffix = makeUniqueSuffix();
				const tagSlug = `e2e-tag-${suffix}`;
				const songName = `e2e tag source song ${suffix}`;
				const songSlug = `e2e-tag-song-${suffix}`;

				const songId = yield* $(createSong(page, songName, songSlug));
				yield* $(createTagViaSong(page, songId, tagSlug));
				yield* $(expectItemInLibrary(page, "tag-library", tagSlug));
			}),
		);
	});
});
