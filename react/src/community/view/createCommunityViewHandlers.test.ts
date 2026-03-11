import { waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import postJson from "@/shared/fetch/postJson";
import buildPathWithLang from "@/shared/language/buildPathWithLang";

import type { CommunityEntry } from "../community-types";
import createCommunityViewHandlers from "./createCommunityViewHandlers";

vi.mock("@/shared/fetch/postJson");
vi.mock("@/shared/language/buildPathWithLang");

const SLUG = "test-community";
const COMMUNITY_ID = "community-1";
const SONG_ID = "song-1";
const PLAYLIST_ID = "playlist-1";
const ONE_CALL = 1;

/** Builds a CommunityEntry fixture with defaults; overrides allow per-test customization. */
function makeCommunity(overrides: Partial<CommunityEntry> = {}): CommunityEntry {
	return forceCast<CommunityEntry>({
		community_id: COMMUNITY_ID,
		owner_id: "owner-1",
		name: "Test Community",
		slug: SLUG,
		description: undefined,
		is_public: true,
		public_notes: undefined,
		created_at: "2026-01-01T00:00:00Z",
		updated_at: "2026-01-01T00:00:00Z",
		...overrides,
	});
}

type FirstParam<Fn> = Fn extends (arg: infer Arg, ..._rest: never[]) => unknown ? Arg : never;
type TestParams = FirstParam<typeof createCommunityViewHandlers> & {
	navigate: ReturnType<typeof vi.fn>;
	fetchCommunityBySlug: ReturnType<typeof vi.fn>;
	joinCommunity: ReturnType<typeof vi.fn>;
	leaveCommunity: ReturnType<typeof vi.fn>;
	setIsJoinLoading: ReturnType<typeof vi.fn>;
	setIsLeaveLoading: ReturnType<typeof vi.fn>;
};

/** Builds handler params with vi.fn() stubs and buildPathWithLang mock; overrides can extend defaults. */
function makeParams(overrides: Record<string, unknown> = {}): TestParams {
	const navigate = vi.fn();
	const fetchCommunityBySlug = vi.fn(() => Effect.succeed(undefined));
	const joinCommunity = vi.fn(() => Effect.succeed(undefined));
	const leaveCommunity = vi.fn(() => Effect.succeed(undefined));
	const setIsJoinLoading = vi.fn();
	const setIsLeaveLoading = vi.fn();

	vi.mocked(buildPathWithLang).mockImplementation((path, lang) => `BUILT:${path}:${lang}`);

	return {
		lang: "en" as const,
		navigate,
		communitySlug: SLUG,
		communityId: COMMUNITY_ID,
		currentCommunity: makeCommunity(),
		fetchCommunityBySlug,
		joinCommunity,
		leaveCommunity,
		setIsJoinLoading,
		setIsLeaveLoading,
		...overrides,
	};
}

describe("createCommunityViewHandlers", () => {
	it("returns all handler functions", () => {
		const params = makeParams();
		const handlers = createCommunityViewHandlers(params);
		const handlerKeys = [
			"onJoinClick",
			"onLeaveClick",
			"onManageClick",
			"onEditClick",
			"onShareSongClick",
			"onSharePlaylistClick",
			"onRefreshCommunity",
		] as const;
		expect(handlerKeys.every((key) => typeof handlers[key] === "function")).toBe(true);
	});

	it("onManageClick navigates to manage path when slug is present", () => {
		const params = makeParams();
		const { onManageClick } = createCommunityViewHandlers(params);

		onManageClick();

		expect(params.navigate).toHaveBeenCalledTimes(ONE_CALL);
		expect(params.navigate).toHaveBeenCalledWith(expect.stringContaining(`/${SLUG}/`));
	});

	it("onManageClick does not navigate when slug is empty", () => {
		const params = makeParams({ communitySlug: "" });
		const { onManageClick } = createCommunityViewHandlers(params);

		onManageClick();

		expect(params.navigate).not.toHaveBeenCalled();
	});

	it("onEditClick navigates to edit path when community exists", () => {
		const params = makeParams();
		const { onEditClick } = createCommunityViewHandlers(params);

		onEditClick();

		expect(params.navigate).toHaveBeenCalledTimes(ONE_CALL);
		expect(params.navigate).toHaveBeenCalledWith(expect.stringContaining(COMMUNITY_ID));
	});

	it("onEditClick does not navigate when community is undefined", () => {
		const params = makeParams({ currentCommunity: undefined });
		const { onEditClick } = createCommunityViewHandlers(params);

		onEditClick();

		expect(params.navigate).not.toHaveBeenCalled();
	});

	it("onJoinClick calls joinCommunity and refreshCommunity on success", async () => {
		const params = makeParams();
		const { onJoinClick } = createCommunityViewHandlers(params);

		onJoinClick();

		await waitFor(() => {
			expect(params.joinCommunity).toHaveBeenCalledWith(COMMUNITY_ID, {
				silent: true,
			});
		});
		await waitFor(() => {
			expect(params.fetchCommunityBySlug).toHaveBeenCalledWith(SLUG, {
				silent: true,
			});
		});
		expect(params.setIsJoinLoading).toHaveBeenCalledWith(true);
		expect(params.setIsJoinLoading).toHaveBeenCalledWith(false);
	});

	it("onLeaveClick calls leaveCommunity and refreshCommunity on success", async () => {
		const params = makeParams();
		const { onLeaveClick } = createCommunityViewHandlers(params);

		onLeaveClick();

		await waitFor(() => {
			expect(params.leaveCommunity).toHaveBeenCalledWith(COMMUNITY_ID, {
				silent: true,
			});
		});
		await waitFor(() => {
			expect(params.fetchCommunityBySlug).toHaveBeenCalledWith(SLUG, {
				silent: true,
			});
		});
		expect(params.setIsLeaveLoading).toHaveBeenCalledWith(true);
		expect(params.setIsLeaveLoading).toHaveBeenCalledWith(false);
	});

	it("onShareSongClick posts share request and refreshes on success", async () => {
		const params = makeParams();
		vi.mocked(postJson).mockResolvedValue(undefined);
		const { onShareSongClick } = createCommunityViewHandlers(params);

		onShareSongClick(SONG_ID);

		await waitFor(() => {
			expect(vi.mocked(postJson)).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					community_id: COMMUNITY_ID,
					shared_item_type: "song",
					shared_item_id: SONG_ID,
				}),
			);
		});
		await waitFor(() => {
			expect(params.fetchCommunityBySlug).toHaveBeenCalledWith(SLUG, {
				silent: true,
			});
		});
	});

	it("onShareSongClick does nothing when communityId is undefined", () => {
		vi.mocked(postJson).mockClear();
		const params = makeParams({ communityId: undefined });
		const { onShareSongClick } = createCommunityViewHandlers(params);

		onShareSongClick(SONG_ID);

		expect(vi.mocked(postJson)).not.toHaveBeenCalled();
	});

	it("onSharePlaylistClick posts share request and refreshes on success", async () => {
		const params = makeParams();
		vi.mocked(postJson).mockResolvedValue(undefined);
		const { onSharePlaylistClick } = createCommunityViewHandlers(params);

		onSharePlaylistClick(PLAYLIST_ID);

		await waitFor(() => {
			expect(vi.mocked(postJson)).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					community_id: COMMUNITY_ID,
					shared_item_type: "playlist",
					shared_item_id: PLAYLIST_ID,
				}),
			);
		});
		await waitFor(() => {
			expect(params.fetchCommunityBySlug).toHaveBeenCalledWith(SLUG, {
				silent: true,
			});
		});
	});

	it("onRefreshCommunity calls fetchCommunityBySlug with slug", async () => {
		const params = makeParams();
		const { onRefreshCommunity } = createCommunityViewHandlers(params);

		onRefreshCommunity();

		await waitFor(() => {
			expect(params.fetchCommunityBySlug).toHaveBeenCalledWith(SLUG, {
				silent: true,
			});
		});
	});
});
