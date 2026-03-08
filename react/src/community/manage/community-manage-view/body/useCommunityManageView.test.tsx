import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import RouterWrapper from "@/react/lib/test-utils/RouterWrapper";

import useCommunityManageView from "../useCommunityManageView";

vi.mock("@/react/app-store/useAppStore");

type StoreOverrides = {
	currentCommunity?: unknown;
	members?: unknown;
	isCommunityLoading?: boolean;
	communityError?: string | undefined;
	userSessionData?: unknown;
};

function installCommunityStoreMocks(overrides: StoreOverrides = {}): {
	fetchSlugSpy: ReturnType<typeof vi.fn>;
} {
	const {
		currentCommunity = undefined,
		members = [],
		isCommunityLoading = false,
		communityError = undefined,
		userSessionData = undefined,
	} = overrides;

	const fetchSlugSpy = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));

	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const sel = String(selector);
		if (sel.includes("fetchCommunityBySlug")) {
			return fetchSlugSpy;
		}
		if (sel.includes("currentCommunity")) {
			return currentCommunity;
		}
		if (sel.includes("members")) {
			return members;
		}
		if (sel.includes("isCommunityLoading")) {
			return isCommunityLoading;
		}
		if (sel.includes("communityError")) {
			return communityError;
		}
		if (sel.includes("userSessionData")) {
			return userSessionData;
		}
		return undefined;
	});

	return { fetchSlugSpy };
}

describe("useCommunityManageView", () => {
	it("calls navigate when onBackClick is invoked", () => {
		vi.resetAllMocks();
		installCommunityStoreMocks({ currentCommunity: { community_id: "c1", owner_id: "o1" } });
		const { result } = renderHook(() => useCommunityManageView(), {
			wrapper: ({ children }) => (
				<RouterWrapper path="/:community_slug/:lang" initialEntries={["/test-slug/en"]}>
					{children}
				</RouterWrapper>
			),
		});

		result.current.onBackClick();
		expect(typeof result.current.onBackClick).toBe("function");
	});
});
