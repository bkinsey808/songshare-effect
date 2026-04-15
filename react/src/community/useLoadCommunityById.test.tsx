import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { CommunityEntry } from "./community-types";
import useLoadCommunityById from "./useLoadCommunityById";

vi.mock("@/react/app-store/useAppStore");

const COMMUNITY_ID = "comm-123";

/**
 * Install a mocked app store for `useLoadCommunityById` tests.
 *
 * @param opts - Options to configure the mocked store selectors and effects.
 * @returns void
 */
function installStore(opts: {
	currentCommunity?: CommunityEntry | null | undefined;
	fetchCommunityById: (id: string) => Effect.Effect<unknown, Error>;
}): void {
	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: typeof opts) => unknown>(selector)(opts),
	);
}

/**
 * Harness for useLoadCommunityById.
 * Mounts the hook; fetchCommunityById runs when communityId is set and
 * differs from currentCommunity.
 */
function Harness(props: { communityId: string | undefined }): ReactElement {
	useLoadCommunityById(props.communityId);
	return <div data-testid="loader">id={props.communityId ?? "none"}</div>;
}

describe("useLoadCommunityById", () => {
	it("calls fetchCommunityById when communityId differs from currentCommunity", async () => {
		const fetchCommunityById = vi.fn(() => Effect.void);

		installStore({
			fetchCommunityById,
		});

		render(<Harness communityId={COMMUNITY_ID} />);

		await waitFor(() => {
			expect(fetchCommunityById).toHaveBeenCalledWith(COMMUNITY_ID);
		});
	});

	it("does not call fetchCommunityById when communityId matches currentCommunity", () => {
		const fetchCommunityById = vi.fn(() => Effect.void);
		const currentCommunity = forceCast<CommunityEntry>({ community_id: COMMUNITY_ID });

		installStore({
			currentCommunity,
			fetchCommunityById,
		});

		render(<Harness communityId={COMMUNITY_ID} />);

		expect(fetchCommunityById).not.toHaveBeenCalled();
	});

	it("harness renders communityId in DOM", () => {
		cleanup();
		installStore({
			fetchCommunityById: () => Effect.void,
		});

		render(<Harness communityId={COMMUNITY_ID} />);

		expect(screen.getByTestId("loader").textContent).toContain(COMMUNITY_ID);
	});
});
