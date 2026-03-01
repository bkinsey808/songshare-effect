/* eslint-disable */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import * as Router from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import useAppStoreModule from "@/react/app-store/useAppStore";
import { ONE_CALL } from "@/react/lib/test-helpers/test-consts";

import type { CommunityEntry, CommunityUser } from "../community-types";

import useCommunityView from "./useCommunityView";

function Harness() {
	const view = useCommunityView();
	return (
		<div>
			<div data-testid="isOwner">{String(view.isOwner)}</div>
			<div data-testid="isMember">{String(view.isMember)}</div>
			<div data-testid="canManage">{String(view.canManage)}</div>
			<div data-testid="canEdit">{String(view.canEdit)}</div>
			<div data-testid="isJoinLoading">{String(view.isJoinLoading)}</div>
			<div data-testid="isLeaveLoading">{String(view.isLeaveLoading)}</div>
			<button type="button" onClick={view.onManageClick}>
				manage
			</button>
			<button type="button" onClick={view.onEditClick}>
				edit
			</button>
			<button type="button" onClick={view.onJoinClick}>
				join
			</button>
			<button type="button" onClick={view.onLeaveClick}>
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

vi.mock("@/react/app-store/useAppStore", () => {
	let state: MockState = {
		fetchCommunityBySlug: () => Effect.succeed(undefined),
		currentCommunity: undefined,
		members: [],
		isCommunityLoading: false,
		communityError: undefined,
		joinCommunity: () => Effect.succeed(undefined),
		leaveCommunity: () => Effect.succeed(undefined),
		userSessionData: undefined,
	};

	const useAppStore = <T,>(selector: (stateParam: MockState) => T): T => selector(state);

	const __setMockState = (patch: Partial<MockState>): void => {
		state = { ...state, ...patch };
	};

	(useAppStore as unknown as { __setMockState?: (p: Partial<MockState>) => void }).__setMockState =
		__setMockState;

	return { default: useAppStore } as unknown as { default: typeof useAppStore };
});

vi.mock("react-router-dom", () => {
	const useNavigate = vi.fn(() => vi.fn());
	return {
		useNavigate,
		useParams: (): { community_slug: string } => ({ community_slug: "test-slug" }),
	};
});

// ensure DOM is cleaned between tests to avoid duplicate roots
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

vi.mock("@/react/lib/language/locale/useLocale", () => ({
	default: (): { lang: string; t: (k: string) => string } => ({
		lang: "en",
		t: (k: string) => k,
	}),
}));

vi.mock("@/shared/language/buildPathWithLang", () => ({
	default: (path: string, lang: string): string => `BUILT:${path}:${lang}`,
}));

const getSetMockState = (): ((p: Partial<MockState>) => void) | undefined =>
	(useAppStoreModule as unknown as { __setMockState?: (p: Partial<MockState>) => void })
		.__setMockState;

describe("useCommunityView", () => {
	it("derives flags for owner and member roles", () => {
		const setMock = getSetMockState();
		setMock?.({
			currentCommunity: {
				community_id: "c1",
				owner_id: "u1",
				name: "n",
				slug: "s",
				description: undefined as unknown as string | null,
				is_public: true,
				public_notes: undefined as unknown as string | null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
			userSessionData: { user: { user_id: "u1", username: "u1" } } as unknown as UserSessionData,
			members: [],
		});

		render(<Harness />);

		expect(screen.getByTestId("isOwner").textContent).toBe("true");
		expect(screen.getByTestId("isMember").textContent).toBe("true");
		expect(screen.getByTestId("canManage").textContent).toBe("true");
		expect(screen.getByTestId("canEdit").textContent).toBe("true");
	});

	it("grants manage to community_admin and marks member when joined", () => {
		const setMock = getSetMockState();
		setMock?.({
			currentCommunity: {
				community_id: "c2",
				owner_id: "owner-x",
				name: "n",
				slug: "s",
				description: undefined as unknown as string | null,
				is_public: true,
				public_notes: undefined as unknown as string | null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
			userSessionData: {
				user: { user_id: "member-1", username: "member-1" },
			} as unknown as UserSessionData,
			members: [
				{
					community_id: "c2",
					user_id: "member-1",
					role: "community_admin",
					status: "joined",
					joined_at: new Date().toISOString(),
				},
			],
		});

		render(<Harness />);

		expect(screen.getByTestId("isOwner").textContent).toBe("false");
		expect(screen.getByTestId("isMember").textContent).toBe("true");
		expect(screen.getByTestId("canManage").textContent).toBe("true");
		expect(screen.getByTestId("canEdit").textContent).toBe("false");
	});

	it("navigates to manage and edit paths", () => {
		const setMock = getSetMockState();
		const navigateMock = vi.fn();
		vi.mocked(Router.useNavigate).mockReturnValue(navigateMock);

		setMock?.({
			currentCommunity: {
				community_id: "c3",
				owner_id: "owner-y",
				name: "n",
				slug: "test-slug",
				description: undefined as unknown as string | null,
				is_public: true,
				public_notes: undefined as unknown as string | null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
		});

		render(<Harness />);

		fireEvent.click(screen.getByText("manage"));
		expect(navigateMock).toHaveBeenCalledTimes(ONE_CALL);

		fireEvent.click(screen.getByText("edit"));
		expect(navigateMock).toHaveBeenCalledTimes(ONE_CALL + ONE_CALL);
	});

	it("calls join/leave then refetches and toggles loading state", async () => {
		const setMock = getSetMockState();
		const joinMock = vi.fn(() => Effect.succeed(undefined));
		const leaveMock = vi.fn(() => Effect.succeed(undefined));
		const fetchMock = vi.fn(() => Effect.succeed(undefined));

		setMock?.({
			currentCommunity: {
				community_id: "c5",
				owner_id: "owner-a",
				name: "n",
				slug: "s",
				description: undefined as unknown as string | null,
				is_public: true,
				public_notes: undefined as unknown as string | null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
			joinCommunity: joinMock,
			leaveCommunity: leaveMock,
			fetchCommunityBySlug: fetchMock,
			userSessionData: { user: { user_id: "uX", username: "uX" } } as unknown as UserSessionData,
			members: [],
		});

		render(<Harness />);

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
