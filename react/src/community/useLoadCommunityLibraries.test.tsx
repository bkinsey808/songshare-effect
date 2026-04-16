import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";

import useLoadCommunityLibraries from "./useLoadCommunityLibraries";

/**
 * Harness for useLoadCommunityLibraries.
 * Mounts the hook with `userId`, `fetchSongLibrary`, and `fetchPlaylistLibrary`.
 * Both fetch functions run when `userId` is defined.
 *
 * @param props - harness props
 * @param props.userId - user id to pass to the hook
 * @param props.fetchSongLibrary - effect to fetch the song library
 * @param props.fetchPlaylistLibrary - effect to fetch the playlist library
 * @returns ReactElement used in tests
 */
function Harness(props: {
	userId: string | undefined;
	fetchSongLibrary: () => Effect.Effect<void, Error>;
	fetchPlaylistLibrary: () => Effect.Effect<void, Error>;
}): ReactElement {
	useLoadCommunityLibraries(props.userId, props.fetchSongLibrary, props.fetchPlaylistLibrary);
	return <div data-testid="loader">userId={props.userId ?? "none"}</div>;
}

describe("useLoadCommunityLibraries", () => {
	it("calls both fetch functions when userId is defined", async () => {
		const fetchSongLibrary = vi.fn(() => Effect.void);
		const fetchPlaylistLibrary = vi.fn(() => Effect.void);

		render(
			<Harness
				userId={TEST_USER_ID}
				fetchSongLibrary={fetchSongLibrary}
				fetchPlaylistLibrary={fetchPlaylistLibrary}
			/>,
		);

		await waitFor(() => {
			expect(fetchSongLibrary).toHaveBeenCalledWith();
			expect(fetchPlaylistLibrary).toHaveBeenCalledWith();
		});
	});

	it("does not call fetch functions when userId is undefined", () => {
		const fetchSongLibrary = vi.fn(() => Effect.void);
		const fetchPlaylistLibrary = vi.fn(() => Effect.void);

		render(
			<Harness
				userId={undefined}
				fetchSongLibrary={fetchSongLibrary}
				fetchPlaylistLibrary={fetchPlaylistLibrary}
			/>,
		);

		expect(fetchSongLibrary).not.toHaveBeenCalled();
		expect(fetchPlaylistLibrary).not.toHaveBeenCalled();
	});

	it("harness renders userId in DOM", () => {
		cleanup();
		render(
			<Harness
				userId={TEST_USER_ID}
				fetchSongLibrary={() => Effect.void}
				fetchPlaylistLibrary={() => Effect.void}
			/>,
		);

		expect(screen.getByTestId("loader").textContent).toContain(TEST_USER_ID);
	});
});
