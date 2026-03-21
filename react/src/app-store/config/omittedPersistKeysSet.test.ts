import { describe, expect, it } from "vitest";

import omittedPersistKeysSet from "./omittedPersistKeysSet";

const EXPECTED_KEYS = [
	"showSignedInAlert",
	"activePrivateSongsUnsubscribe",
	"activePublicSongsUnsubscribe",
	"songLibraryUnsubscribe",
	"playlistLibraryUnsubscribe",
	"playlistLibraryPublicUnsubscribe",
	"userLibraryUnsubscribe",
	"tagLibraryUnsubscribe",
	"communities",
	"currentCommunity",
	"members",
	"communityEvents",
	"isCommunityLoading",
	"communityError",
	"isCommunitySaving",
] as const;

describe("omittedPersistKeysSet", () => {
	it("contains all expected omitted keys", () => {
		for (const key of EXPECTED_KEYS) {
			expect(omittedPersistKeysSet.has(key)).toBe(true);
		}
	});

	it("has correct size", () => {
		expect(omittedPersistKeysSet.size).toBe(EXPECTED_KEYS.length);
	});

	it("does not contain arbitrary keys", () => {
		expect(omittedPersistKeysSet.has("songLibrary")).toBe(false);
		expect(omittedPersistKeysSet.has("")).toBe(false);
	});
});
