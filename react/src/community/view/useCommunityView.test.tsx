import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { useNavigate, useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useLocale from "@/react/lib/language/locale/useLocale";
import forceCast from "@/react/lib/test-utils/forceCast";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import type { UserSessionData } from "@/shared/userSessionData";

import type { CommunityEntry, CommunityUser } from "../community-types";
import subscribeToCommunityEvent from "../subscribe/subscribeToCommunityEvent";
import subscribeToCommunityPublic from "../subscribe/subscribeToCommunityPublic";
import useCommunityView from "./useCommunityView";

function Harness(): ReactElement {
	const view = useCommunityView();
	const handleManageClick = view.onManageClick;
	const handleEditClick = view.onEditClick;
	const handleJoinClick = view.onJoinClick;
	const handleLeaveClick = view.onLeaveClick;

	return (
		<div>
			<div data-testid="isOwner">{String(view.isOwner)}</div>
			<div data-testid="isMember">{String(view.isMember)}</div>
			<div data-testid="canManage">{String(view.canManage)}</div>
			<div data-testid="canEdit">{String(view.canEdit)}</div>
			<div data-testid="isJoinLoading">{String(view.isJoinLoading)}</div>
			<div data-testid="isLeaveLoading">{String(view.isLeaveLoading)}</div>
			<button type="button" onClick={handleManageClick}>
				manage
			</button>
			<button type="button" onClick={handleEditClick}>
				edit
			</button>
			<button type="button" onClick={handleJoinClick}>
				join
			</button>
			<button type="button" onClick={handleLeaveClick}>
				leave
			</button>
		</div>
	);
}

type MockState = {
	fetchCommunityBySlug: (
		slug: string,
		opts?: { silent?: boolean },
	) => Effect.Effect<unknown, unknown, unknown>;
	currentCommunity?: CommunityEntry | undefined;
	members: CommunityUser[];
	communityEvents: [];
	isCommunityLoading: boolean;
	communityError?: string | undefined;
	joinCommunity: (
		id: string,
		opts?: { silent?: boolean },
	) => Effect.Effect<unknown, unknown, unknown>;
	leaveCommunity: (
		id: string,
		opts?: { silent?: boolean },
	) => Effect.Effect<unknown, unknown, unknown>;
	userSessionData?: UserSessionData | undefined;
};

vi.mock("react-router-dom");
vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/lib/language/locale/useLocale");
vi.mock("@/shared/language/buildPathWithLang");
vi.mock("../subscribe/subscribeToCommunityEvent");
vi.mock("../subscribe/subscribeToCommunityPublic");

const ONE_CALL = 1;
const TWO_CALLS = 2;

function makeCommunity(overrides: Partial<CommunityEntry> = {}): CommunityEntry {
	return {
		community_id: "community-1",
		owner_id: "owner-1",
		name: "Community",
		slug: "test-slug",
		description: forceCast<string | null>(undefined),
		is_public: true,
		public_notes: forceCast<string | null>(undefined),
		created_at: "2026-01-01T00:00:00Z",
		updated_at: "2026-01-01T00:00:00Z",
		...overrides,
	};
}

function makeUserSession(userId: string): UserSessionData {
	return forceCast<UserSessionData>({ user: { user_id: userId, username: userId } });
}

function installBaseMocks(state: MockState): void {
	const navigateMock = vi.fn();

	vi.mocked(useParams).mockReturnValue({ community_slug: "test-slug" });
	vi.mocked(useNavigate).mockReturnValue(navigateMock);
	vi.mocked(useLocale).mockReturnValue(
		forceCast<ReturnType<typeof useLocale>>({
			lang: "en",
			t: (value: string): string => value,
		}),
	);
	vi.mocked(buildPathWithLang).mockImplementation((path, lang) => `BUILT:${path}:${lang}`);
	vi.mocked(useAppStore).mockImplementation((selector) =>
		forceCast<(store: MockState) => unknown>(selector)(state),
	);
	vi.mocked(subscribeToCommunityEvent).mockReturnValue(Effect.succeed(() => undefined));
	vi.mocked(subscribeToCommunityPublic).mockReturnValue(Effect.succeed(() => undefined));
}

function renderHarness(): void {
	cleanup();
	render(<Harness />);
}

describe("useCommunityView", () => {
	it("derives flags for owner and member roles", () => {
		installBaseMocks({
			fetchCommunityBySlug: () => Effect.succeed(undefined),
			currentCommunity: makeCommunity({ community_id: "c1", owner_id: "u1", slug: "s" }),
			members: [],
			communityEvents: [],
			isCommunityLoading: false,
			communityError: undefined,
			joinCommunity: () => Effect.succeed(undefined),
			leaveCommunity: () => Effect.succeed(undefined),
			userSessionData: makeUserSession("u1"),
		});

		renderHarness();

		expect(screen.getByTestId("isOwner").textContent).toBe("true");
		expect(screen.getByTestId("isMember").textContent).toBe("true");
		expect(screen.getByTestId("canManage").textContent).toBe("true");
		expect(screen.getByTestId("canEdit").textContent).toBe("true");
	});

	it("grants manage to community_admin and marks member when joined", () => {
		installBaseMocks({
			fetchCommunityBySlug: () => Effect.succeed(undefined),
			currentCommunity: makeCommunity({ community_id: "c2", owner_id: "owner-x", slug: "s" }),
			members: [
				{
					community_id: "c2",
					user_id: "member-1",
					role: "community_admin",
					status: "joined",
					joined_at: "2026-01-01T00:00:00Z",
				},
			],
			communityEvents: [],
			isCommunityLoading: false,
			communityError: undefined,
			joinCommunity: () => Effect.succeed(undefined),
			leaveCommunity: () => Effect.succeed(undefined),
			userSessionData: makeUserSession("member-1"),
		});

		renderHarness();

		expect(screen.getByTestId("isOwner").textContent).toBe("false");
		expect(screen.getByTestId("isMember").textContent).toBe("true");
		expect(screen.getByTestId("canManage").textContent).toBe("true");
		expect(screen.getByTestId("canEdit").textContent).toBe("false");
	});

	it("navigates to manage and edit paths", () => {
		const navigateMock = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(navigateMock);
		installBaseMocks({
			fetchCommunityBySlug: () => Effect.succeed(undefined),
			currentCommunity: makeCommunity({
				community_id: "c3",
				owner_id: "owner-y",
				slug: "test-slug",
			}),
			members: [],
			communityEvents: [],
			isCommunityLoading: false,
			communityError: undefined,
			joinCommunity: () => Effect.succeed(undefined),
			leaveCommunity: () => Effect.succeed(undefined),
			userSessionData: undefined,
		});
		vi.mocked(useNavigate).mockReturnValue(navigateMock);

		renderHarness();

		fireEvent.click(screen.getByText("manage"));
		expect(navigateMock).toHaveBeenCalledTimes(ONE_CALL);

		fireEvent.click(screen.getByText("edit"));
		expect(navigateMock).toHaveBeenCalledTimes(TWO_CALLS);
	});

	it("calls join and leave then refetches and toggles loading state", async () => {
		const joinMock = vi.fn(() => Effect.succeed(undefined));
		const leaveMock = vi.fn(() => Effect.succeed(undefined));
		const fetchMock = vi.fn(() => Effect.succeed(undefined));

		installBaseMocks({
			fetchCommunityBySlug: fetchMock,
			currentCommunity: makeCommunity({ community_id: "c5", owner_id: "owner-a", slug: "s" }),
			members: [],
			communityEvents: [],
			isCommunityLoading: false,
			communityError: undefined,
			joinCommunity: joinMock,
			leaveCommunity: leaveMock,
			userSessionData: makeUserSession("ux"),
		});

		renderHarness();

		const beforeJoinFetchCalls = fetchMock.mock.calls.length;
		fireEvent.click(screen.getByText("join"));
		expect(screen.getByTestId("isJoinLoading").textContent).toBe("true");
		await waitFor(() => {
			expect(screen.getByTestId("isJoinLoading").textContent).toBe("false");
		});
		expect(joinMock).toHaveBeenCalledWith("c5", { silent: true });
		expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(beforeJoinFetchCalls + ONE_CALL);

		const beforeLeaveFetchCalls = fetchMock.mock.calls.length;
		fireEvent.click(screen.getByText("leave"));
		expect(screen.getByTestId("isLeaveLoading").textContent).toBe("true");
		await waitFor(() => {
			expect(screen.getByTestId("isLeaveLoading").textContent).toBe("false");
		});
		expect(leaveMock).toHaveBeenCalledWith("c5", { silent: true });
		expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(beforeLeaveFetchCalls + ONE_CALL);
	});
});
