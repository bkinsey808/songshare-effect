import { existsSync } from "node:fs";

import { GOOGLE_USER_SESSION_PATH, GOOGLE_USER_SESSION_PATH_2 } from "@/e2e/utils/auth-helpers";

export const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? "https://127.0.0.1:5173";

export const MANAGE_PAGE_READY_TIMEOUT_MS = 75_000;
export const REALTIME_WAIT_MS = 20_000;
export const NO_ERRORS = 0;
export const KICK_SETTLE_MS = 4000;
export const MAX_CLEANUP_ATTEMPTS = 10;
export const USER_SEARCH_SUGGESTION_TIMEOUT_MS = 120_000;
export const INVITE_SUCCESS_TIMEOUT_MS = 60_000;
export const SHARE_CREATE_TIMEOUT_MS = 120_000;

export const testUser2Username = String(process.env["E2E_TEST_USER2_USERNAME"] ?? "");
export const testSongSlug = String(process.env["E2E_TEST_SONG_SLUG"] ?? "");
export const testPlaylistSlug = String(process.env["E2E_TEST_PLAYLIST_SLUG"] ?? "");
export const testCommunitySlug = String(process.env["E2E_TEST_COMMUNITY_SLUG"] ?? "");
export const testEventSlug = String(process.env["E2E_TEST_EVENT_SLUG"] ?? "");

export const missingBothSessions = !(
	existsSync(GOOGLE_USER_SESSION_PATH) && existsSync(GOOGLE_USER_SESSION_PATH_2)
);
export const missingUser2Username = testUser2Username === "";
export const missingSongSlug = testSongSlug === "";
export const missingPlaylistSlug = testPlaylistSlug === "";
export const missingCommunitySlug = testCommunitySlug === "";
export const missingEventSlug = testEventSlug === "";
