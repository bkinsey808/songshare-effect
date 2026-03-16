import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import buildPathWithLang from "@/shared/language/buildPathWithLang";

import createCommunityManageHandlers from "./createCommunityManageHandlers";

vi.mock("@/shared/language/buildPathWithLang");
vi.mock("../../runCommunityAction");

const SLUG = "test-community";
const COMMUNITY_ID = "community-1";
const LANG = "en";
const FIRST_PARAM = 0;

type CreateParams = Parameters<typeof createCommunityManageHandlers>[typeof FIRST_PARAM];

const SAMPLE_COMMUNITY = forceCast<CreateParams["currentCommunity"]>({
	community_id: COMMUNITY_ID,
	owner_id: "owner-1",
	name: "Test",
	slug: SLUG,
	description: undefined,
	is_public: true,
	public_notes: undefined,
	created_at: "2026-01-01T00:00:00Z",
	updated_at: "2026-01-01T00:00:00Z",
});

/** Builds minimal params for createCommunityManageHandlers tests. */
function makeParams(overrides: Partial<CreateParams> = {}): CreateParams {
	const navigate = vi.fn();
	const fetchCommunityBySlug = vi.fn(() => Effect.succeed(undefined));
	const setActionState = vi.fn();
	return {
		communitySlug: SLUG,
		currentCommunity: SAMPLE_COMMUNITY,
		members: [],
		langForNav: LANG as "en",
		navigate,
		fetchCommunityBySlug,
		setActionState,
		inviteUserIdInput: undefined,
		setInviteUserIdInput: vi.fn(),
		addEventIdInput: undefined,
		setAddEventIdInput: vi.fn(),
		addSongIdInput: undefined,
		setAddSongIdInput: vi.fn(),
		addPlaylistIdInput: undefined,
		setAddPlaylistIdInput: vi.fn(),
		...overrides,
	};
}

describe("createCommunityManageHandlers", () => {
	it("returns all handler functions", () => {
		vi.mocked(buildPathWithLang).mockImplementation((path, lang) => `/${lang}${path}`);

		const params = makeParams();
		const handlers = createCommunityManageHandlers(params);

		const handlerKeys = [
			"onInviteClick",
			"onAddEventClick",
			"onRemoveEventClick",
			"onAddSongClick",
			"onRemoveSongClick",
			"onAddPlaylistClick",
			"onRemovePlaylistClick",
			"onReviewShareRequestClick",
			"onSetActiveEventClick",
			"onKickClick",
			"onBackClick",
		] as const;
		expect(handlerKeys.every((key) => typeof handlers[key] === "function")).toBe(true);
	});

	it("onBackClick calls navigate with community view path when communitySlug is set", () => {
		vi.mocked(buildPathWithLang).mockImplementation((path, lang) => `/${lang}${path}`);
		const navigate = vi.fn();
		const params = makeParams({ navigate });

		const handlers = createCommunityManageHandlers(params);
		handlers.onBackClick();

		expect(navigate).toHaveBeenCalledWith(expect.stringContaining(`/${SLUG}`));
	});

	it("onBackClick does not call navigate when communitySlug is empty", () => {
		const navigate = vi.fn();
		const params = makeParams({ communitySlug: "", navigate });

		const handlers = createCommunityManageHandlers(params);
		handlers.onBackClick();

		expect(navigate).not.toHaveBeenCalled();
	});
});
