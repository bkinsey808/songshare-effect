import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { resetAllSlices } from "@/react/app-store/slice-reset-fns";
import useAppStore from "@/react/app-store/useAppStore";
import { ONCE } from "@/react/lib/test-helpers/test-consts.ts";
import makeAppSlice from "@/react/lib/test-utils/makeAppSlice";
import makeNull from "@/react/lib/test-utils/makeNull.test-util";
import getJson from "@/shared/fetch/getJson";

import type { CommunityEntry } from "../community-types";

import useCommunityLibrary from "./useCommunityLibrary";

vi.mock("@/shared/fetch/getJson");

// Default mock ensures accidental calls to the real network helper don't run.
vi.mocked(getJson).mockResolvedValue([]);

const TEST_COMM_ID = "c1";
const TEST_ERROR = "boom";

describe("useCommunityLibrary", () => {
	it("calls fetchCommunityLibrary on mount", async () => {
		resetAllSlices();
		const fetchCommunityLibrary = vi.fn(() => Effect.succeed([] as const));

		const store = useAppStore;
		const original = store.getState().fetchCommunityLibrary;

		store.setState(makeAppSlice({ fetchCommunityLibrary }));

		// mount the hook
		renderHook(() => useCommunityLibrary());

		// allow microtasks for Effect.runPromise
		await Promise.resolve();
		await Promise.resolve();

		expect(fetchCommunityLibrary).toHaveBeenCalledTimes(ONCE);

		store.setState(makeAppSlice({ fetchCommunityLibrary: original }));
	});

	it("returns store values for communities/loading/error", async () => {
		resetAllSlices();
		const entry: CommunityEntry = {
			community_id: TEST_COMM_ID,
			owner_id: "o1",
			name: "Test Community",
			slug: "test-community",
			description: makeNull(),
			is_public: true,
			public_notes: makeNull(),
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		const store = useAppStore;
		const originalCommunities = store.getState().communities;
		const originalLoading = store.getState().isCommunityLoading;
		const originalError = store.getState().communityError;

		store.setState(
			makeAppSlice({
				communities: [entry],
				isCommunityLoading: true,
				communityError: TEST_ERROR,
				// prevent real fetch from running
				fetchCommunityLibrary: () => Effect.succeed([] as const),
			}),
		);

		// allow microtasks
		await Promise.resolve();

		const { result } = renderHook(() => useCommunityLibrary());

		expect(result.current.communities).toStrictEqual([entry]);
		expect(result.current.isCommunityLoading).toBe(true);
		expect(result.current.communityError).toBe(TEST_ERROR);

		store.setState(
			makeAppSlice({
				communities: originalCommunities,
				isCommunityLoading: originalLoading,
				communityError: originalError,
			}),
		);
	});
});
